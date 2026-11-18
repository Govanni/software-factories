# Novu (EU region) as the Notification Provider

Cadence uses hosted Novu, in its EU region, as the Notification Provider for in-app Notifications. Both Novu and Knock met the hard constraints: a free tier without a credit card, and a React SDK. Knock has the more polished React SDK, but Novu won on the EU-residency tiebreaker. It is the only candidate with an EU region on its free tier, while Knock's EU region was promised for the end of 2026 and still hadn't been announced in November 2026. Novu also ships a build that is safe to import during server-side rendering (SSR), and its Inbox's `routerPush` prop works with React Router.

## Considered Options

- **Knock** is the fallback. Switch to it if Novu's free tier stops working for Cadence (the 5-workflow limit pinches, or a credit card becomes required), or if Novu's Inbox can't be made to fit Cadence's UI.
- **MagicBell, Courier, SuprSend** were ruled out. MagicBell has 1k deliveries a month and no EU region. Courier requires a paid plan for EU, and its free Inbox is unconfirmed. SuprSend's free Inbox carries its branding, and its EU option may be Enterprise-only.
- **Self-hosting Novu** was ruled out because it adds infrastructure to local dev and CI.

## Consequences

- Every environment, local dev included, points at `eu.api.novu.co` and `wss://eu.socket.novu.co`. Novu regions are separate deployments, so moving regions later means setting up the project again.
- The free tier allows 5 workflows and has no overage. The 4 v1 Triggers fit, but more Notification types will need Pro or shared workflows.
- Novu calls a Recipient a "subscriber". The code uses Cadence's user id as the `subscriberId`.

Comparison: https://github.com/Govanni/software-factories/blob/research/notification-providers/docs/research/notification-providers.md
