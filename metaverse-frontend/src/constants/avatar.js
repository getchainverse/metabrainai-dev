/** @typedef {Object} AvatarCustomization
 * @property {string} hairStyle
 * @property {string} hairColor
 * @property {string} eyesStyle
 * @property {string} eyesColor
 * @property {string} bodyStyle
 * @property {string} bodyColor
 * @property {string} clothesStyle
 * @property {string} clothesColor
 * @property {string[]} accessories
 */

/** @type {AvatarCustomization} */
export const DEFAULT_AVATAR_CUSTOMIZATION = {
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

export const mergeCustomization = (partial = {}) => ({
  ...DEFAULT_AVATAR_CUSTOMIZATION,
  ...partial,
});
