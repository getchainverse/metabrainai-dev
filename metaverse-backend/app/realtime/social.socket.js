const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const prisma = require("../prisma/client");
const socialService = require("../services/social.service");
const { logger } = require("../utils/logger");

const onlineUsers = new Map();

const getUserRoom = (userId) => `user:${userId}`;

const requireAuth = (authUser, socket) => {
  if (!authUser.authenticated) {
    socket.emit("social:error", { message: "Authentication required." });
    return false;
  }
  return true;
};

const attachSocialSocket = (io) => {
  io.on("connection", async (socket) => {
    let authUser = { userId: socket.id, username: "Guest", authenticated: false };

    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const decoded = jwt.verify(token, config.secret);
        authUser = {
          userId: decoded.id || socket.id,
          username: decoded.username || "Guest",
          authenticated: Boolean(decoded.id),
        };
      }
    } catch (error) {
      logger.warn("socket auth failed", { socketId: socket.id, message: error.message });
    }

    socket.join(getUserRoom(authUser.userId));
    onlineUsers.set(authUser.userId, {
      socketId: socket.id,
      username: authUser.username,
      lastSeen: new Date(),
    });

    io.emit("social:presence", {
      userId: authUser.userId,
      status: "online",
      lastSeen: new Date().toISOString(),
    });

    socket.emit("social:init", {
      onlineUsers: Array.from(onlineUsers.entries()).map(([userId, value]) => ({
        userId,
        status: "online",
        username: value.username,
      })),
    });

    socket.on("social:friend-request", async ({ receiverId, message }) => {
      if (!requireAuth(authUser, socket)) return;
      try {
        const request = await socialService.sendFriendRequest({
          senderId: authUser.userId,
          receiverId,
          message,
        });
        io.to(getUserRoom(receiverId)).emit("social:friend-request", request);
        io.to(getUserRoom(receiverId)).emit("social:notification", {
          type: "friend_request",
          title: "Friend request",
          body: "You have a new friend request.",
        });
      } catch (error) {
        socket.emit("social:error", { message: error.message });
      }
    });

    socket.on("social:message", async ({ receiverId, content }) => {
      if (!requireAuth(authUser, socket)) return;
      try {
        const message = await socialService.sendMessage({
          senderId: authUser.userId,
          receiverId,
          content,
        });
        io.to(getUserRoom(receiverId)).emit("social:message", message);
        io.to(getUserRoom(receiverId)).emit("social:notification", {
          type: "direct_message",
          title: "New private message",
          body: content.slice(0, 120),
        });
      } catch (error) {
        socket.emit("social:error", { message: error.message });
      }
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(authUser.userId);
      io.emit("social:presence", {
        userId: authUser.userId,
        status: "offline",
        lastSeen: new Date().toISOString(),
      });
    });
  });

  return io;
};

module.exports = { attachSocialSocket };
