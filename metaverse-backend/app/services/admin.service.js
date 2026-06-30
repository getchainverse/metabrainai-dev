const { getAddress } = require("ethers");
const prisma = require("../prisma/client");
const knowledgeBaseService = require("./knowledge-base.service");

const pickString = (value) => (typeof value === "string" ? value.trim() : "");

const failValidation = (errors) => {
  const error = new Error("Validation failed.");
  error.statusCode = 400;
  error.errors = errors;
  throw error;
};

const assertId = (id) => {
  if (!id) {
    failValidation({ id: "Resource id is required." });
  }
};

const validateRoleName = (name) => {
  if (!name) return "Role name is required.";
  if (name.length > 32) return "Role name must be 32 characters or less.";
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return "Role name can only contain letters, numbers, underscores, and hyphens.";
  }
  return "";
};

const dashboard = async () => {
  const [totalUsers, knowledgeBases, aiAvatars, roles] = await Promise.all([
    prisma.user.count(),
    prisma.knowledgeBase.count(),
    prisma.aIAvatar.count(),
    prisma.role.count(),
  ]);

  return { totalUsers, knowledgeBases, aiAvatars, roles };
};

const listUsers = () =>
  prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { profile: true, roles: true },
  });

const createUser = async (payload) => {
  const errors = {};
  let walletAddress = pickString(payload.walletAddress);

  try {
    walletAddress = getAddress(walletAddress);
  } catch (error) {
    errors.walletAddress = "A valid wallet address is required.";
  }

  const username = pickString(payload.username);
  const role = pickString(payload.role) || "user";

  if (username && username.length > 32) {
    errors.username = "Username must be 32 characters or less.";
  }

  const roleError = validateRoleName(role);
  if (roleError) errors.role = roleError;

  if (Object.keys(errors).length) failValidation(errors);

  return prisma.user.create({
    data: {
      walletAddress,
      username: username || `user-${walletAddress.slice(2, 8).toLowerCase()}`,
      avatarId: pickString(payload.avatarId) || "avatar-1",
      role,
      roles: payload.roleId ? { connect: { id: payload.roleId } } : undefined,
    },
    include: { roles: true },
  });
};

const updateUser = async (id, payload) => {
  assertId(id);
  const errors = {};
  const username = pickString(payload.username);
  const avatarId = pickString(payload.avatarId);
  const role = pickString(payload.role);

  if (username && username.length > 32) {
    errors.username = "Username must be 32 characters or less.";
  }

  if (role) {
    const roleError = validateRoleName(role);
    if (roleError) errors.role = roleError;
  }

  if (Object.keys(errors).length) failValidation(errors);

  return prisma.user.update({
    where: { id },
    data: {
      ...(username ? { username } : {}),
      ...(avatarId ? { avatarId } : {}),
      ...(role ? { role } : {}),
    },
    include: { roles: true },
  });
};

const deleteUser = async (id) => {
  assertId(id);
  return prisma.user.delete({ where: { id } });
};

const listKnowledgeBases = () =>
  prisma.knowledgeBase.findMany({
    orderBy: { updatedAt: "desc" },
    include: { roles: true },
  });

const validateKnowledgeBase = (payload) => {
  const input = {
    name: pickString(payload.name),
    description: pickString(payload.description),
    sourceType: pickString(payload.sourceType) || "document",
    status: pickString(payload.status) || "draft",
    roleIds: asIdList(payload.roleIds || [], "roleIds"),
  };
  const errors = {};

  if (!input.name) errors.name = "Knowledge base name is required.";
  if (input.name.length > 80) errors.name = "Name must be 80 characters or less.";
  if (input.description.length > 240) {
    errors.description = "Description must be 240 characters or less.";
  }

  if (Object.keys(errors).length) failValidation(errors);
  return input;
};

const createKnowledgeBase = (payload) => {
  const input = validateKnowledgeBase(payload);
  return prisma.knowledgeBase.create({
    data: {
      name: input.name,
      description: input.description,
      sourceType: input.sourceType,
      status: input.status,
      roles: { connect: input.roleIds.map((id) => ({ id })) },
    },
    include: { roles: true },
  });
};

const updateKnowledgeBase = (id, payload) => {
  assertId(id);
  const input = validateKnowledgeBase(payload);
  return prisma.knowledgeBase.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      sourceType: input.sourceType,
      status: input.status,
      roles: { set: input.roleIds.map((roleId) => ({ id: roleId })) },
    },
    include: { roles: true },
  });
};

const deleteKnowledgeBase = (id) => {
  assertId(id);
  return knowledgeBaseService.deleteKnowledgeBase(id);
};

const listRoles = () =>
  prisma.role.findMany({
    orderBy: { name: "asc" },
    include: {
      permissions: { orderBy: { key: "asc" } },
      knowledgeBases: { orderBy: { name: "asc" } },
      users: { orderBy: { createdAt: "desc" } },
    },
  });

const validateRole = (payload) => {
  const input = {
    name: pickString(payload.name).toLowerCase(),
    description: pickString(payload.description),
  };
  const errors = {};
  const roleError = validateRoleName(input.name);

  if (roleError) errors.name = roleError;
  if (input.description.length > 160) {
    errors.description = "Description must be 160 characters or less.";
  }

  if (Object.keys(errors).length) failValidation(errors);
  return input;
};

const createRole = (payload) =>
  prisma.role.create({
    data: validateRole(payload),
    include: { permissions: true, knowledgeBases: true, users: true },
  });

const updateRole = (id, payload) => {
  assertId(id);
  return prisma.role.update({
    where: { id },
    data: validateRole(payload),
    include: { permissions: true, knowledgeBases: true, users: true },
  });
};

const deleteRole = (id) => {
  assertId(id);
  return prisma.role.delete({ where: { id } });
};

const listPermissions = () =>
  prisma.permission.findMany({ orderBy: { key: "asc" } });

const validatePermission = (payload) => {
  const input = {
    key: pickString(payload.key).toLowerCase(),
    name: pickString(payload.name),
    description: pickString(payload.description),
  };
  const errors = {};

  if (!input.key) errors.key = "Permission key is required.";
  if (input.key && !/^[a-z0-9_.:-]+$/.test(input.key)) {
    errors.key = "Permission key can use lowercase letters, numbers, dots, colons, underscores, and hyphens.";
  }
  if (!input.name) errors.name = "Permission name is required.";
  if (input.name.length > 64) errors.name = "Permission name must be 64 characters or less.";
  if (input.description.length > 180) {
    errors.description = "Description must be 180 characters or less.";
  }

  if (Object.keys(errors).length) failValidation(errors);
  return input;
};

const createPermission = (payload) =>
  prisma.permission.create({ data: validatePermission(payload) });

const updatePermission = (id, payload) => {
  assertId(id);
  return prisma.permission.update({
    where: { id },
    data: validatePermission(payload),
  });
};

const deletePermission = (id) => {
  assertId(id);
  return prisma.permission.delete({ where: { id } });
};

const asIdList = (value, field) => {
  if (!Array.isArray(value)) {
    failValidation({ [field]: `${field} must be an array.` });
  }

  return value.filter((id) => typeof id === "string" && id.trim()).map((id) => id.trim());
};

const updateRoleAssignments = async (id, payload) => {
  assertId(id);
  const permissionIds = asIdList(payload.permissionIds || [], "permissionIds");
  const knowledgeBaseIds = asIdList(payload.knowledgeBaseIds || [], "knowledgeBaseIds");
  const userIds = asIdList(payload.userIds || [], "userIds");

  return prisma.role.update({
    where: { id },
    data: {
      permissions: { set: permissionIds.map((permissionId) => ({ id: permissionId })) },
      knowledgeBases: {
        set: knowledgeBaseIds.map((knowledgeBaseId) => ({ id: knowledgeBaseId })),
      },
      users: { set: userIds.map((userId) => ({ id: userId })) },
    },
    include: {
      permissions: { orderBy: { key: "asc" } },
      knowledgeBases: { orderBy: { name: "asc" } },
      users: { orderBy: { createdAt: "desc" } },
    },
  });
};

const listAvatars = () =>
  prisma.aIAvatar.findMany({
    orderBy: { updatedAt: "desc" },
    include: { knowledgeBase: true },
  });

const validateAvatar = (payload) => {
  const temperatureValue =
    typeof payload.temperature === "number"
      ? payload.temperature
      : Number(payload.temperature);
  const input = {
    name: pickString(payload.name),
    description: pickString(payload.description),
    voice: pickString(payload.voice),
    model: pickString(payload.model),
    knowledgeBaseId: pickString(payload.knowledgeBaseId),
    greeting: pickString(payload.greeting),
    prompt: pickString(payload.prompt),
    temperature: Number.isFinite(temperatureValue) ? temperatureValue : 0.7,
    imageUrl: pickString(payload.imageUrl),
    isActive: typeof payload.isActive === "boolean" ? payload.isActive : true,
  };
  const errors = {};

  if (!input.name) errors.name = "Avatar name is required.";
  if (input.name.length > 64) errors.name = "Avatar name must be 64 characters or less.";
  if (!input.voice) errors.voice = "Voice is required.";
  if (!input.model) errors.model = "Model is required.";
  if (!input.prompt) errors.prompt = "Prompt is required.";
  if (input.description.length > 240) errors.description = "Description must be 240 characters or less.";
  if (input.greeting.length > 180) errors.greeting = "Greeting must be 180 characters or less.";
  if (input.prompt.length > 4000) errors.prompt = "Prompt must be 4000 characters or less.";
  if (input.voice.length > 64) errors.voice = "Voice must be 64 characters or less.";
  if (input.model.length > 64) errors.model = "Model must be 64 characters or less.";
  if (input.knowledgeBaseId && input.knowledgeBaseId.length > 0) {
    // validation below keeps the API honest without forcing an avatar to use a knowledge base
  }
  if (input.imageUrl.length > 300) errors.imageUrl = "Image URL must be 300 characters or less.";
  if (!Number.isFinite(input.temperature) || input.temperature < 0 || input.temperature > 2) {
    errors.temperature = "Temperature must be between 0 and 2.";
  }

  if (Object.keys(errors).length) failValidation(errors);
  return input;
};

const includeAvatarRelations = {
  knowledgeBase: true,
};

const createAvatar = async (payload) => {
  const input = validateAvatar(payload);

  if (input.knowledgeBaseId) {
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: input.knowledgeBaseId },
      select: { id: true },
    });

    if (!knowledgeBase) {
      failValidation({ knowledgeBaseId: "Selected knowledge base does not exist." });
    }
  }

  return prisma.aIAvatar.create({
    data: {
      name: input.name,
      description: input.description,
      voice: input.voice,
      model: input.model,
      knowledgeBaseId: input.knowledgeBaseId || null,
      greeting: input.greeting,
      prompt: input.prompt,
      temperature: input.temperature,
      imageUrl: input.imageUrl || null,
      isActive: input.isActive,
    },
    include: includeAvatarRelations,
  });
};

const updateAvatar = async (id, payload) => {
  assertId(id);
  const input = validateAvatar(payload);

  if (input.knowledgeBaseId) {
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: input.knowledgeBaseId },
      select: { id: true },
    });

    if (!knowledgeBase) {
      failValidation({ knowledgeBaseId: "Selected knowledge base does not exist." });
    }
  }

  return prisma.aIAvatar.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      voice: input.voice,
      model: input.model,
      knowledgeBaseId: input.knowledgeBaseId || null,
      greeting: input.greeting,
      prompt: input.prompt,
      temperature: input.temperature,
      imageUrl: input.imageUrl || null,
      isActive: input.isActive,
    },
    include: includeAvatarRelations,
  });
};

const deleteAvatar = (id) => {
  assertId(id);
  return prisma.aIAvatar.delete({ where: { id } });
};

module.exports = {
  dashboard,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listKnowledgeBases,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  updateRoleAssignments,
  listAvatars,
  createAvatar,
  updateAvatar,
  deleteAvatar,
};
