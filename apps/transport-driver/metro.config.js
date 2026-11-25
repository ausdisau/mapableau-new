const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const root = path.resolve(__dirname, "../..");
const config = getDefaultConfig(__dirname);
config.watchFolders = [
  path.join(root, "components/transport/drivers"),
  path.join(root, "lib/transport"),
  path.join(root, "public/driver-routes"),
  path.join(root, "public/brand"),
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [path.join(__dirname, "node_modules")];
module.exports = config;
