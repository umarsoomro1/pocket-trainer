const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const { assetExts } = config.resolver;

// Explicitly ensure 'png', 'jpg', and 'jpeg' are included in assetExts without losing default extensions
['png', 'jpg', 'jpeg'].forEach((ext) => {
  if (!assetExts.includes(ext)) {
    assetExts.push(ext);
  }
});

module.exports = config;
