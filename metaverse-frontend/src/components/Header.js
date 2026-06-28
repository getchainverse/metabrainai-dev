import React, { useMemo, useState } from "react";
import NavItem from "./common/NavItem";
import ButtonItem from "./common/ButtonItem";
import useAuth from "../hooks/useAuth";
import useMetaMask from "../hooks/useMetaMask";

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { walletAddress, formattedAddress, error: walletError, connect } = useMetaMask();
  const [menuOpen, setMenuOpen] = useState(false);

  const showWalletNav = isAuthenticated || Boolean(walletAddress);
  const showAdmin = isAdmin;

  const navLinks = useMemo(
    () => [
      { to: "/home", title: "Home", show: true },
      { to: "/admin", title: "Admin", show: showAdmin },
      { to: "/store", title: "Store", show: true },
      { to: "/social", title: "Social", show: true },
      { to: "/user", title: "Chatbot", show: true },
      { to: "/profile", title: user?.username || "Profile", show: isAuthenticated },
    ],
    [showAdmin, isAuthenticated, user?.username]
  );

  const handleLogout = (event) => {
    event.preventDefault();
    logout();
    setMenuOpen(false);
  };

  return (
    <header className="relative border-b-2 border-slate-200 bg-white text-slate-800 shadow-md">
      <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 sm:px-8">
        <a href="/home" className="flex-shrink-0">
          <img src="./MetasphereswithTagLine.png" alt="MetaBrain" className="h-11 w-auto" />
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks
            .filter((link) => link.show)
            .map((link) => (
              <NavItem key={link.to} to={link.to} title={link.title} />
            ))}
          {isAuthenticated ? (
            <>
              <ButtonItem
                buttonName={walletAddress ? "Connected" : "Connect"}
                addClass="bg-white text-center ml-4 w-32"
                onClick={connect}
                disabled={!!walletAddress}
              />
              <a
                href="/login"
                onClick={handleLogout}
                className="ml-4 text-lg hover:font-bold hover:text-red-500"
              >
                LogOut
              </a>
            </>
          ) : (
            <>
              <NavItem to="/login" title="Login" addClass="border-2 text-center ml-2" />
              <NavItem to="/register" title="Sign Up" addClass="border-2 text-center ml-2" />
              <ButtonItem
                buttonName={walletAddress ? "Connected" : "Connect"}
                addClass="bg-white text-center ml-4 w-32"
                onClick={connect}
                disabled={!!walletAddress}
              />
            </>
          )}
        </nav>

        <button
          type="button"
          className="rounded-md border px-3 py-2 text-sm md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          Menu
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks
              .filter((link) => link.show)
              .map((link) => (
                <NavItem
                  key={link.to}
                  to={link.to}
                  title={link.title}
                  onClick={() => setMenuOpen(false)}
                />
              ))}
            {!isAuthenticated && (
              <>
                <NavItem to="/login" title="Login" onClick={() => setMenuOpen(false)} />
                <NavItem to="/register" title="Sign Up" onClick={() => setMenuOpen(false)} />
              </>
            )}
            <div className="py-2">
              <ButtonItem
                buttonName={walletAddress ? "Connected" : "Connect Wallet"}
                addClass="bg-white text-center w-full"
                onClick={connect}
                disabled={!!walletAddress}
              />
            </div>
            {isAuthenticated && (
              <a href="/login" onClick={handleLogout} className="py-2 text-red-500">
                LogOut
              </a>
            )}
          </div>
        </nav>
      )}

      {walletError ? (
        <div className="px-4 py-2 text-sm text-red-600 sm:px-8">{walletError}</div>
      ) : null}
      {walletAddress ? (
        <div className="px-4 pb-2 text-sm text-slate-600 sm:px-8">
          Wallet: {formattedAddress}
        </div>
      ) : null}
    </header>
  );
};

export default Header;
