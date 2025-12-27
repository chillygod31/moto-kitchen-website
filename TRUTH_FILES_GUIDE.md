# TRUTH_FILES_GUIDE.md

## What these are
- `PRODUCT_TRUTH.md` = the product contract (what we are building + what "launch ready" means)
- `ENGINEERING_TRUTH.md` = the engineering contract (security, multi-tenancy, payments, test gates)

If a PR, ticket, or Slack message conflicts with these files, **the truth files win**.

## When to update them
Update the truth files **in the same PR** whenever you change:
- tenant resolution rules (hostname/path strategy)
- RLS/RBAC strategy or roles/permissions
- payment flow (Stripe Checkout/Connect/webhooks, refunds)
- public access rules (what is exposed via API vs direct DB access)
- "Launch Ready" requirements / go-live gate criteria

If the change affects product scope, update `PRODUCT_TRUTH.md`.
If it affects security/architecture, update `ENGINEERING_TRUTH.md`.

## How PRs should reference them
For any PR that touches:
- auth / RLS / RBAC
- ordering/checkout
- payments/webhooks
- tenant routing/domains
add a short line in the PR description:

**Truth files:** No change / Updated (link to commit)

Example:
- "Truth files: Updated ENGINEERING_TRUTH.md (payments/webhooks section)"
- "Truth files: No change (UI-only refactor)"

## "Done" definition for high-risk features
A feature is not "done" until:
- it matches the truth files
- it has correct loading/error/empty states
- it passes the relevant test gate (Phase A gate or go-live gate)

## Who can change these
- Product owner (you) can approve scope changes.
- Senior dev can propose changes.
- Any engineer can suggest edits, but changes must be reviewed.

## What to do when something is unclear
If a requirement is unclear, do NOT guess.
Open a ticket to clarify and, if needed, update the truth files first.

