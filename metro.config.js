const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add .wasm and .tflite to the list of handled asset extensions
config.resolver.assetExts.push('wasm', 'tflite');

module.exports = config;
