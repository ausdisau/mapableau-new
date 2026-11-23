const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const contracts = path.resolve(__dirname, "../../mobile-contracts/search");
config.watchFolders = [...new Set([...(config.watchFolders || []), contracts])];
const previous = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, name, platform) => {
  // Resolve React and Metro’s Babel helpers from the handset's independent install.
  if (
    (name === "react" || name.startsWith("@babel/runtime/")) &&
    context.originModulePath.startsWith(contracts + path.sep)
  ) {
    return context.resolveRequest(
      { ...context, originModulePath: __filename },
      name,
      platform,
    );
  }
  return previous
    ? previous(context, name, platform)
    : context.resolveRequest(context, name, platform);
};
module.exports = config;
