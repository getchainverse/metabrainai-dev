const { authJwt } = require("../middleware");
const controller = require("../controllers/admin.controller");
const knowledgeBaseController = require("../controllers/knowledge-base.controller");
const rateLimit = require("../middleware/rateLimit");

const adminOnly = [authJwt.verifyToken, authJwt.isAdmin];
const adminLimit = rateLimit({ max: 30, windowMs: 60_000, keyPrefix: "admin" });

const adminGuard = [...adminOnly, adminLimit];

module.exports = function (app) {
  app.get("/api/admin/dashboard", adminGuard, controller.dashboard);

  app.get("/api/admin/users", adminGuard, controller.users.list);
  app.post("/api/admin/users", adminGuard, controller.users.create);
  app.patch("/api/admin/users/:id", adminGuard, controller.users.update);
  app.delete("/api/admin/users/:id", adminGuard, controller.users.remove);

  app.get("/api/admin/knowledge-bases", adminGuard, controller.knowledgeBases.list);
  app.post("/api/admin/knowledge-bases", adminGuard, controller.knowledgeBases.create);
  app.post(
    "/api/admin/knowledge-bases/upload",
    adminGuard,
    knowledgeBaseController.uploadMiddleware,
    knowledgeBaseController.upload
  );
  app.post(
    "/api/admin/knowledge-bases/search",
    adminGuard,
    knowledgeBaseController.search
  );
  app.patch("/api/admin/knowledge-bases/:id", adminGuard, controller.knowledgeBases.update);
  app.delete("/api/admin/knowledge-bases/:id", adminGuard, controller.knowledgeBases.remove);

  app.get("/api/admin/roles", adminGuard, controller.roles.list);
  app.post("/api/admin/roles", adminGuard, controller.roles.create);
  app.patch("/api/admin/roles/:id", adminGuard, controller.roles.update);
  app.delete("/api/admin/roles/:id", adminGuard, controller.roles.remove);
  app.patch(
    "/api/admin/roles/:id/assignments",
    adminGuard,
    controller.updateRoleAssignments
  );

  app.get("/api/admin/permissions", adminGuard, controller.permissions.list);
  app.post("/api/admin/permissions", adminGuard, controller.permissions.create);
  app.patch("/api/admin/permissions/:id", adminGuard, controller.permissions.update);
  app.delete("/api/admin/permissions/:id", adminGuard, controller.permissions.remove);

  app.get("/api/admin/avatars", adminGuard, controller.avatars.list);
  app.post("/api/admin/avatars", adminGuard, controller.avatars.create);
  app.patch("/api/admin/avatars/:id", adminGuard, controller.avatars.update);
  app.delete("/api/admin/avatars/:id", adminGuard, controller.avatars.remove);
};
