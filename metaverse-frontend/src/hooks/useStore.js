import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config/env";
import { BrowserProvider, parseEther } from "ethers";

export const useStore = (autoLoad = true) => {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const loadStoreData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, invRes, txRes] = await Promise.all([
        axios.get(`${API_URL}/store/items`, getHeaders()),
        axios.get(`${API_URL}/store/inventory`, getHeaders()),
        axios.get(`${API_URL}/store/transactions`, getHeaders())
      ]);
      setProducts(prodRes.data.data || prodRes.data);
      setInventory(invRes.data.data || invRes.data);
      setTransactions(txRes.data.data || txRes.data);
    } catch (err) {
      console.error("Failed to load store data", err);
      setError("Failed to load store data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) loadStoreData();
  }, [autoLoad, loadStoreData]);

  const refreshInventory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/store/inventory`, getHeaders());
      setInventory(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const purchaseItem = async (productId, priceEth) => {
    setError(null);
    try {
      if (!window.ethereum) throw new Error("MetaMask is not installed.");
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      
      // Request transaction (Dummy treasury address for MVP)
      const treasury = "0x0000000000000000000000000000000000000000";
      
      let txHash = "dev_mock"; // Fallback for local testing without spending real funds
      
      // If user wants to do a real testnet transaction (optional in MVP)
      if (priceEth > 0 && process.env.REACT_APP_USE_REAL_TX === "true") {
        const tx = await signer.sendTransaction({
          to: treasury,
          value: parseEther(priceEth.toString()),
        });
        txHash = tx.hash;
        // Wait for confirmation
        await tx.wait();
      }

      // Verify on backend
      const res = await axios.post(`${API_URL}/store/purchase/verify`, {
        itemId: productId,
        txHash,
        walletAddress,
        chainId: 11155111 // Sepolia
      }, getHeaders());

      await refreshInventory();
      return res.data;
    } catch (err) {
      console.error("Purchase failed", err);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  const equipItem = async (productId) => {
    try {
      await axios.post(`${API_URL}/store/equip`, { itemId: productId }, getHeaders());
      await refreshInventory();
    } catch (err) {
      console.error("Equip failed", err);
      throw err;
    }
  };

  const sendGift = async (receiverId, productId, priceEth, message = "") => {
    try {
      if (!window.ethereum) throw new Error("MetaMask is not installed.");
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      let txHash = "dev_mock";
      if (priceEth > 0 && process.env.REACT_APP_USE_REAL_TX === "true") {
        const tx = await signer.sendTransaction({
          to: "0x0000000000000000000000000000000000000000",
          value: parseEther(priceEth.toString()),
        });
        txHash = tx.hash;
        await tx.wait();
      }

      await axios.post(`${API_URL}/store/gift`, {
        receiverId,
        productId,
        txHash,
        message
      }, getHeaders());

      return true;
    } catch (err) {
      console.error("Gift failed", err);
      throw err;
    }
  };

  const sendMoney = async (walletAddress, amountEth) => {
    try {
      if (!window.ethereum) throw new Error("MetaMask is not installed.");
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const tx = await signer.sendTransaction({
        to: walletAddress,
        value: parseEther(amountEth.toString()),
      });
      
      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.error("Send money failed", err);
      throw err;
    }
  };

  return {
    products,
    inventory,
    transactions,
    loading,
    error,
    refreshInventory,
    purchaseItem,
    equipItem,
    sendGift,
    sendMoney
  };
};

export default useStore;
