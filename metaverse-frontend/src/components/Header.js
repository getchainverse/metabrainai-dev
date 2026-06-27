import React, { useState, useEffect } from "react";
import { Menu } from "antd";
import NavItem from "./common/NavItem";
import AuthService from "../services/auth.service";
import ButtonItem from "./common/ButtonItem";
import metamask from "../assets/MetaMask-icon-fox.svg";
import '../ph.css'
const Header = () => {
  const [currentUser, setCurrentUser] = useState();
  const [showAdminBoard, setShowAdminBoard] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState("");

  useEffect(() => {
    const savedWallet = localStorage.getItem("walletAddress");
    if (savedWallet) {
      setWalletAddress(savedWallet);
    }
  }, []);

  const logOut = () => {
    AuthService.logout();
    setCurrentUser(undefined);
    localStorage.removeItem("walletAddress");
    setWalletAddress("");
  };

  const connectWallet = async () => {
    setWalletError("");

    if (!window.ethereum) {
      setWalletError("MetaMask is not installed.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        localStorage.setItem("walletAddress", accounts[0]);
      }
    } catch (error) {
      setWalletError(error?.message || "Wallet connection failed.");
    }
  };

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setShowAdminBoard(user.roles.includes("ROLE_ADMIN"));
    }
    console.log("user", user);
  }, []);


  return (
    <>
      <Menu className="h-[70px] px-16 border-2 drop-shadow-lg">
        {currentUser ? (
          <>
            <div className="float-left mt-3">
              <img
                src="./MetasphereswithTagLine.png"
                style={{ width: 60, height: 45 }}
              />
            </div>
            <div className="float-right flex">
              <NavItem to="/home" title="Home" />
              {/* <NavItem to="/mod" title="Moderator Board" /> */}
              {(showAdminBoard || walletAddress) && (
                <NavItem to="/admin" title="Knowledge Base" />
              )}
              {walletAddress && <NavItem to="/user" title="Chatbot" />}
              <li className="my-5 ml-24 block text-lg font-normal hover:font-bold hover:text-back-red md:inline-block">
                <a href="/login" onClick={logOut}>
                  LogOut
                </a>
              </li>
              <NavItem to="/profile" title={currentUser.username} />
            </div>
          </>
        ) : (
          <>
            <div className="float-left mt-3">
              <img
                src="./MetasphereswithTagLine.png"
                style={{ width: 60, height: 45 }}
              />
            </div>
            <div className="float-right flex">
              <NavItem
                to="/login"
                title="Login"
                addClass="border-2 text-center"
              />
              <ButtonItem
                buttonName={walletAddress ? "Connected" : "Connect"}
                addClass="bg-white text-center ml-8 w-32 m-auto"
                onClick={connectWallet}
                disabled={!!walletAddress}
              />
              {walletAddress && <NavItem to="/user" title="Chatbot" />}
            </div>
          </>
        )}
      </Menu>
      {walletError ? (
        <div style={{ color: "crimson", padding: "8px 64px" }}>{walletError}</div>
      ) : null}
      {walletAddress ? (
        <div style={{ padding: "8px 64px", fontSize: "0.9rem" }}>
          Connected wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </div>
      ) : null}
    </>
  );
};

export default Header;
