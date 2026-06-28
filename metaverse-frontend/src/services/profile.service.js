import axios from "axios";
import { API_BASE_URL } from "../config/env";
import AuthService from "./auth.service";

const API_URL = `${API_BASE_URL}/profile`;
const AVATAR_API_URL = `${API_BASE_URL}/avatar-customization`;

const getProfile = () => {
  return axios
    .get(API_URL, { headers: AuthService.getAuthHeader() })
    .then((response) => response.data.profile);
};

const updateProfile = (profile) => {
  return axios
    .patch(API_URL, profile, { headers: AuthService.getAuthHeader() })
    .then((response) => {
      const user = AuthService.getCurrentUser() || {};
      const updatedUser = {
        ...user,
        username: response.data.profile.username,
        avatarId: response.data.profile.avatar,
        role: response.data.profile.role,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      return response.data.profile;
  });
};

const getAvatarCustomization = () => {
  return axios
    .get(AVATAR_API_URL, { headers: AuthService.getAuthHeader() })
    .then((response) => response.data.customization);
};

const updateAvatarCustomization = (customization) => {
  return axios
    .patch(AVATAR_API_URL, customization, { headers: AuthService.getAuthHeader() })
    .then((response) => response.data.customization);
};

const ProfileService = {
  getProfile,
  updateProfile,
  getAvatarCustomization,
  updateAvatarCustomization,
};

export default ProfileService;
