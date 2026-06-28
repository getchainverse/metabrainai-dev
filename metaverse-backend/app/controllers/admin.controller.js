const adminService = require("../services/admin.service");
const { sendError } = require("../utils/http");

const crud = (resource) => ({
  list: async (req, res) => {
    try {
      return res.status(200).send({ data: await adminService[`list${resource}`]() });
    } catch (error) {
      return sendError(res, error);
    }
  },
  create: async (req, res) => {
    try {
      return res.status(201).send({ data: await adminService[`create${resource}`](req.body) });
    } catch (error) {
      return sendError(res, error);
    }
  },
  update: async (req, res) => {
    try {
      return res
        .status(200)
        .send({ data: await adminService[`update${resource}`](req.params.id, req.body) });
    } catch (error) {
      return sendError(res, error);
    }
  },
  remove: async (req, res) => {
    try {
      await adminService[`delete${resource}`](req.params.id);
      return res.status(204).send();
    } catch (error) {
      return sendError(res, error);
    }
  },
});

exports.dashboard = async (req, res) => {
  try {
    return res.status(200).send({ data: await adminService.dashboard() });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.users = crud("Users");
exports.knowledgeBases = crud("KnowledgeBases");
exports.roles = crud("Roles");
exports.permissions = crud("Permissions");
exports.avatars = crud("Avatars");

exports.updateRoleAssignments = async (req, res) => {
  try {
    return res.status(200).send({
      data: await adminService.updateRoleAssignments(req.params.id, req.body),
    });
  } catch (error) {
    return sendError(res, error);
  }
};
