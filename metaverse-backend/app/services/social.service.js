const prisma = require("../prisma/client");

const normalizeUser = (user) => ({
  id: user.id,
  walletAddress: user.walletAddress,
  username: user.username,
  avatarId: user.avatarId,
  role: user.role,
});

const normalizePair = (a, b) => (a < b ? [a, b] : [b, a]);

const listFriends = async (userId) => {
  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: true,
      userB: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return friendships.map((friendship) => {
    const friend = friendship.userAId === userId ? friendship.userB : friendship.userA;
    return { id: friendship.id, friend: normalizeUser(friend), createdAt: friendship.createdAt };
  });
};

const listRequests = async (userId) =>
  prisma.friendRequest.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: true,
      receiver: true,
    },
    orderBy: { createdAt: "desc" },
  });

const listNotifications = async (userId) =>
  prisma.socialNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

const listMessages = async (userId, friendId) =>
  prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

const sendFriendRequest = async ({ senderId, receiverId, message }) => {
  if (senderId === receiverId) {
    const error = new Error("You cannot add yourself.");
    error.statusCode = 400;
    throw error;
  }

  const receiverExists = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiverExists) {
    const error = new Error("The target user does not exist.");
    error.statusCode = 404;
    throw error;
  }

  const [userAId, userBId] = normalizePair(senderId, receiverId);
  const existingFriendship = await prisma.friendship.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
  });
  if (existingFriendship) {
    const error = new Error("You are already friends.");
    error.statusCode = 400;
    throw error;
  }

  const request = await prisma.friendRequest.upsert({
    where: { senderId_receiverId: { senderId, receiverId } },
    update: { status: "pending", message: message || null },
    create: { senderId, receiverId, message: message || null },
    include: { sender: true, receiver: true },
  });

  await prisma.socialNotification.create({
    data: {
      userId: receiverId,
      type: "friend_request",
      title: "Friend request",
      body: `${request.sender.username || request.sender.walletAddress} sent you a friend request.`,
      payload: { requestId: request.id, senderId, receiverId },
    },
  });

  return request;
};

const respondToFriendRequest = async ({ requestId, userId, action }) => {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: { sender: true, receiver: true },
  });

  if (!request || request.receiverId !== userId || request.status !== "pending") {
    const error = new Error("Friend request not found.");
    error.statusCode = 404;
    throw error;
  }

  const status = action === "accept" ? "accepted" : "rejected";
  const updated = await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status },
    include: { sender: true, receiver: true },
  });

  if (status === "accepted") {
    const [userAId, userBId] = normalizePair(request.senderId, request.receiverId);
    await prisma.friendship.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      update: {},
      create: { userAId, userBId },
    });
  }

  await prisma.socialNotification.create({
    data: {
      userId: request.senderId,
      type: "friend_request_response",
      title: `Friend request ${status}`,
      body: `${request.receiver.username || request.receiver.walletAddress} ${status} your request.`,
      payload: { requestId, status },
    },
  });

  return updated;
};

const sendMessage = async ({ senderId, receiverId, content }) => {
  const text = String(content || "").trim();
  if (!text) {
    const error = new Error("Message is required.");
    error.statusCode = 400;
    throw error;
  }

  const [userAId, userBId] = normalizePair(senderId, receiverId);
  const friendship = await prisma.friendship.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
  });
  if (!friendship) {
    const error = new Error("You must be friends to chat privately.");
    error.statusCode = 403;
    throw error;
  }

  const message = await prisma.directMessage.create({
    data: { senderId, receiverId, content: text },
  });

  await prisma.socialNotification.create({
    data: {
      userId: receiverId,
      type: "direct_message",
      title: "New private message",
      body: text.slice(0, 120),
      payload: { messageId: message.id, senderId },
    },
  });

  return message;
};

const markNotificationRead = async ({ userId, notificationId }) => {
  const notification = await prisma.socialNotification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) {
    const error = new Error("Notification not found.");
    error.statusCode = 404;
    throw error;
  }
  return prisma.socialNotification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

module.exports = {
  normalizeUser,
  listFriends,
  listRequests,
  listNotifications,
  listMessages,
  sendFriendRequest,
  respondToFriendRequest,
  sendMessage,
  markNotificationRead,
};
