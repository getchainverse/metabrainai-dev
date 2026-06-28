const prisma = require("../prisma/client");

const DEFAULT_AVATAR = "avatar-1";
const AVATAR_OPTIONS = {
  hairStyle: ["short", "medium", "long", "curly", "braids", "buzz"],
  eyesStyle: ["default", "round", "sharp", "sleepy", "bright"],
  bodyStyle: ["slim", "athletic", "strong", "compact"],
  clothesStyle: ["casual", "hoodie", "jacket", "suit", "armor", "street"],
  accessoryOptions: ["glasses", "hat", "headphones", "mask", "earrings", "backpack"],
};

const DEFAULT_CUSTOMIZATION = {
  hairStyle: "short",
  hairColor: "#6b4f3b",
  eyesStyle: "default",
  eyesColor: "#2f3a4a",
  bodyStyle: "athletic",
  bodyColor: "#f2d4b0",
  clothesStyle: "casual",
  clothesColor: "#0f7bde",
  accessories: [],
};

const sanitizeProfileInput = (payload) => ({
  username: typeof payload.username === "string" ? payload.username.trim() : "",
  bio: typeof payload.bio === "string" ? payload.bio.trim() : "",
  avatar: typeof payload.avatar === "string" ? payload.avatar.trim() : "",
});

const validateProfileInput = (payload) => {
  const errors = {};
  const input = sanitizeProfileInput(payload);

  if (!input.username) {
    errors.username = "Username is required.";
  } else if (input.username.length < 3) {
    errors.username = "Username must be at least 3 characters.";
  } else if (input.username.length > 32) {
    errors.username = "Username must be 32 characters or less.";
  } else if (!/^[a-zA-Z0-9_.-]+$/.test(input.username)) {
    errors.username = "Username can only contain letters, numbers, dots, underscores, and hyphens.";
  }

  if (input.bio.length > 280) {
    errors.bio = "Bio must be 280 characters or less.";
  }

  if (input.avatar && input.avatar.length > 120) {
    errors.avatar = "Avatar value must be 120 characters or less.";
  }

  return { input, errors };
};

const sanitizeCustomizationInput = (payload = {}) => ({
  hairStyle: typeof payload.hairStyle === "string" ? payload.hairStyle.trim() : "",
  hairColor: typeof payload.hairColor === "string" ? payload.hairColor.trim() : "",
  eyesStyle: typeof payload.eyesStyle === "string" ? payload.eyesStyle.trim() : "",
  eyesColor: typeof payload.eyesColor === "string" ? payload.eyesColor.trim() : "",
  bodyStyle: typeof payload.bodyStyle === "string" ? payload.bodyStyle.trim() : "",
  bodyColor: typeof payload.bodyColor === "string" ? payload.bodyColor.trim() : "",
  clothesStyle: typeof payload.clothesStyle === "string" ? payload.clothesStyle.trim() : "",
  clothesColor: typeof payload.clothesColor === "string" ? payload.clothesColor.trim() : "",
  accessories: Array.isArray(payload.accessories)
    ? payload.accessories
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [],
});

const isHexColor = (value) => /^#([0-9a-fA-F]{3}){1,2}$/.test(value);

const validateCustomizationInput = (payload) => {
  const input = sanitizeCustomizationInput(payload);
  const errors = {};

  if (!AVATAR_OPTIONS.hairStyle.includes(input.hairStyle)) {
    errors.hairStyle = "Select a valid hair style.";
  }
  if (!isHexColor(input.hairColor)) {
    errors.hairColor = "Hair color must be a valid hex color.";
  }
  if (!AVATAR_OPTIONS.eyesStyle.includes(input.eyesStyle)) {
    errors.eyesStyle = "Select a valid eye style.";
  }
  if (!isHexColor(input.eyesColor)) {
    errors.eyesColor = "Eye color must be a valid hex color.";
  }
  if (!AVATAR_OPTIONS.bodyStyle.includes(input.bodyStyle)) {
    errors.bodyStyle = "Select a valid body style.";
  }
  if (!isHexColor(input.bodyColor)) {
    errors.bodyColor = "Body color must be a valid hex color.";
  }
  if (!AVATAR_OPTIONS.clothesStyle.includes(input.clothesStyle)) {
    errors.clothesStyle = "Select a valid clothes style.";
  }
  if (!isHexColor(input.clothesColor)) {
    errors.clothesColor = "Clothes color must be a valid hex color.";
  }
  if (input.accessories.length > 6) {
    errors.accessories = "Select up to 6 accessories.";
  } else if (input.accessories.some((item) => !AVATAR_OPTIONS.accessoryOptions.includes(item))) {
    errors.accessories = "Select valid accessories.";
  }

  return { input, errors };
};

const formatProfile = ({ user, profile }) => ({
  id: profile.id,
  userId: user.id,
  walletAddress: user.walletAddress,
  username: profile.username,
  bio: profile.bio || "",
  avatar: profile.avatar || DEFAULT_AVATAR,
  role: profile.role,
});

const formatCustomization = (customization) => ({
  id: customization.id,
  userId: customization.userId,
  hairStyle: customization.hairStyle,
  hairColor: customization.hairColor,
  eyesStyle: customization.eyesStyle,
  eyesColor: customization.eyesColor,
  bodyStyle: customization.bodyStyle,
  bodyColor: customization.bodyColor,
  clothesStyle: customization.clothesStyle,
  clothesColor: customization.clothesColor,
  accessories: customization.accessories || [],
});

const getOrCreateProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const profile =
    user.profile ||
    (await prisma.profile.create({
      data: {
        userId: user.id,
        username: user.username || `user-${user.walletAddress.slice(2, 8).toLowerCase()}`,
        avatar: user.avatarId || DEFAULT_AVATAR,
        role: user.role || "user",
      },
    }));

  return formatProfile({ user, profile });
};

const updateProfile = async (userId, payload) => {
  const { input, errors } = validateProfileInput(payload);

  if (Object.keys(errors).length > 0) {
    const error = new Error("Profile validation failed.");
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {
      username: input.username,
      bio: input.bio,
      avatar: input.avatar || DEFAULT_AVATAR,
      role: user.role || "user",
    },
    create: {
      userId,
      username: input.username,
      bio: input.bio,
      avatar: input.avatar || DEFAULT_AVATAR,
      role: user.role || "user",
    },
  });

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      username: input.username,
      avatarId: input.avatar || DEFAULT_AVATAR,
    },
  });

  return formatProfile({ user: updatedUser, profile });
};

const getOrCreateCustomization = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { avatarCustomization: true },
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const customization =
    user.avatarCustomization ||
    (await prisma.avatarCustomization.create({
      data: {
        userId: user.id,
        ...DEFAULT_CUSTOMIZATION,
      },
    }));

  return formatCustomization(customization);
};

const updateCustomization = async (userId, payload) => {
  const { input, errors } = validateCustomizationInput(payload);

  if (Object.keys(errors).length > 0) {
    const error = new Error("Avatar customization validation failed.");
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const customization = await prisma.avatarCustomization.upsert({
    where: { userId },
    update: input,
    create: {
      userId,
      ...DEFAULT_CUSTOMIZATION,
      ...input,
    },
  });

  return formatCustomization(customization);
};

module.exports = {
  getOrCreateProfile,
  updateProfile,
  validateProfileInput,
  getOrCreateCustomization,
  updateCustomization,
  validateCustomizationInput,
  AVATAR_OPTIONS,
};
