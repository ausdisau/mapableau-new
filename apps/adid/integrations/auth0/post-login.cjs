// Auth0 Actions → Login / Post Login. Configure these two Action secrets for this tenant.
// ADID_CLIENT_IDS is a comma-separated list of the four downstream Auth0 client IDs.
exports.onExecutePostLogin = async (event, api) => {
  const clients = (event.secrets.ADID_CLIENT_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (!clients.includes(event.client.client_id)) return;
  const connection = event.secrets.ADID_CLERK_CONNECTION;
  if (
    !connection ||
    event.connection.strategy !== "oidc" ||
    event.connection.name !== connection
  ) {
    api.access.deny("Use the AD.iD sign-in connection for this service.");
    return;
  }
  api.idToken.setCustomClaim(
    "https://www.ausdis.com.au/adid/connection",
    connection,
  );
};
