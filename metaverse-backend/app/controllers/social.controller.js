const socialService = require("../services/social.service");
const { sendError } = require("../utils/http");

exports.friends = async (req, res) => {
  try {
    return res.status(200).send({ data: await socialService.listFriends(req.userId) });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.requests = async (req, res) => {
  try {
    return res.status(200).send({ data: await socialService.listRequests(req.userId) });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.notifications = async (req, res) => {
  try {
    return res.status(200).send({ data: await socialService.listNotifications(req.userId) });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.messages = async (req, res) => {
  try {
    const friendId = req.params.friendId;
    return res.status(200).send({ data: await socialService.listMessages(req.userId, friendId) });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const request = await socialService.sendFriendRequest({
      senderId: req.userId,
      receiverId: req.body.receiverId,
      message: req.body.message,
    });
    return res.status(201).send({ data: request });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.respondToFriendRequest = async (req, res) => {
  try {
    const request = await socialService.respondToFriendRequest({
      requestId: req.params.id,
      userId: req.userId,
      action: req.body.action,
    });
    return res.status(200).send({ data: request });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const message = await socialService.sendMessage({
      senderId: req.userId,
      receiverId: req.body.receiverId,
      content: req.body.content,
    });
    return res.status(201).send({ data: message });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await socialService.markNotificationRead({
      userId: req.userId,
      notificationId: req.params.id,
    });
    return res.status(200).send({ data: notification });
  } catch (error) {
    return sendError(res, error);
  }
};
