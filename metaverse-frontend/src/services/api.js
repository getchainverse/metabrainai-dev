import axios from "axios";
import { API_BASE_URL } from "../config/env";
import AuthService from "./auth.service";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const auth = AuthService.getAuthHeader();
  config.headers = { ...config.headers, ...auth };
  return config;
});

/**
 * @param {"get"|"post"|"patch"|"put"|"delete"} method
 * @param {string} path
 * @param {object} [data]
 * @param {object} [params]
 */
export const apiRequest = (method, path, data, params) =>
  client({ method, url: path, data, params }).then((response) => response.data?.data);

export default client;
