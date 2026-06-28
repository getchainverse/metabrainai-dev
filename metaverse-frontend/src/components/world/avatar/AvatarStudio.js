import React, { useState } from "react";
import { useAvatarCustomization } from "../../../hooks/useAvatarCustomization";
import useStore from "../../../hooks/useStore";
import AvatarPreviewScene from "./AvatarPreviewScene";
import { IoBodyOutline, IoHappyOutline, IoShirtOutline, IoSaveOutline, IoArrowUndoOutline, IoArrowRedoOutline, IoRefreshOutline, IoBagOutline } from "react-icons/io5";

const AvatarStudio = () => {
  const {
    config,
    updateCategory,
    undo,
    redo,
    canUndo,
    canRedo,
    saveToServer,
    resetToDefault,
    isLoading,
    isSaving,
  } = useAvatarCustomization();

  const { inventory, equipItem } = useStore();

  const [activeTab, setActiveTab] = useState("body");

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white">
        <div className="text-xl font-bold animate-pulse">Loading Studio...</div>
      </div>
    );
  }

  // Helper for sliders
  const renderSlider = (category, key, label, min = 0.5, max = 1.5, step = 0.05) => (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span>{config[category]?.[key]?.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={config[category]?.[key] || 1.0}
        onChange={(e) => updateCategory(category, key, parseFloat(e.target.value))}
        className="w-full accent-cyan-500 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );

  // Helper for color picker
  const renderColorPicker = (category, key, label) => (
    <div className="mb-4 flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
      <span className="text-sm text-slate-300 font-medium">{label}</span>
      <input
        type="color"
        value={config[category]?.[key] || "#ffffff"}
        onChange={(e) => updateCategory(category, key, e.target.value)}
        className="h-8 w-14 rounded cursor-pointer border-0 bg-transparent p-0"
      />
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-900 text-white font-sans">
      
      {/* 3D Preview Area */}
      <div className="relative flex-1">
        <AvatarPreviewScene config={config} />
        
        {/* Top Controls Overlay */}
        <div className="absolute top-6 left-6 flex items-center gap-4 bg-slate-900/60 p-3 rounded-2xl backdrop-blur-md border border-white/10">
          <button 
            onClick={undo} disabled={!canUndo}
            className={`p-2 rounded-xl transition-all ${canUndo ? 'hover:bg-white/20 text-white' : 'opacity-30 cursor-not-allowed text-slate-500'}`}
          >
            <IoArrowUndoOutline className="text-xl" />
          </button>
          <button 
            onClick={redo} disabled={!canRedo}
            className={`p-2 rounded-xl transition-all ${canRedo ? 'hover:bg-white/20 text-white' : 'opacity-30 cursor-not-allowed text-slate-500'}`}
          >
            <IoArrowRedoOutline className="text-xl" />
          </button>
          <div className="h-6 w-px bg-white/20 mx-2" />
          <button 
            onClick={resetToDefault}
            className="p-2 rounded-xl hover:bg-white/20 transition-all text-rose-400"
            title="Reset"
          >
            <IoRefreshOutline className="text-xl" />
          </button>
        </div>
      </div>

      {/* Right Customization Panel */}
      <div className="w-[420px] bg-slate-900/90 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl z-10">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/10">
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            Avatar Studio
          </h2>
          <p className="text-sm text-slate-400 mt-1">Configure your metaverse identity</p>
        </div>

        {/* Category Tabs */}
        <div className="flex p-2 gap-2 bg-black/20 m-4 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab("body")} className={`flex-1 flex flex-col items-center py-3 rounded-lg text-xs font-semibold transition-all ${activeTab === 'body' ? 'bg-white/10 text-cyan-400 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
            <IoBodyOutline className="text-xl mb-1" /> Body
          </button>
          <button onClick={() => setActiveTab("face")} className={`flex-1 flex flex-col items-center py-3 rounded-lg text-xs font-semibold transition-all ${activeTab === 'face' ? 'bg-white/10 text-cyan-400 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
            <IoHappyOutline className="text-xl mb-1" /> Face
          </button>
          <button onClick={() => setActiveTab("clothing")} className={`flex-1 flex flex-col items-center py-3 rounded-lg text-xs font-semibold transition-all ${activeTab === 'clothing' ? 'bg-white/10 text-cyan-400 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
            <IoShirtOutline className="text-xl mb-1" /> Wearables
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
          
          {activeTab === "body" && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Proportions</h3>
                {renderSlider("bodySettings", "height", "Height", 0.8, 1.2)}
                {renderSlider("bodySettings", "weight", "Build (Width)", 0.8, 1.3)}
                {renderSlider("bodySettings", "muscle", "Muscle Mass", 0, 1.0)}
              </div>
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Skin & Colors</h3>
                {renderColorPicker("bodySettings", "skinTone", "Skin Tone")}
                {renderColorPicker("colors", "primary", "Primary Base")}
                {renderColorPicker("colors", "secondary", "Secondary Base")}
              </div>
            </div>
          )}

          {activeTab === "face" && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Facial Structure</h3>
                {renderSlider("faceSettings", "jaw", "Jaw Width", 0, 1.0)}
                {renderSlider("faceSettings", "cheeks", "Cheekbones", 0, 1.0)}
              </div>
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Details</h3>
                {renderColorPicker("faceSettings", "eyeColor", "Eye Color")}
                {renderColorPicker("hairSettings", "hairColor", "Hair Color")}
              </div>
            </div>
          )}

          {activeTab === "clothing" && (
            <div className="animate-fade-in space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Your Wardrobe</h3>
              
              {inventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                  <IoBagOutline className="text-4xl mb-3 text-slate-600" />
                  <p className="text-sm font-medium">Your wardrobe is empty.</p>
                  <p className="text-xs text-slate-400 mt-1">Visit the Virtual Store in the Metaverse to buy items!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {inventory.map((inv) => {
                    const product = inv.Product || inv.item; // Fallback depending on Sequelize alias
                    if (!product) return null;
                    return (
                      <div key={inv.id} className="relative rounded-xl border border-white/10 bg-slate-800/50 p-3 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => equipItem(product.id)}>
                        <div className="aspect-square bg-black/40 rounded-lg mb-2 overflow-hidden flex items-center justify-center relative">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <IoShirtOutline className="text-3xl text-slate-500" />
                          )}
                          {inv.equipped && (
                            <div className="absolute top-1 right-1 bg-cyan-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow">EQUIPPED</div>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{product.name}</h4>
                        <p className="text-[10px] text-slate-400 capitalize">{product.category}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-black/40 border-t border-white/10 mt-auto">
          <button 
            onClick={saveToServer}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 py-4 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
          >
            {isSaving ? (
              <span className="animate-pulse">Saving Configuration...</span>
            ) : (
              <>
                <IoSaveOutline className="text-xl" />
                <span>Save to Metaverse</span>
              </>
            )}
          </button>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};

export default AvatarStudio;
