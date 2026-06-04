import axios from "axios";

const API_URL = "http://localhost:3001/api/auth/";

const register = (
  firstname,
  lastname,
  username,
  email,
  password,
  companyname,
  url,
  firstaddress,
  secondaddress,
  country,
  zipcode,
  phone
) => {
  return axios.post(API_URL + "signup", {
    firstname,
    lastname,
    username,
    email,
    password,
    companyname,
    url,
    firstaddress,
    secondaddress,
    country,
    zipcode,
    phone,
  });
};

const login = (email, password) => {
  return axios
    .post(API_URL + "signin", {
      email,
      password,
    })
    .then((response) => {
      if (response.data.username) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }

      return response.data;
    });
};

const sendMail = (email) => {
  return axios.post(API_URL + "sendmail", { email }).then((response) => {
    // if (response.data.accessToken) {
    //   localStorage.setItem("user", JSON.stringify(response.data));
    // }
    return response.data;
  });
};

const logout = () => {
  localStorage.removeItem("user");
  return axios.post(API_URL + "signout").then((response) => {
    return response.data;
  });
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

const resetPasswordByUser = (data) => {
  return axios
    .post(API_URL + "resetpasswordbyuser", { data })
    .then((response) => {
      localStorage.removeItem("user");
      return response;
    });
};

const getLastExpiredTime = (data) => {
  return axios.post(API_URL + "getlastexpiredtime", { data });
};

const getAllUserData = () => {
  return axios.get(API_URL + "getalluserdata", {});
};

const setRoleByUser = (role, email) => {
  return axios.post(API_URL + "setrolebyuser", { role, email });
};

const AuthService = {
  register,
  login,
  sendMail,
  logout,
  getCurrentUser,
  resetPasswordByUser,
  getLastExpiredTime,
  getAllUserData,
  setRoleByUser,
};

export default AuthService;
