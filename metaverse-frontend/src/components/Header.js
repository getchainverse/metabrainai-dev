import React, { useState, useEffect } from "react";
import { Menu } from "antd";
import NavItem from "./common/NavItem";
import AuthService from "../services/auth.service";
import ButtonItem from "./common/ButtonItem";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

const Header = () => {
  const [currentUser, setCurrentUser] = useState();
  const [showAdminBoard, setShowAdminBoard] = useState(false);
  const { publicKey, connected } = useWallet();

  const logOut = () => {
    AuthService.logout();
    setCurrentUser(undefined);
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
    <Menu className="h-[70px] px-16 border-2 drop-shadow-lg flex items-center justify-between">
      <div className="flex items-center">
        <img
          src="./MetasphereswithTagLine.png"
          style={{ width: 60, height: 45 }}
          alt="Logo"
        />
      </div>

      <div className="flex items-center gap-6">
        {currentUser || connected ? (
          <>
            <NavItem to="/home" title="Home" />
            {showAdminBoard && <NavItem to="/admin" title="Knowledge Base" />}
            <NavItem to="/user" title="User" />
            {!connected && currentUser && (
              <li className="list-none text-lg font-normal hover:font-bold hover:text-back-red">
                <a href="/login" onClick={logOut}>
                  LogOut
                </a>
              </li>
            )}
            <NavItem 
              to="/profile" 
              title={connected ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}` : currentUser?.username} 
            />
          </>
        ) : (
          <>
            <NavItem
              to="/login"
              title="Login"
              addClass="border-2 text-center"
            />
          </>
        )}
        <div className="solana-button-wrapper ml-4">
          <WalletMultiButton />
        </div>
      </div>
    </Menu>
  );
};

export default Header;
