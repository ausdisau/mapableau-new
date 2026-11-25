# AD.iD sign-in and registration

AD.iD gives a person a central place to register, recover their account and choose a service. The MapAble Master Business Plan calls for a single identity with service-specific roles. The Jobs plan puts the participant in control of who may see employment information. This implementation shares identity only. Jobs applications, reader history, wiki permissions and Wix memberships stay with their service.

## Identity flow

1. The person creates or manages an account in the Next.js AD.iD portal with Clerk. Accessible help uses Australian Disability Ltd’s published contact page. The portal can display the directory with no tenant configured.
2. A participating service starts an OIDC authorization-code flow with its own Auth0 client. Auth0 delegates authentication to a **single Clerk OIDC enterprise connection**, then issues the downstream ID token for that service. The portal and each service keep their own first-party session cookies.
3. MapAble identifies returning users by the exact Auth0 issuer and subject and uses its own database role. A new verified subject with a new verified email receives only the default participant account. Existing-email collisions stop. A person with an existing account can use their established sign-in. Any future link must prove control of both accounts and record their choice.
4. AccessiBooks uses its own audience and encrypted server session. Its reader client requests only `openid`. Its saved shelf stays on the reader’s device. Local logout does not guarantee sign-out from all services or the upstream Clerk session.
5. The portal supports registration and sign-in links such as `/sign-up?service=accessibooks`. Four known service IDs map to fixed first-party destinations. AD.iD shows the destination after sign-in and the person chooses whether to continue. Only publish a service-specific entry link when the receiving service is ready.

## Connect an isolated tenant

The supplied Clerk Frontend API origin is `https://clerk.accessibooks.com.au`. The supplied publishable key belongs to this production instance. A Vite app names that public value `VITE_CLERK_PUBLISHABLE_KEY`. Set the same value as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in the portal and set `CLERK_FRONTEND_API_URL` to the origin. Keep the matching `CLERK_SECRET_KEY` in the server-side secret store. A development instance needs its own origin and keys. `https://accessibooks.org/` is the reader service. The downstream `ADID_AUTH0_ISSUER` is the Auth0 broker’s own issuer.

Run `npm run check:issuer` in `apps/adid` with the two public variables set. It checks the key's destination, retrieves public OIDC discovery, and checks the advertised signing keys. It prints the exact issuer for the upstream Auth0 connection. If the domain does not resolve, use the DNS records displayed in the **Domains** section of this Clerk production instance and verify the domain there. A successful public check still requires a separate end-to-end test with the confidential clients.

| Owner | Configuration |
| --- | --- |
| Clerk | Select the development instance used by the portal. Configure its sign-in, sign-up and account URLs. Register Auth0 as a confidential OAuth application. Grant the required `openid`, `profile`, and `email` scopes for the broker. Register exactly the upstream callback URL shown by Auth0. Keep separate development and production clients. Confirm the instance’s signup mode and accessible recovery options. |
| Auth0 | Create an enterprise **OpenID Connect** connection to Clerk with discovery and **Back Channel**. Enter the Clerk application's ID and secret in Auth0. Use the discovery URL and exact issuer from the Clerk instance. Enable only this connection on each dedicated service application. Use authorization code, RS256 and exact allowed callback/logout URLs. |
| Auth0 Action | Install `integrations/auth0/post-login.cjs` on the Login flow. Set Action secrets `ADID_CLIENT_IDS` to the comma-separated downstream client IDs and `ADID_CLERK_CONNECTION` to the exact connection name. The Action checks the connection and emits the signed `https://www.ausdis.com.au/adid/connection` claim. Missing or mismatched claims prevent MapAble and AccessiBooks sessions. Confirm `email_verified` arrives from Clerk for new MapAble accounts. |
| AD.iD Next.js | Use a dedicated origin for the portal and the matching Clerk publishable and server secret keys. Keep server credentials in the deployment secret store. The US East identity project supplies only the optional service directory. |
| MapAble Next.js | Set `ADID_AUTH0_ENABLED=true`, `ADID_AUTH0_ISSUER` (e.g. `https://broker.example/`), `ADID_AUTH0_CLIENT_ID`, `ADID_AUTH0_CLIENT_SECRET` and `ADID_AUTH0_CONNECTION` on the service. Supply its normal NextAuth session secret and reviewed database connection. Retain the ordinary service sign-in throughout rollout. |
| AccessiBooks Next.js | Configure its dedicated Auth0 client and cookie-encryption secret per the catalogue integration README. Use a unique origin and key for each environment. |

The broker is the sole issuer accepted for this downstream path. A service’s client secret belongs only to that service. Use separate clients for MapAble, AccessiBooks, Wix and MediaWiki. A token for one service cannot be presented as a session for another. Disable any Auth0 automatic account-linking Action for these clients. Check the region and processing terms of the Clerk and Auth0 tenants independently of the Neon database region.

## Service owners

| Service | Entry and callback | Activation |
| --- | --- | --- |
| MapAble | Existing `/login` and `/register` offer AD.iD. Downstream callback `/api/auth/callback/adid`. | Set the dedicated client configuration and apply the additive bridge migration to the intended MapAble staging database. Register the exact HTTPS staging origin plus callback in Auth0. NextAuth verifies the code, ID token, state, PKCE and nonce. |
| AccessiBooks | `https://accessibooks.org/account` is the proposed catalogue account screen. Its callback is `/auth/callback`. | The companion change targets the Next.js catalogue development branch. Confirm which deployment serves the .org domain before enabling it. Register the exact origin in Auth0 for callback and logout. Browsing and offline reading remain available. |
| Australian Disability Ltd | `https://www.ausdis.com.au/` uses Wix. | For an eligible Wix Studio Enterprise or Wix Channels site, use **Site Member Settings → SSO**. Register the **Web Logins URL generated by Wix**, then enter the Auth0 discovery configuration for a dedicated Wix client. Test a new member and an existing member independently. Leave mandatory SSO off during the pilot. Other Wix plans can link to the portal while Wix keeps its Members login. |
| Australian Disapedia | `https://disapedia.au/index.php/Main_Page` is MediaWiki. | On a staging wiki install matching branches of PluggableAuth and OpenIDConnect and apply their normal database updates. Include `integrations/mediawiki/LocalSettings.adid.php` from the private LocalSettings file. Register the exact URL MediaWiki generates for `Special:PluggableAuthLogin`. Supply the wiki-specific ID/secret and enable only the Clerk-backed connection for this client in Auth0. Keep an independently tested local admin sign-in and wiki group assignments. |

## Neon and rollback

The connected AD.iD project is in AWS US East (Ohio). Inspection of its service-directory column definitions confirmed the portal's optional read-only query. The connected Sydney project named **MabAble** and the AccessiBooks project are separate. The default MabAble database lacked the quoted Prisma bridge table names in the metadata inspected. The production Vercel connection was not inferred from that project name. No member, participant or authentication records were queried or changed.

The MapAble migration adds the two bridge tables from its existing Prisma model, with a unique issuer/subject index. Review the actual staging schema for drift, duplicates and backups. Use the direct database connection for migrations and the pooled connection for runtime. New local accounts, personal profile rows, the subject binding and the audit event commit together. A repeated callback cannot acquire a different user's account.

Turn off the individual service flag or connection to stop new federated logins. Retain the bridge records and established sign-in routes. Disabling a new login path does not revoke existing local cookies. If immediate logout is required, revoke the affected sessions at the issuer and in each relying service according to its own session policy.

## Acceptance in staging

With synthetic accounts, complete registration and repeat sign-in across two origins, denial/cancellation, recovery and logout. Check an existing-email collision, a changed upstream email, a distinct issuer, an incorrect client and an unavailable dependency. Confirm that a participant cannot acquire employer, delegate, editor or administrator permissions through their identity claims. Try keyboard-only, switch scanning, a screen reader, large text and a written support request. Record what each identity provider exposes during recovery. Use participant co-design before promoting the authentication journey.

## References

- [Clerk OAuth applications and OIDC](https://clerk.com/docs/guides/configure/auth-strategies/oauth/single-sign-on)
- [Auth0 enterprise OIDC connection](https://auth0.com/docs/authenticate/identity-providers/enterprise-identity-providers/oidc) and [custom token claims](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)
- [Auth0 Next.js SDK](https://auth0.com/docs/quickstart/webapp/nextjs)
- [Wix site-member SSO](https://support.wix.com/en/article/sso-setting-up-single-sign-on-sso-login-for-your-site-members)
- [MediaWiki OpenID Connect](https://www.mediawiki.org/wiki/Extension:OpenID_Connect)
- [Neon regions](https://neon.com/docs/introduction/regions) and [connection pooling](https://neon.com/docs/connect/connection-pooling)
