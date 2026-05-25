export const peerConfig = {
  peerModuleEnabled: process.env.PEER_MODULE_ENABLED !== "false",
};

export function assertPeerModuleEnabled() {
  if (!peerConfig.peerModuleEnabled) {
    throw new PeerModuleDisabledError();
  }
}

export class PeerModuleDisabledError extends Error {
  constructor() {
    super("PEER_MODULE_DISABLED");
    this.name = "PeerModuleDisabledError";
  }
}
