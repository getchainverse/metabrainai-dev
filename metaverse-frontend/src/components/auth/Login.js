import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form } from "antd";
import InputItem from "../common/InputItem";
import ButtonItem from "../common/ButtonItem";
import AuthService from "../../services/auth.service";
import { ShowSuccessMessage, ShowErrorMessage } from "../common/Message";
import MetaMaskIcon from "../../assets/MetaMask-icon-fox.svg";

const Login = () => {
  const [isLoading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState(
    localStorage.getItem("walletAddress") || ""
  );
  const navigate = useNavigate();

  const onFinish = (form) => {
    setLoading(true);
    AuthService.login(form.email, form.password).then(
      () => {
        navigate("/home");
        ShowSuccessMessage("Login Successfully");
      },
      (error) => {
        console.log("error", error.message);
        ShowErrorMessage(error.response.data.message);
        setLoading(false);
      }
    );
  };

  const formatAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  const connectWallet = async () => {
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      ShowErrorMessage("MetaMask is not installed.");
      return;
    }

    setWalletLoading(true);

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const walletAddress = accounts && accounts[0];

      if (!walletAddress) {
        throw new Error("No wallet account selected.");
      }

      setConnectedAddress(walletAddress);

      const challenge = await AuthService.requestWalletNonce(walletAddress);
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [challenge.message, walletAddress],
      });

      const session = await AuthService.verifyWalletSignature({
        walletAddress,
        signature,
        nonceToken: challenge.nonceToken,
      });

      setConnectedAddress(session.user.walletAddress);
      ShowSuccessMessage("Wallet connected successfully");
      navigate("/user");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Wallet authentication failed.";
      ShowErrorMessage(message);
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <Form
      layout="vertical"
      onFinish={onFinish}
      className="m-auto mt-36 w-96 rounded border border-solid bg-clip-border p-10 shadow-lg"
    >
      <InputItem name="email" label="Official Email ID" type="email" />
      <InputItem name="password" label="Password" type="password" />
      <div className="flex justify-between mt-10">
        <ButtonItem addClass="w-20" buttonName="Sign in" loading={isLoading} />
        <a className="text-[#0F7BDE]" href="/forgot">
          Forgot Password?
        </a>
      </div>
      <div className="flex mt-8 cursor-pointer">
        <p className="mr-1">Don't have an account?</p>
        <a className="text-[#0F7BDE]" href="/register">
          Sign up
        </a>
      </div>
      <div className="my-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-sm text-gray-500">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <button
        type="button"
        onClick={connectWallet}
        disabled={walletLoading}
        className="flex min-h-[44px] w-full items-center justify-center gap-3 rounded border border-solid border-[#f6851b] bg-white px-4 py-2 text-sm font-semibold text-[#183442] transition hover:bg-[#fff7ef] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <img src={MetaMaskIcon} alt="" className="h-6 w-6" />
        {walletLoading ? "Waiting for signature..." : "Connect MetaMask"}
      </button>
      {connectedAddress && (
        <p className="mt-3 break-all text-center text-sm text-gray-600">
          Connected: {formatAddress(connectedAddress)}
        </p>
      )}
      {!window.ethereum && (
        <a
          className="mt-3 block text-center text-sm text-[#0F7BDE]"
          href="https://metamask.io/download/"
          target="_blank"
          rel="noreferrer"
        >
          Install MetaMask
        </a>
      )}
    </Form>
  );
};

export default Login;
