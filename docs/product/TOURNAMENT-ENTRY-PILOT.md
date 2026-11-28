# WPU tournament entry pilot

The pilot lets organisers open registration on published standard open-entry singles and doubles divisions. It does not publish a draw, open any existing event, charge anyone on deployment, or change WPU rankings. Team rosters, ranked-cutoff enforcement, split payments and organiser payouts are outside this pilot.

## Organiser flow

In Event Studio, publish the division, then open **Competition → Tournament registration**. Choose the division, closing time, contact email and cancellation terms. Free entries work without a payment account. Publish the contact address only if it is intended for public event enquiries.

Opening registration fixes the published division, date, venue, timezone and the fee and terms. New entries can be paused without removing existing entries. If nobody has entered, a paused registration can be reset. Organisers can view names and entry statuses. No birth dates, private account emails or payment credentials appear on the entry list.

## Player flow

Use the WPU Passport and give a date of birth once. A singles entry takes one place. A doubles entry takes one pair place. The lead player shares a private link and the partner accepts with their own Passport. If there is room, an invite holds a place for 20 minutes. An invite can still be accepted when the draw is full, in which case the pair is waitlisted. No one is asked to pay until both players have accepted and the pair has a place.

Ready entries and waitlist offers have a 20-minute claim window. An available place goes to the oldest accepted waitlist entry, and the player can find it on the status page. Offers are processed as registration pages are checked. This pilot does not email waitlist offers. Free entries can be withdrawn in the player view. The organiser handles paid changes and refunds under the published terms.

## Enable hosted checkout

Only the configured pilot organisation can open paid entries. Set the following in the Worker’s runtime environment, using secret bindings for the API key and endpoint signing secret. Do not put values in Git or chat.

- `WPU_CHECKOUT_HOST_ORGANISATION` is the verified organiser ID for the Stripe merchant operating the pilot. It is checked against the event.
- `WPU_CHECKOUT_MODE` is `test` for an isolated HTTPS test host or `live` for real charges. Test mode cannot run on the production WPU hostname.
- `WPU_CHECKOUT_ORIGIN` is the exact HTTPS origin for Checkout returns. It defaults to `https://worldpickleball.world` for live mode.
- `WPU_STRIPE_SECRET_KEY` is the key for the corresponding Stripe account and mode. Prefer a restricted key with access to create and retrieve Checkout Sessions.
- `WPU_STRIPE_WEBHOOK_SECRET` is the signing secret for that account’s endpoint at `/api/events/stripe` on the same host. Subscribe to `checkout.session.completed` and `checkout.session.expired`.

Before opening paid events, verify an isolated test flow including one completed and one expired Checkout, signature checks, the payer receipt settings, and both partners seeing the same state. The card checkout supports SGD and USD. The fee is the total per player or pair, and WPU does not store card details. Where a Stripe account converts into another settlement currency, verify the applicable minimum before opening paid events.

Both partners can start payment, but only one payer can acquire the checkout. The return URL doesn’t mark the entry paid. Confirm only after obtaining a matching paid Checkout Session from Stripe. The receipt email belongs to the payer.

If the payment provider is unavailable after an attempt starts, keep the reserved place until the provider confirms payment or expiry. To investigate an indeterminate attempt, use the Stripe Dashboard entry reference and the organiser’s roster. Do not release the place or ask the player to pay elsewhere while a charge is unresolved. This pilot does not move money between organisations or automatically process refunds.

Provider references: https://docs.stripe.com/checkout/fulfillment and https://docs.stripe.com/receipts.
