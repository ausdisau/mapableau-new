const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const root = path.resolve(__dirname, "../..");
const config = getDefaultConfig(__dirname);
// Expo inlines this URL into the bundle. A build for a different host needs a new transform.
config.cacheVersion +=
  ":" + (process.env.EXPO_PUBLIC_MAPABLE_PRACTICE_API_ORIGIN?.trim() || "");
config.watchFolders = [
  path.join(root, "components/transport/drivers"),
  path.join(root, "lib/transport"),
  path.join(root, "public/driver-routes"),
  path.join(root, "public/brand"),
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [path.join(__dirname, "node_modules")];
module.exports = config;
