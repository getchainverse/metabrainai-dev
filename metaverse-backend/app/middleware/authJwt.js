const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const prisma = require("../prisma/client");
const User = db.user;

verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  let token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.session && req.session.token;

  if (!token) {
    return res.status(401).send({
      message: "No token provided!",
    });
  }

  jwt.verify(token,
             config.secret,
             (err, decoded) => {
              if (err) {
                return res.status(401).send({
                  message: "Unauthorized!",
                });
              }
              req.userId = decoded.id;
              req.walletAddress = decoded.walletAddress;
              req.userRole = decoded.role;
              next();
             });
};

isAdmin = async (req, res, next) => {
  try {
    if (req.userRole === "admin") {
      return next();
    }

    const prismaUser =
      typeof req.userId === "string"
        ? await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
              role: true,
              roles: {
                select: {
                  name: true,
                  permissions: { select: { key: true } },
                },
              },
            },
          })
        : null;

    if (
      prismaUser &&
      (prismaUser.role === "admin" ||
        prismaUser.roles.some((role) => role.name === "admin"))
    ) {
      return next();
    }

    const user = await User.findByPk(req.userId);
    if (!user || typeof user.getRoles !== "function") {
      return res.status(403).send({
        message: "Require Admin Role!",
      });
    }

    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "admin") {
        return next();
      }
    }

    return res.status(403).send({
      message: "Require Admin Role!",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Unable to validate User role!",
    });
  }
};

hasPermission = (permissionKey) => async (req, res, next) => {
  try {
    if (req.userRole === "admin") {
      return next();
    }

    const user =
      typeof req.userId === "string"
        ? await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
              role: true,
              roles: {
                select: {
                  name: true,
                  permissions: { select: { key: true } },
                },
              },
            },
          })
        : null;

    if (!user) {
      return res.status(403).send({ message: "Permission required!" });
    }

    const allowed =
      user.role === "admin" ||
      user.roles.some(
        (role) =>
          role.name === "admin" ||
          role.permissions.some((permission) => permission.key === permissionKey)
      );

    if (!allowed) {
      return res.status(403).send({ message: "Permission required!" });
    }

    return next();
  } catch (error) {
    return res.status(500).send({
      message: "Unable to validate permissions!",
    });
  }
};

isModerator = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "moderator") {
        return next();
      }
    }

    return res.status(403).send({
      message: "Require Moderator Role!",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Unable to validate Moderator role!",
    });
  }
};

isModeratorOrAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "moderator") {
        return next();
      }

      if (roles[i].name === "admin") {
        return next();
      }
    }

    return res.status(403).send({
      message: "Require Moderator or Admin Role!",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Unable to validate Moderator or Admin role!",
    });
  }
};

const authJwt = {
  verifyToken,
  isAdmin,
  hasPermission,
  isModerator,
  isModeratorOrAdmin,
};
module.exports = authJwt;
