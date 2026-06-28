import React, { useState, useEffect } from "react";
import { BrowserProvider, parseEther } from "ethers";
import { IoChevronUp, IoChevronDown, IoChevronBack, IoChevronForward, IoGlobeOutline, IoPeopleOutline, IoMicOutline, IoVideocamOutline, IoVolumeMuteOutline, IoGiftOutline, IoContractOutline, IoExpandOutline, IoGameControllerOutline, IoSettingsOutline, IoSpeedometerOutline, IoWarningOutline, IoCartOutline } from "react-icons/io5";
import { FaKeyboard } from "react-icons/fa";
import { BsArrowUpSquare } from "react-icons/bs";
import VoiceSettings from "./VoiceSettings";
import VirtualStoreUI from "./VirtualStoreUI";

const Button = ({ label, onPointerDown, onPointerUp, icon: Icon }) => (
  <button
    type="button"
    aria-label={label}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
    onPointerLeave={onPointerUp}
    className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-slate-900/50 text-white backdrop-blur-md shadow-lg transition-transform hover:scale-105 active:scale-95"
  >
    <Icon className="h-5 w-5" />
  </button>
);

const WorldOverlay = ({
  connected,
  playerCount,
  players = {},
  selfId,
  voiceEnabled,
  voiceMuted,
  voiceError,
  onJoinVoice,
  onLeaveVoice,
  onToggleMute,
}) => {
  const [minimized, setMinimized] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setKey = (code, value) => {
    const eventType = value ? "keydown" : "keyup";
    window.dispatchEvent(new KeyboardEvent(eventType, { code }));
  };

  const handleGiftEth = async (player) => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install it to send money.");
      return;
    }
    if (!player.walletAddress) {
      alert("This player does not have a connected wallet address.");
      return;
    }
    const amount = prompt(`Enter ETH amount to send to ${player.username || "player"}:`, "0.001");
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: player.walletAddress,
        value: parseEther(amount),
      });
      alert(`Transaction sent successfully! Hash: ${tx.hash}`);
    } catch (err) {
      alert("Failed to send ETH: " + (err.message || err));
    }
  };

  const otherPlayers = Object.values(players).filter((p) => p.id !== selfId);

  // Shorten wallet
  const shortenWallet = (wallet) => {
    if (!wallet) return "";
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6 z-40 overflow-hidden">
      
      {/* Information Panel */}
      <div 
        className={`pointer-events-auto flex flex-col transition-all duration-300 ease-in-out transform origin-top-left
          ${mounted ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-95 -translate-x-8'}
          ${minimized ? 'w-auto' : 'w-full max-w-[400px] max-h-[75vh]'}
          md:absolute md:top-6 md:left-6 rounded-[20px] border border-white/10 bg-slate-900/65 backdrop-blur-[24px] shadow-2xl overflow-hidden`}
      >
        
        {/* Minimized Pill State */}
        {minimized ? (
          <div 
            onClick={() => setMinimized(false)}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
          >
            <IoGlobeOutline className="text-cyan-400 text-xl" />
            <span className="text-white font-medium text-sm">World Info</span>
            <IoExpandOutline className="text-slate-400 ml-2" />
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
            
            {/* Header Section */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 mb-1">
                  Metaverse World 01
                </p>
                <h1 className="text-xl font-semibold text-white tracking-tight leading-tight">
                  A Quiet First World
                </h1>
                
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${connected ? 'bg-emerald-500 text-emerald-500' : 'bg-amber-500 text-amber-500 animate-pulse'}`}></div>
                    <span className="font-medium text-slate-200">{connected ? "Connected" : "Connecting"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <IoPeopleOutline />
                    <span>{playerCount} Players</span>
                  </div>
                </div>
              </div>
              
              <div className="flex -mt-2 -mr-2">
                <button 
                  onClick={() => setStoreOpen(true)}
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <IoCartOutline className="text-lg" />
                </button>
                <button 
                  onClick={() => setSettingsOpen(true)}
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <IoSettingsOutline className="text-lg" />
                </button>
                <button 
                  onClick={() => setMinimized(true)}
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <IoContractOutline className="text-lg" />
                </button>
              </div>
            </div>

            {/* Description / Controls Section */}
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <FaKeyboard className="text-slate-400" />
                <span>WASD Move</span>
              </div>
              <div className="flex items-center gap-2">
                <BsArrowUpSquare className="text-slate-400" />
                <span>Space Jump</span>
              </div>
              <div className="flex items-center gap-2">
                <IoMicOutline className="text-slate-400" />
                <span>Voice Available</span>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-col gap-3">
              {!voiceEnabled ? (
                <>
                  <button
                    onClick={() => onJoinVoice(false)}
                    className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-sm font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all hover:-translate-y-[1px] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-[0.98]"
                  >
                    <IoMicOutline className="text-lg" />
                    <span>Join Voice</span>
                  </button>
                  <button
                    onClick={() => onJoinVoice(true)}
                    className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 text-sm font-bold text-white transition-all hover:bg-white/20 active:scale-[0.98]"
                  >
                    <IoVideocamOutline className="text-lg text-indigo-400" />
                    <span>Join Voice & Video</span>
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={onToggleMute}
                    className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition-all active:scale-[0.98] ${voiceMuted ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-white text-slate-900 hover:bg-slate-200'}`}
                  >
                    {voiceMuted ? <IoVolumeMuteOutline className="text-lg" /> : <IoMicOutline className="text-lg" />}
                    <span>{voiceMuted ? "Unmute" : "Mute"}</span>
                  </button>
                  <button
                    onClick={onLeaveVoice}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 text-sm font-bold text-rose-400 hover:bg-rose-500/20 transition-all active:scale-[0.98]"
                  >
                    Leave Voice
                  </button>
                </div>
              )}
              {voiceError && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg">
                  <IoWarningOutline />
                  <span>{voiceError}</span>
                </div>
              )}
            </div>

            {/* Nearby Players */}
            {otherPlayers.length > 0 && (
              <div className="flex flex-col space-y-3 pt-4 border-t border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nearby Players
                </p>
                <div className="flex flex-col gap-2">
                  {otherPlayers.map((player) => (
                    <div 
                      key={player.id} 
                      className="group flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/5 p-2.5 transition-colors hover:bg-white/10 hover:border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white shadow-lg">
                          {(player.username || "G").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{player.username || "Guest"}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {player.walletAddress ? shortenWallet(player.walletAddress) : "No Wallet"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGiftEth(player)}
                        className="flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-1.5 text-xs font-bold text-teal-300 border border-teal-500/30 transition-all hover:bg-teal-500 hover:text-slate-900 hover:shadow-[0_0_12px_rgba(20,184,166,0.6)]"
                      >
                        <IoGiftOutline className="text-sm" />
                        <span>Gift</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick World Stats */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/10 text-xs text-slate-400">
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                <IoGameControllerOutline className="text-slate-500" />
                <span>Objects: <strong className="text-slate-200 font-medium">143</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                <IoSpeedometerOutline className="text-slate-500" />
                <span>Ping: <strong className="text-slate-200 font-medium">42ms</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                <IoGlobeOutline className="text-slate-500" />
                <span>Region: <strong className="text-slate-200 font-medium">Asia</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                <IoSettingsOutline className="text-slate-500" />
                <span>FPS: <strong className="text-slate-200 font-medium">60</strong></span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Movement Controls UI (Hidden on desktop, shown on mobile/touch) */}
      <div className="pointer-events-auto flex items-end justify-between gap-4 mt-auto z-40">
        <div className="grid gap-2">
          <div className="flex justify-center">
            <Button
              label="Move up"
              icon={IoChevronUp}
              onPointerDown={() => setKey("KeyW", true)}
              onPointerUp={() => setKey("KeyW", false)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              label="Move left"
              icon={IoChevronBack}
              onPointerDown={() => setKey("KeyA", true)}
              onPointerUp={() => setKey("KeyA", false)}
            />
            <Button
              label="Move down"
              icon={IoChevronDown}
              onPointerDown={() => setKey("KeyS", true)}
              onPointerUp={() => setKey("KeyS", false)}
            />
            <Button
              label="Move right"
              icon={IoChevronForward}
              onPointerDown={() => setKey("KeyD", true)}
              onPointerUp={() => setKey("KeyD", false)}
            />
          </div>
        </div>

        <button
          type="button"
          className="pointer-events-auto rounded-full border border-white/20 bg-white/90 px-6 py-3 text-sm font-bold text-slate-900 shadow-xl transition-transform active:scale-95 hover:bg-white"
          onPointerDown={() => setKey("Space", true)}
          onPointerUp={() => setKey("Space", false)}
        >
          JUMP
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}} />

      {settingsOpen && (
        <VoiceSettings onClose={() => setSettingsOpen(false)} />
      )}

      {storeOpen && (
        <VirtualStoreUI onClose={() => setStoreOpen(false)} />
      )}
    </div>
  );
};

export default WorldOverlay;
