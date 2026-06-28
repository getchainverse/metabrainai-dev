import React, { memo, useMemo, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import { Html } from "@react-three/drei";
import AvatarModel from "../avatar/AvatarModel";
import AvatarInteractionMenu from "../ui/AvatarInteractionMenu";

const tintForId = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue} 72% 62%)`;
};

const RemotePlayer = ({ player }) => {
  const root = useRef(null);
  const target = useRef(new Vector3(...(player.position || [0, 0.95, 0])));
  const rotation = useRef(player.rotation || 0);
  const color = useMemo(() => tintForId(player.id), [player.id]);

  const [menuOpen, setMenuOpen] = useState(false);
  const audioRef = useRef(null);

  // Hook up positional audio stream
  useEffect(() => {
    if (audioRef.current && player.voiceStream) {
      const stream = player.voiceStream;
      if (stream.getAudioTracks().length > 0) {
        audioRef.current.setMediaStreamSource(stream);
        audioRef.current.setRefDistance(2);
        audioRef.current.setRolloffFactor(1);
        audioRef.current.play();
      }
    }
  }, [player.voiceStream]);

  useFrame((_, delta) => {
    if (!root.current) return;
    const next = new Vector3(...(player.position || [0, 0.95, 0]));
    target.current.lerp(next, 0.18);
    rotation.current = MathUtils.lerp(rotation.current, player.rotation || 0, 0.18);

    root.current.position.lerp(target.current, 0.18);
    root.current.rotation.y = rotation.current;
    if (player.animation === "jump") {
      root.current.position.y += Math.sin(Date.now() / 90) * 0.03;
    }
  });

  return (
    <group 
      ref={root} 
      onClick={(e) => {
        e.stopPropagation();
        setMenuOpen(true);
      }}
      onPointerMissed={() => setMenuOpen(false)}
    >
      <AvatarModel customization={player.appearance || { bodyColor: color }} />
      
      {/* 3D Positional Audio for Voice */}
      {player.voiceStream && (
        <positionalAudio ref={audioRef} args={[window.audioListener]} />
      )}

      {/* Floating Status Indicators */}
      {player.isSpeaking && (
        <Html position={[0, 2.2, 0]} center>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 backdrop-blur border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]">
            <div className="flex gap-0.5 items-end h-3">
              <div className="w-1 bg-cyan-400 rounded-full animate-bounce" style={{ height: '60%', animationDelay: '0ms' }} />
              <div className="w-1 bg-cyan-400 rounded-full animate-bounce" style={{ height: '100%', animationDelay: '150ms' }} />
              <div className="w-1 bg-cyan-400 rounded-full animate-bounce" style={{ height: '40%', animationDelay: '300ms' }} />
            </div>
          </div>
        </Html>
      )}
      
      {player.isMuted && (
        <Html position={[0, 2.2, 0]} center>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 backdrop-blur border border-rose-500 text-rose-500">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02 3.28c-.9.98-2.11 1.6-3.48 1.6-1.93 0-3.5-1.57-3.5-3.5V5c0-1.93 1.57-3.5 3.5-3.5 1.1 0 2.08.52 2.72 1.33l-1.53 1.53c-.3-.38-.72-.6-1.19-.6-.83 0-1.5.67-1.5 1.5v6.5c0 .83.67 1.5 1.5 1.5.68 0 1.25-.45 1.44-1.07l1.54 1.54zM21.19 21.19L2.81 2.81 1.39 4.22l4.2 4.2C5.22 9.24 5 10.1 5 11h2c0-.78.22-1.5.58-2.11l12.2 12.2 1.41-1.41z"/></svg>
          </div>
        </Html>
      )}

      {/* Interaction Menu */}
      {menuOpen && (
        <AvatarInteractionMenu 
          player={player}
          position={[0.8, 1, 0]} 
          onClose={() => setMenuOpen(false)}
          onStartCall={player.onStartCall}
          onToggleMute={player.onToggleMute}
          isMuted={player.isMutedLocally}
        />
      )}
    </group>
  );
};

export default memo(RemotePlayer);
