import axios from "axios";

import { API_BASE_URL } from "../config/env";

const API_URL = `${API_BASE_URL}/api/doc/`;

const CHAT_URL = "http://localhost:5000/";
const createDocInfo = (
  basename,
  description,
  permission,
  fileUrl,
  fileName
) => {
  return axios.post(API_URL + "createdocinfo", {
    basename,
    description,
    permission,
    fileUrl,
    fileName,
  });
};

const getDocInfo = (email) => {
  return axios.post(API_URL + "getdocinfo", {
    email,
  });
};

const getDocContent = (filename) => {
  return axios.post(API_URL + "getdoccontent", {
    filename,
  });
};

const getWebInfo = (email) => {
  return axios.post(API_URL + "getwebinfo", {
    email,
  });
};

const embedde = (docInfo, webInfo) => {
  return axios.post(CHAT_URL + "embedde", {
    docInfo,
    webInfo,
  });
};

const chat = (message) => {
  return axios.post(CHAT_URL + "falcon_chat", {
    message,
  });
};

const createWebInfo = (
  weburl,
  pagecount,
  basename,
  description,
  permission
) => {
  return axios.post(API_URL + "createwebinfo", {
    weburl,
    pagecount,
    basename,
    description,
    permission,
  });
};

const getAllDocs = () => {
  return axios.get(API_URL + "getalldocs");
};

const getAllWebs = () => {
  return axios.get(API_URL + "getallwebs");
};

const updateDocRoles = (id, roles) => {
  return axios.post(API_URL + "updatedocroles", { id, roles });
};

const updateWebRoles = (id, roles) => {
  return axios.post(API_URL + "updatewebroles", { id, roles });
};

const DocService = {
  createDocInfo,
  getDocInfo,
  getWebInfo,
  getDocContent,
  createWebInfo,
  embedde,
  chat,
  getAllDocs,
  getAllWebs,
  updateDocRoles,
  updateWebRoles,
};

export default DocService;
