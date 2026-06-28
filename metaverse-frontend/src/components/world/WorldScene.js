import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, ContactShadows, Environment, Html } from "@react-three/drei";
import Ground from "./scene/Ground";
import WorldLights from "./scene/WorldLights";
import WorldProps from "./scene/WorldProps";
import Player from "./player/Player";
import FollowCamera from "./camera/FollowCamera";
import WorldOverlay from "./ui/WorldOverlay";
import useWorldMultiplayer from "./multiplayer/useWorldMultiplayer";
import RemotePlayers from "./multiplayer/RemotePlayers";
import ProfileService from "../../services/profile.service";
import NpcInteraction from "./npc/NpcInteraction";
import NpcChatWindow from "./ui/NpcChatWindow";
import { DEFAULT_AVATAR_CUSTOMIZATION, mergeCustomization } from "../../constants/avatar";

const InteractionWatcher = ({ onNearNpc }) => {
  const { scene } = useThree();
  useFrame(() => {
    const position = scene.userData.playerPosition;
    if (!position) return;
    const dx = position.x - 5.5;
    const dz = position.z - 2.5;
    onNearNpc(Math.sqrt(dx * dx + dz * dz) < 3);
  });
  return null;
};

const WorldScene = () => {
  const [customization, setCustomization] = useState(DEFAULT_AVATAR_CUSTOMIZATION);
  const [nearNpc, setNearNpc] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [localPlayerState, setLocalPlayerState] = useState(null);
  const obstacles = useMemo(
    () => [
      { position: [4, 0.75, -4], size: [2, 1.5, 2] },
      { position: [-3, 0.5, -1], size: [1.5, 1, 1.5] },
      { position: [0, 0.6, 5], size: [2.5, 1.2, 1.5] },
    ],
    []
  );
  const {
    connected,
    selfId,
    players,
    publishState,
    voiceEnabled,
    voiceMuted,
    voicePeers,
    voiceError,
    joinVoice,
    leaveVoice,
    toggleMute,
    setPeerVolume,
  } = useWorldMultiplayer();

  useEffect(() => {
    let mounted = true;
    const loadAvatar = async () => {
      try {
        const avatar = await ProfileService.getAvatarCustomization();
        if (mounted) setCustomization(mergeCustomization(avatar));
      } catch (error) {
        // Ignore avatar load failures in the world scene; the default avatar still renders.
      }
    };

    loadAvatar();

    const onAvatarUpdated = (event) => {
      if (event?.detail) setCustomization(mergeCustomization(event.detail));
    };

    const onStorage = (event) => {
      if (event.key !== "avatarCustomization" || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        setCustomization(mergeCustomization(parsed));
      } catch (error) {
        // Ignore malformed storage payloads.
      }
    };

    window.addEventListener("avatar:updated", onAvatarUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      mounted = false;
      window.removeEventListener("avatar:updated", onAvatarUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const selfPosition = localPlayerState?.position;
    if (!selfPosition) return;

    voicePeers.forEach((peer) => {
      const remote = players[peer.peerId];
      const remotePosition = remote?.position;
      if (!remotePosition) return;
      const dx = selfPosition[0] - remotePosition[0];
      const dy = selfPosition[1] - remotePosition[1];
      const dz = selfPosition[2] - remotePosition[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const volume = Math.max(0.1, Math.min(1, 1 - distance / 12));
      setPeerVolume(peer.peerId, volume);
    });
  }, [localPlayerState, players, setPeerVolume, voicePeers]);

  const handleStateChange = useCallback(
    (state) => {
      setLocalPlayerState(state);
      publishState(state);
    },
    [publishState]
  );

  return (
    <div className="world-shell">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 3.5, 8], fov: 55, near: 0.1, far: 200 }}
      >
        <color attach="background" args={["#b9e6ff"]} />
        <fog attach="fog" args={["#b9e6ff", 18, 55]} />
        <Suspense
          fallback={
            <Html center>
              <div className="rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-slate-800 shadow">
                Loading world...
              </div>
            </Html>
          }
        >
          <Sky sunPosition={[5, 2, 1]} turbidity={8} rayleigh={3} mieCoefficient={0.002} />
          <Environment preset="sunset" />
          <WorldLights />
          <Ground />
          <WorldProps obstacles={obstacles} />
          <RemotePlayers players={players} selfId={selfId} />
          <Player
            obstacles={obstacles}
            onStateChange={handleStateChange}
            customization={customization}
          />
          <NpcInteraction
            playerPosition={undefined}
            onInteract={() => setChatOpen(true)}
            chatOpen={chatOpen}
          />
          <InteractionWatcher onNearNpc={setNearNpc} />
          <ContactShadows position={[0, 0.02, 0]} opacity={0.35} scale={30} blur={2.5} far={18} />
          <FollowCamera />
        </Suspense>
      </Canvas>
      <WorldOverlay
        connected={connected}
        playerCount={Object.keys(players).length}
        players={players}
        selfId={selfId}
        voiceEnabled={voiceEnabled}
        voiceMuted={voiceMuted}
        voiceError={voiceError}
        onJoinVoice={joinVoice}
        onLeaveVoice={leaveVoice}
        onToggleMute={toggleMute}
      />
      {nearNpc && !chatOpen && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="pointer-events-auto absolute right-4 top-24 rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-xl"
        >
          Talk to Astra
        </button>
      )}
      <NpcChatWindow open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Video feeds container */}
      <div className="absolute bottom-24 left-4 z-50 flex flex-col gap-2 pointer-events-auto">
        {voicePeers.map((peer) => {
          const hasVideo = peer.stream.getVideoTracks().length > 0;
          if (!hasVideo) return null;
          return (
            <div key={peer.peerId} className="flex flex-col gap-1 rounded-lg bg-black/60 p-2 text-white">
              <span className="text-xs font-semibold">{players[peer.peerId]?.username || "Guest"}</span>
              <video
                autoPlay
                playsInline
                ref={(el) => {
                  if (el && el.srcObject !== peer.stream) {
                    el.srcObject = peer.stream;
                  }
                  if (el) {
                    el.volume = peer.volume ?? 1;
                  }
                }}
                className="h-28 w-40 rounded bg-black object-cover"
              />
            </div>
          );
        })}
      </div>

      {/* Audio feeds for voice-only peers */}
      {voicePeers.map((peer) => {
        const hasVideo = peer.stream.getVideoTracks().length > 0;
        if (hasVideo) return null;
        return (
          <audio
            key={peer.peerId}
            autoPlay
            playsInline
            ref={(el) => {
              if (el && el.srcObject !== peer.stream) {
                el.srcObject = peer.stream;
              }
              if (el) {
                el.volume = peer.volume ?? 1;
              }
            }}
          />
        );
      })}
    </div>
  );
};

export default WorldScene;
