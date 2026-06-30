import { apiRequest } from "./api";

const SocialService = {
  getFriends: () => apiRequest("get", "/api/social/friends"),
  getRequests: () => apiRequest("get", "/api/social/requests"),
  getNotifications: () => apiRequest("get", "/api/social/notifications"),
  getMessages: (friendId) => apiRequest("get", `/api/social/messages/${friendId}`),
  sendFriendRequest: (payload) => apiRequest("post", "/api/social/friend-requests", payload),
  respondToFriendRequest: (id, payload) =>
    apiRequest("patch", `/api/social/friend-requests/${id}`, payload),
  sendMessage: (payload) => apiRequest("post", "/api/social/messages", payload),
  markNotificationRead: (id) => apiRequest("patch", `/api/social/notifications/${id}/read`),
};

export default SocialService;
