import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Attach the JWT (stored at login) to every outgoing request so the backend
// can authenticate protected routes via the Authorization header.
axios.interceptors.request.use((config) => {
  const stored = localStorage.getItem("user");
  if (stored) {
    const user = JSON.parse(stored);
    if (user && user.accessToken) {
      config.headers["Authorization"] = "Bearer " + user.accessToken;
    }
  }
  return config;
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <ToastContainer />
    <App />
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
