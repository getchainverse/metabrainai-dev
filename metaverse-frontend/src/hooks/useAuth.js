import { useState, useEffect, useCallback, useMemo } from "react";
import AuthService from "../services/auth.service";

export const useAuth = () => {
  const [state, setState] = useState({
    user: AuthService.getCurrentUser(),
    accessToken: localStorage.getItem("accessToken"),
    walletAddress: localStorage.getItem("walletAddress")
  });

  useEffect(() => {
    const handleStorage = () => {
      setState({
        user: AuthService.getCurrentUser(),
        accessToken: localStorage.getItem("accessToken"),
        walletAddress: localStorage.getItem("walletAddress")
      });
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const isAuthenticated = Boolean(state.accessToken);
  const isAdmin =
    state.user?.role === "admin" ||
    state.user?.roles?.includes("ROLE_ADMIN");

  const logout = useCallback(() => {
    AuthService.logout();
    window.dispatchEvent(new Event("storage"));
  }, []);

  return useMemo(
    () => ({
      user: state.user,
      accessToken: state.accessToken,
      walletAddress: state.walletAddress,
      isAuthenticated,
      isAdmin,
      logout,
    }),
    [state, isAuthenticated, isAdmin, logout]
  );
};

export default useAuth;
