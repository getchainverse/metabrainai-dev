import React, { useState } from "react";
import { IoCloseOutline, IoCartOutline, IoCheckmarkCircleOutline, IoWalletOutline } from "react-icons/io5";
import useStore from "../../../hooks/useStore";

export const VirtualStoreUI = ({ onClose }) => {
  const { products, inventory, purchaseItem, loading, error } = useStore();
  const [purchasing, setPurchasing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handlePurchase = async (product) => {
    setPurchasing(true);
    try {
      await purchaseItem(product.id, product.price || 0.01); // Use actual ethPrice in prod
      alert(`Successfully purchased ${product.name}! It is now in your inventory.`);
    } catch (err) {
      alert("Purchase failed: " + err);
    } finally {
      setPurchasing(false);
    }
  };

  const isOwned = (productId) => {
    return inventory.some(inv => inv.productId === productId);
  };

  const categories = ["all", ...new Set(products.map(p => p.category))];
  const filteredProducts = selectedCategory === "all" ? products : products.filter(p => p.category === selectedCategory);

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto animate-in fade-in">
      <div className="w-full max-w-4xl h-[80vh] flex flex-col rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <IoCartOutline className="text-3xl text-cyan-400" />
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Metaverse Marketplace</h2>
              <p className="text-sm text-slate-400">Discover premium cosmetics and digital assets</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <IoCloseOutline className="text-3xl" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-4 border-b border-white/5 bg-slate-900 overflow-x-auto custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? "bg-cyan-500 text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.4)]" 
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading && <div className="text-center text-slate-400 mt-10 animate-pulse">Loading storefront...</div>}
          {error && <div className="text-center text-rose-400 mt-10 p-4 bg-rose-500/10 rounded-lg">{error}</div>}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => {
              const owned = isOwned(product.id);
              return (
                <div key={product.id} className="group flex flex-col rounded-xl border border-white/5 bg-slate-800/50 overflow-hidden hover:border-cyan-500/30 transition-all hover:-translate-y-1 hover:shadow-xl">
                  {/* Image/Preview */}
                  <div className="aspect-square bg-slate-800 relative overflow-hidden flex items-center justify-center p-4">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {product.rarity && (
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md backdrop-blur-md ${
                          product.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          product.rarity === 'epic' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          'bg-white/10 text-slate-300'
                        }`}>
                          {product.rarity}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-base font-bold text-white line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 capitalize">{product.subCategory || product.category}</p>
                    
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-teal-400">
                        <IoWalletOutline />
                        <span>{product.price} {product.currency || "ETH"}</span>
                      </div>
                      
                      {owned ? (
                        <button disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                          <IoCheckmarkCircleOutline className="text-sm" />
                          Owned
                        </button>
                      ) : (
                        <button 
                          onClick={() => handlePurchase(product)}
                          disabled={purchasing}
                          className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                        >
                          {purchasing ? "Buying..." : "Buy Now"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {!loading && filteredProducts.length === 0 && (
            <div className="text-center text-slate-400 mt-20">
              No products found in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualStoreUI;
