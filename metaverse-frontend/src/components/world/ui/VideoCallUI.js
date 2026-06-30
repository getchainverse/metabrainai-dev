import React, { useRef, useEffect, useState } from "react";
import { IoVideocamOutline, IoCallOutline, IoCloseOutline, IoMicOutline, IoMicOffOutline, IoVideocamOffOutline } from "react-icons/io5";

export const VideoCallUI = ({ 
  callStatus, 
  activeCall, 
  incomingCall, 
  localStream, 
  acceptCall, 
  rejectCall, 
  endCall 
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callStatus]);

  useEffect(() => {
    if (remoteVideoRef.current && activeCall?.stream) {
      remoteVideoRef.current.srcObject = activeCall.stream;
    }
  }, [activeCall, callStatus]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  if (callStatus === "idle") return null;

  return (
    <div 
      className="fixed inset-0 z-50 pointer-events-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {callStatus === "ringing" && incomingCall && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-auto bg-slate-900/90 border border-white/20 p-6 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-10">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.5)]">
              <IoVideocamOutline className="text-3xl text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white">{incomingCall.username}</h3>
              <p className="text-sm text-slate-400 mt-1">Incoming Video Call...</p>
            </div>
            <div className="flex gap-4 mt-2">
              <button onClick={rejectCall} className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/50 flex items-center justify-center transition-all">
                <IoCloseOutline className="text-2xl" />
              </button>
              <button onClick={acceptCall} className="w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-900 shadow-[0_0_15px_rgba(20,184,166,0.5)] flex items-center justify-center transition-all">
                <IoCallOutline className="text-2xl" />
              </button>
            </div>
          </div>
        </div>
      )}

      {(callStatus === "calling" || callStatus === "connected") && (
        <div 
          className="absolute pointer-events-auto bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          style={{ 
            left: `${position.x}px`, 
            top: `${position.y}px`,
            width: '320px',
            height: '420px',
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          {/* Draggable Header */}
          <div 
            className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/80 to-transparent z-10 cursor-grab flex items-center justify-center"
            onPointerDown={handlePointerDown}
          >
            <div className="w-12 h-1.5 bg-white/30 rounded-full" />
          </div>

          {/* Remote Video */}
          <div className="w-full h-full bg-slate-900 relative">
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {callStatus === "calling" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                <p className="text-white font-medium">Calling...</p>
              </div>
            )}
          </div>

          {/* Local Video Picture-in-Picture */}
          <div className="absolute top-4 right-4 w-24 h-36 bg-black rounded-lg overflow-hidden border border-white/20 shadow-lg z-20">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 inset-x-0 flex justify-center gap-4 z-20">
            <button 
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isMuted ? 'bg-rose-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              {isMuted ? <IoMicOffOutline className="text-xl" /> : <IoMicOutline className="text-xl" />}
            </button>
            <button 
              onClick={endCall}
              className="w-14 h-14 rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.5)] flex items-center justify-center transition-all"
            >
              <IoCallOutline className="text-2xl rotate-[135deg]" />
            </button>
            <button 
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isVideoOff ? 'bg-rose-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              {isVideoOff ? <IoVideocamOffOutline className="text-xl" /> : <IoVideocamOutline className="text-xl" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallUI;
