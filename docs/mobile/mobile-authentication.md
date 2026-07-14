# Mobile authentication

```mermaid
sequenceDiagram
  participant App
  participant IdP as MapAble OIDC/Auth0
  participant API as Mobile BFF
  App->>App: Generate PKCE verifier/challenge
  App->>IdP: Authorize (public client)
  IdP->>App: Redirect with code (deep link)
  App->>IdP: Token exchange (no client secret)
  App->>App: Store tokens in SecureStore
  App->>API: Bearer access token + participant headers
```

Authority kinds are distinct: authenticated identity, organisation membership, application permission, participant authority, financial authority, clinical authority.

Organisation membership does not imply participant authority.
