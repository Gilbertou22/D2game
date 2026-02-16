// src/utils/levelUtils.js
export const expPerLevel = (level) => Math.floor(100 * Math.pow(1.15, level - 1));