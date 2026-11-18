# Notification Providers for Cadence: comparison

Research for [issue #2](https://github.com/Govanni/software-factories/issues/2). Researched 2026-11-18 against vendor pricing pages, official docs, and the published npm packages. This document compares the candidates and does not pick one; the choice is a separate ticket.

**Scope.** Cadence fires **Triggers** only. The **Notification Provider** owns everything after that: feed storage, read/seen state, realtime delivery, and the **Inbox** UI shown to each **Recipient**.

**Hard constraints.** A free tier usable in local dev without a credit card, and a React SDK.
**Nice-to-have.** EU data residency, and a path to adding email later.

## Summary table

| | Knock | Novu | MagicBell | Courier | SuprSend |
|---|---|---|---|---|---|
| Free tier | 10k messages/mo | 10k workflow runs/mo, max 5 workflows | 1k deliveries/mo, 1 project | 10k sends/mo | 10k notifications/mo |
| No credit card needed | Yes (stated) | Yes (stated) | Unverified (third-party sites say yes) | Likely (card only mentioned for upgrading) | Yes (stated) |
| Billing unit | message = 1 user x 1 channel | workflow run | delivery = 1 user x 1 channel | send = 1 template x 1 recipient, all channels count once | notification |
| Over the free limit | Not hard-capped; Knock contacts you | No overage on Free | Billed per delivery | n/a: moving to Business bills every send | Keeps processing; SuprSend contacts you |
| First paid tier | Starter $250/mo | Pro from $30/mo | Startup $249/mo | Business $0.005/send, no minimum | Essentials $100/mo |
| React Inbox component | `@knocklabs/react` | `@novu/react` `<Inbox/>` | `@magicbell/react` | `@trycourier/courier-react` | `@suprsend/react` |
| Headless option | Hooks + `@knocklabs/client` | `@novu/react/hooks` + `@novu/js` | `@magicbell/react-headless` (separate package) | `useCourier()` + `@trycourier/courier-js` | Headless hooks in `@suprsend/react` |
| SSR story | Not documented; mount client-only | Ships a server stub via export conditions | Not documented | Docs say "client-only" | Not documented |
| Recipient auth | RS256 JWT (`signUserToken`); "enhanced security mode" is off by default | HMAC-SHA256 `subscriberHash`; off by default | HS256 User JWT (always required) | JWT from `POST /auth/issue-token` (always required) | ES256 JWT (always required) |
| Node SDK | `@knocklabs/node` | `@novu/api` | `magicbell-js` (`project-client`) | `@trycourier/courier` | `@suprsend/node-sdk` |
| EU region | **No.** Planned "by end of 2026" | **Yes, on Free** | **None found** | Yes, but by arrangement on a paid plan | Docs say "EU options"; pricing lists custom region as Enterprise only |
| Email later | Yes | Yes (all channels on Free) | Yes | Yes | Yes |

## Per-candidate findings

### Knock

- **Pricing.** The Free plan costs $0 and includes 10,000 messages/month. One message is "one user on one channel". The pricing page says "no credit card required". Messages are not hard-capped: if you go over, Knock contacts you about billing. Stored profiles are free. Starter costs $250/mo and includes 50k messages, then $0.005 per message. Source: https://knock.app/pricing
- **React.**
  - `@knocklabs/react` (v0.15.1 on npm) provides `NotificationFeedPopover`, `NotificationFeed` and `NotificationIconButton`. Source: https://docs.knock.app/in-app-ui/react/overview
  - For a headless Inbox, it provides `useNotifications` and `useNotificationStore` hooks, plus the `@knocklabs/client` package. Source: https://docs.knock.app/in-app-ui/react/headless/feed
  - The package declares optional peer dependencies on `next` and `@tanstack/react-router`, and has `./next` and `./tanstack` subpath exports. There is no React Router adapter. Source: package.json in https://github.com/knocklabs/javascript/blob/main/packages/react/package.json
- **SSR.**
  - Knock's docs have no SSR guidance for React Router.
  - The package does not resolve to a separate server build. So whether it is safe to import during SSR is **unverified**; assume the feed should be mounted client-only.
- **Recipient auth.**
  - Your server signs a JWT with RS256 using a private signing key. It carries `sub` = the user id and defaults to a 3600s expiry. The Node helper is `signUserToken` from `@knocklabs/node`, and the token is passed to `KnockProvider` as `userToken`. Source: https://docs.knock.app/in-app-ui/security-and-authentication
  - **Enhanced security mode is off by default.** Without it, the public key alone can read any user's feed. The docs say production must enable it.
  - Users are identified (created) on the server, or inline when a workflow is triggered.
- **Node SDK.** `@knocklabs/node` (v1.41.1); you call `workflows.trigger`.
- **Email.** Supported as a channel through provider integrations. Unlimited channels are included on Free.
- **EU.** **Not available today.** The plans doc says: "We expect to support EU data residency by the end of 2026" (https://docs.knock.app/manage-your-account/knock-plans). Every subprocessor is listed as USA (https://knock.app/legal/subprocessors). The privacy policy relies on SCCs and the EU-US Data Privacy Framework.

### Novu

- **Pricing.** Free costs $0 and includes 10,000 workflow runs/month, all channels, **up to 5 workflows**, 2 environments and 3 team members. The page says "No credit card required". There is **no overage on Free**. Pro starts at $30/mo with 30k runs, then $1.20 per 1k runs. Source: https://novu.co/pricing
- **React.**
  - `@novu/react` (v3.20.0) provides `<Inbox applicationIdentifier subscriberId .../>`. The `routerPush` prop wires notification clicks to the router; the docs show it used with React Router's `useNavigate`. Sources: https://docs.novu.co/platform/quickstart/react and https://docs.novu.co/platform/inbox/advanced-customization/notification-click-behavior
  - For a headless Inbox there are two options. The `@novu/react/hooks` subpath provides `useNotifications`, `useCounts` and `NovuProvider` (https://docs.novu.co/platform/sdks/react/hooks/use-notifications). The framework-agnostic `@novu/js` keeps its own WebSocket connection (https://docs.novu.co/platform/sdks/javascript).
- **SSR.**
  - Verified from the published package: `exports["."]` resolves non-`browser` imports to `dist/esm/server/index.js`. In that build, `Inbox` renders an empty placeholder (`ShadowRootDetector`), `NovuProvider` renders only its children, and the hooks return empty loading state.
  - So the component is SSR-safe by design and hydrates on the client. The docs say nothing about SSR. With React Router SSR, Vite should pick the server build for SSR and the browser build for the client; this is **not tested here**.
- **Recipient auth.**
  - When HMAC is enabled on the In-App integration, the server computes `subscriberHash` = HMAC-SHA256(subscriberId, secret key), hex-encoded. It is **off unless you toggle it on**. Source: https://docs.novu.co/platform/inbox/prepare-for-production
  - A subscriber is auto-created when the Inbox sees an unknown `subscriberId`. Triggers can also carry subscriber fields inline in `to`.
- **Node SDK.** `@novu/api` (v3.20.0), using `novu.trigger({ workflowId, to, payload })`. For EU, set `serverURL: "https://eu.api.novu.co"`. Source: https://docs.novu.co/platform/sdks/server/typescript
- **Email.** All channels are included on Free.
- **EU.** **Available on the Free tier** (the pricing page lists "US and EU data residency"). The client must be pointed at the EU endpoints: `apiUrl: https://eu.api.novu.co` and `socketUrl: wss://eu.socket.novu.co`.
- **Other.**
  - The pricing page lists self-hosting as Enterprise only. A "Community self-hosted edition" also exists, but its feature gaps are not itemized (https://docs.novu.co/community/self-hosting-novu/overview).
  - The 5-workflow cap on Free is worth noting if Cadence ends up with many Notification types.

### MagicBell

- **Pricing.**
  - Builder costs $0 and includes **1,000 deliveries/month** and 1 project. A delivery is one user on one channel, so in-app plus email counts twice. Startup costs $249/mo with 50k deliveries. Source: https://www.magicbell.com/pricing
  - Whether a credit card is needed is **not stated on MagicBell's site**. Only third-party aggregators say no card is needed (unverified).
- **React.**
  - `@magicbell/react` (v1.14.0) provides `ContextProvider token={userJwt}`, `Inbox` and `FloatingInbox`. Source: https://www.magicbell.com/docs/libraries/magicbell-react
  - Headless hooks live in a separate package, `@magicbell/react-headless` (v5.5.1). The current docs don't link it, so it is **unclear whether it is the supported path**.
- **SSR.** Not documented.
- **Recipient auth.** A User JWT signed HS256 with the project secret key. It carries `user_email` and/or `user_external_id` plus `api_key`. Source: https://www.magicbell.com/docs/api/authentication/user
- **Node SDK.** `magicbell-js`, using `Client` from `magicbell-js/project-client` and `client.broadcasts.createBroadcast({ title, content, recipients })`. The docs show no single-notification call; everything is a broadcast. Source: https://www.magicbell.com/docs/libraries/magicbell-js
- **Email.** Email channel providers are supported (SES, Mailgun, and others).
- **EU.** **No EU region found** in the docs, pricing, security page or privacy policy.
- **Assessment.** It is the weakest on the constraints. Its free volume is 10x lower than the others, its credit-card policy is unverified, and it has no EU option. It is not strictly ruled out.

### Courier

- **Pricing.**
  - The Developer plan is free with 10,000 sends/month. A send is one template to one recipient, and **multi-channel counts once**. Test-environment sends count too.
  - Business costs $0.005 per send for **every** send, including the first 10k. So upgrading means 50k sends = $250.
  - On the credit card, the page only says "Add a credit card to move to Courier's Business plan". So no card is required for Developer, though this is inferred rather than stated outright. Source: https://www.courier.com/pricing
  - The pricing page does not list Inbox among the Developer features. A recent Courier blog post says the free plan includes the Inbox (https://www.courier.com/blog/best-in-app-notification-centers). Treat this as **likely, but confirm**.
- **React.**
  - `@trycourier/courier-react` (v9.3.5, needs React >= 18) provides `CourierInbox`, `CourierInboxPopupMenu`, `CourierToast` and `CourierPreferences`.
  - For a headless Inbox it provides `useCourier()`, which returns `inbox` and `inbox.listenForUpdates()`.
  - Under the hood it wraps `@trycourier/courier-ui-inbox` (web-component based UI).
  - Source: https://www.courier.com/docs/sdk-libraries/courier-react-web
- **SSR.** The docs state that Inbox/Toast "render only on the client" and need `'use client'` in Next.js. Under React Router you would mount it client-only.
- **Recipient auth.**
  - Your server calls `POST /auth/issue-token` (Node: `client.auth.issueToken({ scope, expires_in })`). The scope looks like `user_id:<id> inbox:read:messages inbox:write:events`.
  - **If you omit `expires_in`, the token never expires.** The SDK does not refresh tokens.
  - Users do not need to exist in Courier beforehand.
  - Source: https://www.courier.com/docs/platform/inbox/authentication
- **Node SDK.** `@trycourier/courier` (v10.0.1).
- **Email.** It is a core channel; Courier routes to email providers.
- **EU.**
  - An EU datacenter exists: eu-west-1 (Ireland), `api.eu.courier.com`.
  - It is "provisioned by arrangement", and new workspaces can't be created there (https://www.courier.com/docs/platform/workspaces/eu-datacenter).
  - Courier's own pages disagree on plan eligibility. One says Business+ (https://www.courier.com/solutions/healthcare); another says Enterprise (https://www.courier.com/blog/eu-data-residency-notifications).
  - Either way, **EU is not on the free tier**.

### SuprSend

- **Pricing.**
  - Free costs $0 and includes 10,000 notifications/month. The page says "No Credit Card required". Processing continues over the limit and SuprSend contacts you. Essentials costs $100/mo with 50k notifications. Source: https://www.suprsend.com/pricing
  - **The free Inbox carries SuprSend branding.** Removing it needs Essentials or higher.
- **React.**
  - Use `@suprsend/react` (v1.6.0), which provides `SuprSendProvider` and `Inbox`, plus headless hooks. The old `@suprsend/react-inbox` is **deprecated on npm** ("Package no longer supported").
  - The `Inbox` takes a `host` prop with `{ socketHost, apiHost }`.
  - Sources: https://docs.suprsend.com/docs/inbox-react and https://docs.suprsend.com/docs/react-in-app-feed
- **SSR.** Not documented.
- **Recipient auth.**
  - An ES256 JWT signed with a dashboard-generated signing key. Claims: `entity_type: "subscriber"`, `entity_id: <distinct_id>`, `exp`, and an optional tenant `scope`.
  - There is no SDK helper; the docs use `jsonwebtoken`.
  - Source: https://docs.suprsend.com/docs/client-authentication
- **Node SDK.** `@suprsend/node-sdk` (v1.15.1), using `workflows.trigger(new WorkflowTriggerRequest({ workflow, recipients, data }))`. Recipients can be defined inline, with no need to create them first, up to 100 per trigger (npm README).
- **Email.** Supported (multiple email vendors).
- **EU.** **Conflicting.** The security doc says "We support EU-data residency options" (https://docs.suprsend.com/docs/security). The pricing table marks "Custom Data Center Region" as **Enterprise only**. It is unverified whether a Free workspace can be EU-hosted.

## What rules a candidate out

None of the five fails the hard constraints outright, as far as could be verified. All five have a $0 tier and a React SDK. The softer disqualifiers:

- **MagicBell.** Only 1k deliveries/month, and the no-credit-card claim is not stated by MagicBell. No EU region. Headless-hook support is unclear.
- **Knock.** No EU residency today; it is promised by end of 2026, and that date has not passed yet but there is no announcement. Fine if EU is truly only nice-to-have.
- **Courier.** EU needs a paid plan and an arrangement with Courier. Free-tier Inbox inclusion is only confirmed by a blog post. Tokens are non-expiring by default, which is a footgun.
- **SuprSend.** The free Inbox is branded, and EU residency on non-Enterprise plans is unclear.
- **Novu.** The 5-workflow cap and no overage on Free could pinch in dev if Cadence models many Notification types.

## Strongest against the constraints (not a decision)

- **Novu** clears both hard constraints. It is the only one with **EU residency on the free tier**, and the only one whose React package ships an explicit SSR server build.
- **Knock** has the most polished React SDK and documentation, and clear usage-based free limits. Its weak point is the EU gap.
- **Courier** and **SuprSend** are viable but give up something: EU on a paid plan, or Inbox branding.

## Common to all

- No vendor documents React Router v7 framework-mode SSR specifically. Plan to render the Inbox client-only, for example with a lazy-loaded component or a mounted-flag guard, unless the vendor ships a server build (Novu).
- Every vendor's Recipient auth is a server-minted secret-derived token: a JWT or an HMAC. Cadence's dev setup uses a DevUI user switcher, so a loader or resource route must mint the token for the current session user. The Recipient id should be Cadence's stable user id.

## Uncertain / not verified

- MagicBell's credit-card policy (secondary sources only).
- Whether Courier's free Developer plan includes Inbox (stated in a blog post; the pricing page is silent).
- Whether SuprSend's EU region is available below Enterprise.
- Whether Knock's EU region ships by end of 2026.
- Whether Knock, MagicBell or SuprSend React packages can be imported during SSR without touching `window`. Not tested.
- Novu's server stub under Vite and React Router SSR. Inferred from package `exports`, not run.
