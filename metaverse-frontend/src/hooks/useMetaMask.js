import { useCallback, useState } from "react";
import { formatAddress } from "../utils/formatAddress";

export const useMetaMask = () => {
  const [walletAddress, setWalletAddress] = useState(
    () => localStorage.getItem("walletAddress") || ""
  );
  const [error, setError] = useState("");

  const connect = useCallback(async () => {
    setError("");
    if (!window.ethereum) {
      setError("MetaMask is not installed.");
      return null;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts?.length) {
        setWalletAddress(accounts[0]);
        localStorage.setItem("walletAddress", accounts[0]);
        return accounts[0];
      }
    } catch (err) {
      setError(err?.message || "Wallet connection failed.");
    }
    return null;
  }, []);

  const signMessage = useCallback(async (message) => {
    if (!window.ethereum || !walletAddress) return null;
    return window.ethereum.request({
      method: "personal_sign",
      params: [message, walletAddress],
    });
  }, [walletAddress]);

  const clearWallet = useCallback(() => {
    setWalletAddress("");
    localStorage.removeItem("walletAddress");
  }, []);

  return {
    walletAddress,
    formattedAddress: formatAddress(walletAddress),
    error,
    connect,
    signMessage,
    clearWallet,
    isInstalled: Boolean(window.ethereum),
  };
};

export default useMetaMask;
