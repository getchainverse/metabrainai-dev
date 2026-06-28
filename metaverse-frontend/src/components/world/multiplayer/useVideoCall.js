import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../../../config/env";

const ICE_SERVERS = [{ urls: ["stun:stun.l.google.com:19302"] }];

export const useVideoCall = (onStateChange) => {
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  
  const [incomingCall, setIncomingCall] = useState(null); // { peerId, username }
  const [activeCall, setActiveCall] = useState(null); // { peerId, stream }
  const [callStatus, setCallStatus] = useState("idle"); // idle, calling, ringing, connected
  const [localStream, setLocalStream] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token: localStorage.getItem("accessToken") || "" },
    });
    socketRef.current = socket;

    socket.on("call:incoming", ({ peerId, username }) => {
      if (callStatus !== "idle") {
        socket.emit("call:reject", { peerId });
        return;
      }
      setIncomingCall({ peerId, username });
      setCallStatus("ringing");
    });

    socket.on("call:accepted", async ({ peerId }) => {
      setCallStatus("connected");
      if (peerRef.current) return;
      await initPeer(peerId, true);
    });

    socket.on("call:rejected", () => {
      cleanupCall();
      alert("Call was rejected");
    });

    socket.on("call:ended", ({ peerId }) => {
      if (activeCall?.peerId === peerId || incomingCall?.peerId === peerId) {
        cleanupCall();
      }
    });

    socket.on("call:signal", async ({ peerId, signal }) => {
      if (signal.type === "offer" || signal.type === "answer") {
        if (!peerRef.current && signal.type === "offer") {
          await initPeer(peerId, false);
        }
        if (peerRef.current) {
          if (peerRef.current.signalingState !== "stable" || signal.type === "offer") {
            await peerRef.current.setRemoteDescription(signal);
          }
          if (signal.type === "offer") {
            const answer = await peerRef.current.createAnswer();
            await peerRef.current.setLocalDescription(answer);
            socket.emit("call:signal", { peerId, signal: peerRef.current.localDescription });
          }
        }
      } else if (signal.candidate) {
        if (peerRef.current) {
          try {
            await peerRef.current.addIceCandidate(signal);
          } catch (e) {
            // Ignore races
          }
        } else {
          pendingCandidatesRef.current.push(signal);
        }
      }
    });

    return () => {
      cleanupCall();
      socket.disconnect();
    };
  }, [callStatus, activeCall, incomingCall]);

  const initPeer = async (peerId, isInitiator) => {
    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerRef.current = peer;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("call:signal", {
          peerId,
          signal: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setActiveCall({ peerId, stream });
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "failed" || peer.connectionState === "disconnected") {
        cleanupCall();
      }
    };

    // Drain pending candidates
    pendingCandidatesRef.current.forEach(async (cand) => {
      try { await peer.addIceCandidate(cand); } catch (e) {}
    });
    pendingCandidatesRef.current = [];

    if (isInitiator) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socketRef.current?.emit("call:signal", {
        peerId,
        signal: peer.localDescription,
      });
    }

    return peer;
  };

  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (e) {
      alert("Failed to access camera and microphone.");
      return null;
    }
  };

  const startCall = async (peerId) => {
    const stream = await getMedia();
    if (!stream) return;
    setCallStatus("calling");
    socketRef.current?.emit("call:request", { peerId });
    setActiveCall({ peerId, stream: null }); // placeholder
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    const stream = await getMedia();
    if (!stream) {
      rejectCall();
      return;
    }
    setCallStatus("connected");
    socketRef.current?.emit("call:accept", { peerId: incomingCall.peerId });
    setActiveCall({ peerId: incomingCall.peerId, stream: null });
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (incomingCall) {
      socketRef.current?.emit("call:reject", { peerId: incomingCall.peerId });
      setIncomingCall(null);
      setCallStatus("idle");
    }
  };

  const endCall = () => {
    const peerId = activeCall?.peerId || incomingCall?.peerId;
    if (peerId) {
      socketRef.current?.emit("call:end", { peerId });
    }
    cleanupCall();
  };

  const cleanupCall = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setActiveCall(null);
    setIncomingCall(null);
    setCallStatus("idle");
    pendingCandidatesRef.current = [];
  }, []);

  return {
    callStatus,
    activeCall,
    incomingCall,
    localStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall
  };
};

export default useVideoCall;
