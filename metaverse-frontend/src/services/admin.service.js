import client, { apiRequest } from "./api";
import AuthService from "./auth.service";

const list = (resource) => apiRequest("get", `/api/admin/${resource}`);
const create = (resource, payload) => apiRequest("post", `/api/admin/${resource}`, payload);
const update = (resource, id, payload) =>
  apiRequest("patch", `/api/admin/${resource}/${id}`, payload);
const remove = (resource, id) => apiRequest("delete", `/api/admin/${resource}/${id}`);

const uploadKnowledgeBase = (payload) =>
  client
    .post("/api/admin/knowledge-bases/upload", payload, {
      headers: {
        ...AuthService.getAuthHeader(),
        "Content-Type": "multipart/form-data",
      },
    })
    .then((response) => response.data?.data);

const AdminService = {
  getDashboard: () => apiRequest("get", "/api/admin/dashboard"),
  listUsers: () => list("users"),
  createUser: (payload) => create("users", payload),
  updateUser: (id, payload) => update("users", id, payload),
  deleteUser: (id) => remove("users", id),
  listKnowledgeBases: () => list("knowledge-bases"),
  createKnowledgeBase: (payload) => create("knowledge-bases", payload),
  uploadKnowledgeBase,
  searchKnowledgeBases: (payload) => apiRequest("post", "/api/admin/knowledge-bases/search", payload),
  updateKnowledgeBase: (id, payload) => update("knowledge-bases", id, payload),
  deleteKnowledgeBase: (id) => remove("knowledge-bases", id),
  listRoles: () => list("roles"),
  createRole: (payload) => create("roles", payload),
  updateRole: (id, payload) => update("roles", id, payload),
  deleteRole: (id) => remove("roles", id),
  updateRoleAssignments: (id, payload) => update("roles", `${id}/assignments`, payload),
  listPermissions: () => list("permissions"),
  createPermission: (payload) => create("permissions", payload),
  updatePermission: (id, payload) => update("permissions", id, payload),
  deletePermission: (id) => remove("permissions", id),
  listAvatars: () => list("avatars"),
  createAvatar: (payload) => create("avatars", payload),
  updateAvatar: (id, payload) => update("avatars", id, payload),
  deleteAvatar: (id) => remove("avatars", id),
};

export default AdminService;
