import React, { useState, useEffect } from "react";
import { IoCloseOutline, IoSettingsOutline, IoMicOutline, IoVolumeHighOutline, IoOptionsOutline } from "react-icons/io5";

export const VoiceSettings = ({ onClose }) => {
  const [devices, setDevices] = useState({ audioinput: [], audiooutput: [] });
  const [selectedInput, setSelectedInput] = useState("default");
  const [selectedOutput, setSelectedOutput] = useState("default");
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [masterVolume, setMasterVolume] = useState(100);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const deviceInfos = await navigator.mediaDevices.enumerateDevices();
        const nextDevices = { audioinput: [], audiooutput: [] };
        
        deviceInfos.forEach((device) => {
          if (device.kind === "audioinput") nextDevices.audioinput.push(device);
          if (device.kind === "audiooutput") nextDevices.audiooutput.push(device);
        });
        
        setDevices(nextDevices);
      } catch (err) {
        console.error("Failed to load devices", err);
      }
    };
    loadDevices();
  }, []);

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <IoSettingsOutline className="text-xl text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Voice & Video Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <IoCloseOutline className="text-2xl" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Input Device */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <IoMicOutline /> Microphone
            </label>
            <select 
              value={selectedInput}
              onChange={(e) => setSelectedInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="default">System Default</option>
              {devices.audioinput.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.substring(0, 5)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Output Device */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <IoVolumeHighOutline /> Speaker
            </label>
            <select 
              value={selectedOutput}
              onChange={(e) => setSelectedOutput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="default">System Default</option>
              {devices.audiooutput.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Speaker ${device.deviceId.substring(0, 5)}`}
                </option>
              ))}
            </select>
          </div>

          <hr className="border-white/10" />

          {/* Advanced Audio Processing */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <IoOptionsOutline /> Advanced Processing
            </div>
            
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Echo Cancellation</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={echoCancellation}
                  onChange={() => setEchoCancellation(!echoCancellation)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${echoCancellation ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${echoCancellation ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Noise Suppression</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={noiseSuppression}
                  onChange={() => setNoiseSuppression(!noiseSuppression)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${noiseSuppression ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${noiseSuppression ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
            </label>
          </div>

          <hr className="border-white/10" />

          {/* Master Volume */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-slate-300">Master Volume</label>
              <span className="text-xs text-slate-500">{masterVolume}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={masterVolume}
              onChange={(e) => setMasterVolume(e.target.value)}
              className="w-full accent-cyan-500"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default VoiceSettings;
