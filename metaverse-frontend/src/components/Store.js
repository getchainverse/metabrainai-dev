import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import StoreService from "../services/store.service";
import { ShowErrorMessage, ShowSuccessMessage } from "./common/Message";

const TREASURY_ADDRESS = process.env.REACT_APP_STORE_TREASURY_ADDRESS || "";

const Store = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [quantity, setQuantity] = useState({});
  const [walletAddress, setWalletAddress] = useState("");

  const loadData = async () => {
    if (!localStorage.getItem("accessToken")) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const [categoryData, itemData, inventoryData, txData] = await Promise.all([
        StoreService.listCategories(),
        StoreService.listItems(),
        StoreService.getInventory(),
        StoreService.getTransactions(),
      ]);
      setCategories(categoryData || []);
      setItems(itemData || []);
      setInventory(inventoryData || []);
      setTransactions(txData || []);
      setWalletAddress(localStorage.getItem("walletAddress") || "");
    } catch (error) {
      ShowErrorMessage(error?.response?.data?.message || "Unable to load store.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(
    () =>
      selectedCategory
        ? items.filter((item) => item.categoryId === selectedCategory)
        : items,
    [items, selectedCategory]
  );

  const refreshData = async () => {
    const [inventoryData, txData] = await Promise.all([
      StoreService.getInventory(),
      StoreService.getTransactions(),
    ]);
    setInventory(inventoryData || []);
    setTransactions(txData || []);
  };

  const ensureMetaMask = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed.");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    return provider;
  };

  const handlePurchase = async (item) => {
    setBusyId(item.id);
    try {
      const provider = await ensureMetaMask();
      const signer = await provider.getSigner();
      const accounts = await provider.send("eth_accounts", []);
      const fromAddress = accounts[0];
      const network = await provider.getNetwork();

      if (TREASURY_ADDRESS.length === 0) {
        throw new Error("Store treasury address is not configured.");
      }

      const tx = await signer.sendTransaction({
        to: TREASURY_ADDRESS,
        value: ethers.parseEther(String(item.ethPrice)),
      });

      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) {
        throw new Error("Transaction was not confirmed.");
      }

      await StoreService.verifyEthPurchase({
        itemId: item.id,
        txHash: tx.hash,
        chainId: Number(network.chainId),
      });

      await refreshData();
      ShowSuccessMessage(`Purchased with ETH from ${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}`);
    } catch (error) {
      ShowErrorMessage(error?.message || error?.response?.data?.message || "Unable to purchase item.");
    } finally {
      setBusyId("");
    }
  };

  const handleEquip = async (itemId) => {
    setBusyId(itemId);
    try {
      await StoreService.equipItem({ itemId });
      await refreshData();
      ShowSuccessMessage("Item equipped.");
    } catch (error) {
      ShowErrorMessage(error?.response?.data?.message || "Unable to equip item.");
    } finally {
      setBusyId("");
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[520px] max-w-5xl items-center justify-center px-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
      </main>
    );
  }

  const ownedIds = new Set(inventory.map((entry) => entry.itemId));

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 py-10 px-4 sm:px-6">
      <main className="mx-auto max-w-7xl">
        {/* Store Title Bar */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">Store</h1>
            <p className="mt-2 text-sm text-slate-400">Purchase virtual items with MetaMask and manage inventory.</p>
            {walletAddress ? (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400 border border-cyan-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            ) : (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400 border border-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                MetaMask Wallet Not Connected
              </p>
            )}
          </div>
          
          {/* Category Selector Pills */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedCategory("")}
              className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                !selectedCategory
                  ? "border-cyan-500 bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                  : "border-white/10 bg-slate-900/40 text-slate-300 hover:border-white/20"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  selectedCategory === category.id
                    ? "border-cyan-500 bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                    : "border-white/10 bg-slate-900/40 text-slate-300 hover:border-white/20"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          {/* Store Items Grid */}
          <section>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-md shadow-xl flex flex-col justify-between">
                  <div>
                    <div
                      className="mb-4 aspect-[4/3] rounded-xl bg-slate-950 relative overflow-hidden border border-white/5"
                      style={
                        item.thumbnailUrl
                          ? { backgroundImage: `url(${item.thumbnailUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                          : undefined
                      }
                    />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
                      {item.category?.name || "Uncategorized"}
                    </span>
                    <h2 className="mt-1.5 text-lg font-bold text-slate-100">{item.name}</h2>
                    <p className="mt-2 text-xs text-slate-400 leading-5">{item.description}</p>
                  </div>
                  
                  <div>
                    <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                      <span className="text-sm font-extrabold text-cyan-400">{item.ethPrice} ETH</span>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        {ownedIds.has(item.id) ? "Owned" : "Available"}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={quantity[item.id] || 1}
                        onChange={(event) =>
                          setQuantity((current) => ({ ...current, [item.id]: Number(event.target.value) }))
                        }
                        className="h-10 w-16 rounded-xl border border-white/10 bg-slate-950/60 px-2 text-center text-sm outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => handlePurchase(item)}
                        disabled={busyId === item.id}
                        className="flex-1 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider hover:bg-cyan-300 disabled:opacity-50 transition shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                      >
                        {busyId === item.id ? "Processing..." : "Buy with ETH"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Side Panel: Inventory & Transaction History */}
          <aside className="grid gap-8 content-start">
            {/* Inventory Card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md shadow-xl">
              <h2 className="text-xl font-bold tracking-wide text-cyan-400">Inventory</h2>
              <p className="mt-2 text-xs text-slate-400">Your owned upgrades and active equipped skin.</p>
              <div className="mt-5 space-y-3 max-h-[300px] overflow-y-auto pr-1 border-t border-white/5 pt-4">
                {inventory.length === 0 && <p className="text-xs text-slate-500 py-2">No owned items yet.</p>}
                {inventory.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-xl border p-4 transition ${
                      entry.isEquipped
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-white/5 bg-slate-950/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-sm text-slate-200">{entry.item?.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Quantity: {entry.quantity}</p>
                      </div>
                      {entry.isEquipped && (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Equipped
                        </span>
                      )}
                    </div>
                    {!entry.isEquipped && (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleEquip(entry.itemId)}
                          disabled={busyId === entry.itemId}
                          className="rounded-lg border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition"
                        >
                          Equip
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction Log Card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md shadow-xl">
              <h2 className="text-xl font-bold tracking-wide text-cyan-400">Transactions</h2>
              <div className="mt-4 space-y-3 max-h-[350px] overflow-y-auto pr-1 border-t border-white/5 pt-4">
                {transactions.length === 0 && <p className="text-xs text-slate-500 py-2">No transactions recorded.</p>}
                {transactions.map((tx) => (
                  <div key={tx.id} className="rounded-xl border border-white/5 bg-slate-950/40 p-3 text-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-slate-200">{tx.item?.name}</strong>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-slate-400 capitalize">
                      {tx.type} &mdash; {tx.ethAmount || tx.amount} {tx.currency}
                    </p>
                    {tx.txHash && (
                      <p className="break-all font-mono text-[9px] text-slate-600 bg-slate-950 p-1.5 rounded border border-white/5">
                        Tx: {tx.txHash}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Store;
