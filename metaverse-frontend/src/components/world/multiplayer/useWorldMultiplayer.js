import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

import { SOCKET_URL } from "../../../config/env";
const ICE_SERVERS = [{ urls: ["stun:stun.l.google.com:19302"] }];

const useWorldMultiplayer = () => {
  const socketRef = useRef(null);
  const emitTimer = useRef(0);
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef(new Map());
  const voiceEnabledRef = useRef(false);
  const selfIdRef = useRef(null);
  const [selfId, setSelfId] = useState(null);
  const [players, setPlayers] = useState({});
  const [connected, setConnected] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voicePeers, setVoicePeers] = useState([]);
  const [voiceError, setVoiceError] = useState("");
 
  const stopPeer = (peerId) => {
    const peer = peersRef.current.get(peerId);
    if (peer) {
      peer.close();
      peersRef.current.delete(peerId);
    }
    setVoicePeers((current) => current.filter((item) => item.peerId !== peerId));
  };
 
  const ensurePeer = async (peerId, isInitiator) => {
    if (!socketRef.current) return null;
    if (peersRef.current.has(peerId)) return peersRef.current.get(peerId);
    if (!localStreamRef.current) return null;
 
    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peersRef.current.set(peerId, peer);
 
    localStreamRef.current.getTracks().forEach((track) => {
      peer.addTrack(track, localStreamRef.current);
    });
 
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("voice:ice-candidate", {
          peerId,
          candidate: event.candidate,
        });
      }
    };
 
    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;
      setVoicePeers((current) => {
        const next = current.filter((item) => item.peerId !== peerId);
        next.push({ peerId, stream, volume: 1 });
        return next;
      });
    };
 
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "failed" || peer.connectionState === "disconnected") {
        stopPeer(peerId);
      }
    };
 
    if (isInitiator) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socketRef.current.emit("voice:offer", {
        peerId,
        sdp: peer.localDescription,
      });
    }
 
    return peer;
  };
 
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token: localStorage.getItem("accessToken") || "" },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
 
    socketRef.current = socket;
 
    const upsertPlayer = (player) => {
      if (!player?.id) return;
      setPlayers((current) => ({
        ...current,
        [player.id]: player,
      }));
    };
 
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("world:init", ({ selfId: nextSelfId, players: initialPlayers = [] }) => {
      setSelfId(nextSelfId);
      selfIdRef.current = nextSelfId;
      setPlayers(
        initialPlayers.reduce((acc, player) => {
          acc[player.id] = player;
          return acc;
        }, {})
      );
    });
    socket.on("player:joined", upsertPlayer);
    socket.on("player:state", upsertPlayer);
    socket.on("player:left", ({ id }) => {
      if (!id) return;
      setPlayers((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    });
 
    socket.on("voice:peer-join", async ({ peerId }) => {
      if (!voiceEnabledRef.current) return;
      const shouldInitiate = selfIdRef.current && String(selfIdRef.current) < String(peerId);
      await ensurePeer(peerId, shouldInitiate);
    });
 
    socket.on("voice:peer-leave", ({ peerId }) => {
      stopPeer(peerId);
    });
 
    socket.on("voice:offer", async ({ peerId, sdp }) => {
      if (!voiceEnabledRef.current || !localStreamRef.current) return;
      const peer = await ensurePeer(peerId, false);
      if (!peer || !sdp) return;
      await peer.setRemoteDescription(sdp);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("voice:answer", { peerId, sdp: peer.localDescription });
    });
 
    socket.on("voice:answer", async ({ peerId, sdp }) => {
      const peer = peersRef.current.get(peerId);
      if (!peer || !sdp) return;
      if (peer.signalingState !== "stable") {
        await peer.setRemoteDescription(sdp);
      }
    });
 
    socket.on("voice:ice-candidate", async ({ peerId, candidate }) => {
      const peer = peersRef.current.get(peerId);
      if (!peer || !candidate) {
        const queue = pendingCandidatesRef.current.get(peerId) || [];
        queue.push(candidate);
        pendingCandidatesRef.current.set(peerId, queue);
        return;
      }
      try {
        await peer.addIceCandidate(candidate);
      } catch (error) {
        // Ignore candidate races during reconnects.
      }
    });
 
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);
 
  const publishState = useMemo(
    () => (state) => {
      const socket = socketRef.current;
      const now = Date.now();
      if (!socket || !socket.connected) return;
      if (now - emitTimer.current < 50) return;
      emitTimer.current = now;
      socket.emit("player:state", state);
    },
    []
  );
 
  const joinVoice = async (withVideo = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
      localStreamRef.current = stream;
      voiceEnabledRef.current = true;
      setVoiceEnabled(true);
      setVideoEnabled(withVideo);
      setVoiceMuted(false);
      setVoiceError("");
      socketRef.current?.emit("voice:join", { enabled: true });
    } catch (error) {
      setVoiceError("Microphone and Camera access are required for voice/video chat.");
    }
  };
 
  const leaveVoice = () => {
    voiceEnabledRef.current = false;
    setVoiceEnabled(false);
    setVideoEnabled(false);
    setVoiceMuted(false);
    socketRef.current?.emit("voice:leave");
    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    setVoicePeers([]);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };
 
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const muted = !voiceMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
    setVoiceMuted(muted);
  };
 
  const setPeerVolume = (peerId, volume) => {
    setVoicePeers((current) =>
      current.map((item) => (item.peerId === peerId ? { ...item, volume } : item))
    );
  };
 
  const reconnectVoice = async () => {
    if (voiceEnabled && !localStreamRef.current) {
      await joinVoice(videoEnabled);
    }
  };
 
  useEffect(() => {
    if (!connected || !voiceEnabled) return;
    reconnectVoice();
  }, [connected, voiceEnabled]);
 
  return {
    connected,
    selfId,
    players,
    publishState,
    voiceEnabled,
    videoEnabled,
    voiceMuted,
    voicePeers,
    voiceError,
    joinVoice,
    leaveVoice,
    toggleMute,
    setPeerVolume,
  };
};

export default useWorldMultiplayer;
