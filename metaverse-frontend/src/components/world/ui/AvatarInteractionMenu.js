import React from "react";
import { Html } from "@react-three/drei";
import { IoVideocamOutline, IoVolumeMuteOutline, IoVolumeHighOutline, IoCloseOutline, IoPersonOutline } from "react-icons/io5";

const AvatarInteractionMenu = ({ player, position, onClose, onStartCall, onToggleMute, isMuted }) => {
  return (
    <Html position={position} center zIndexRange={[100, 0]}>
      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-900/80 p-3 shadow-2xl backdrop-blur-md w-48 transition-all animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-1">
          <span className="text-sm font-bold text-white truncate px-1">
            {player.username || "Guest"}
          </span>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <IoCloseOutline className="text-lg" />
          </button>
        </div>

        <button
          onClick={() => onStartCall(player.id)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors"
        >
          <IoVideocamOutline className="text-lg" />
          Video Call
        </button>

        <button
          onClick={() => onToggleMute(player.id)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
        >
          {isMuted ? <IoVolumeMuteOutline className="text-lg text-rose-400" /> : <IoVolumeHighOutline className="text-lg text-teal-400" />}
          {isMuted ? "Unmute" : "Mute Locally"}
        </button>
        
        <button
          onClick={() => alert(`View Profile: ${player.username}`)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
        >
          <IoPersonOutline className="text-lg" />
          View Profile
        </button>
      </div>
    </Html>
  );
};

export default AvatarInteractionMenu;
