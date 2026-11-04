# Moto Kitchen project map

Reviewed locally on **2026-10-23**, website commit **8393f53** (2026-10-03).
This map records source inspection and local checks, not a production audit.
No live database, customer records, payment service, email service, calendar,
or deployed website was accessed during onboarding. Environment values were not read.
Paths below are relative to `moto-kitchen-website/` unless stated otherwise.

## Workspace and active implementation

The user wants ongoing development confined to `/Users/chilech/Desktop/moto kitchen `.
The workspace folder name includes a trailing space.

| Workspace folder | What is here | Relationship to main website |
| --- | --- | --- |
| `moto-kitchen-website/` | Next.js public site and business administration | Primary application; recent development through October 2026 |
| `moto-kitchen-invoices/` | Standalone HTML/CSS/JS invoice tool | Older separate copy; single initial Git commit on 2025-12-18 |
| `moto-kitchen-orders/` | Next.js 14 multi-tenant ordering project | Earlier separate implementation; website's `MERGE_COMPLETE.md` records ordering integration |
| `moto-kitchen-delivery/` | Next.js 14 ordering/delivery project | Separate implementation; README describes pay-later v1 |
| `moto-kitchen-christmas-orders/` | Static HTML/CSS/JS project | Separate seasonal ordering tool; not deeply reviewed |

Website and standalone invoices have separate Git repositories, both on `main`.
The other three folders had no local `.git` directory/file. No remote fetch was run.
Before onboarding, the website had untracked `supabase/.gitignore` and
`supabase/config.toml`; preserve these existing files. The invoice repository was clean.

## Business and stack

Moto Kitchen markets Tanzanian catering in the Netherlands: weddings, corporate
events, private events, and pickup/delivery. Catering enquiries are a primary
website journey. An online ordering system also exists inside the same application.

`package.json` declares Next.js **16.0.10**, React **19.2.1**, TypeScript,
Tailwind CSS 4, Supabase, Stripe, Resend, Google APIs, Luxon, and Zod.
The user confirmed Vercel hosts website deployments and Supabase hosts the database
on 2026-10-23, and authorized access to those Moto Kitchen service projects for future
development. No direct Vercel or Supabase connector tools were available when checked;
CLI/API authentication and project links have not yet been verified.
The canonical site URL in source is `https://motokitchen.nl`.
Local source alone does not establish the currently deployed commit or configuration.
Sanity code and dependencies remain, but `app/studio/[[...tool]]/page.tsx` disables Studio.

## Feature and data map

| Area | Entry points | Data / implementation |
| --- | --- | --- |
| Public website | `app/page.tsx`, `app/services/`, `app/about/`, `app/gallery/`, `app/reviews/`, `app/faq/` | React pages/components; static assets and local content |
| Marketing menu and service pricing | `app/menu/page.tsx`, `lib/menu-data.ts`, `lib/pricing-data.ts` | Local source data; separate from online-order prices |
| Catering intake | `app/contact/page.tsx`, `app/api/contact/route.ts` | Supabase `quote_requests`; Resend admin notification and customer reply |
| Catering lead management | `app/admin/quotes/page.tsx`, `app/api/quotes/` | Filters, search, notes, statuses, CSV export, manual PDF attachments |
| Generated invoices and quotes | `app/admin/invoice/page.tsx`, `public/invoice-generator/` | Embedded static generator; browser PDFs, Supabase document history, browser drafts |
| Google Calendar | `app/admin/calendar/page.tsx`, `app/api/admin/calendar/`, `lib/google-calendar.ts` | Calendar API with shared environment credentials; Amsterdam time handling |
| Event Planner | `app/admin/events/page.tsx`, `app/api/admin/events/` | Supabase `events`, `event_prep_items`, `event_item_defaults`; preparation and sales planning |
| Online ordering | `app/order/`, `app/api/menu/`, `app/api/time-slots/`, `app/api/delivery-zones/` | Supabase menu/settings/slots; cart in browser localStorage |
| Online payment | `app/api/payments/`, `supabase/migrations/` | Stripe Checkout, pending orders, transactional SQL functions, webhook processing |
| Order administration | `app/admin/orders/`, `app/admin/recovery/`, `app/admin/emails/` | Order status, kitchen tickets, payment recovery, notifications |
| Customers and reports | `app/admin/customers/`, `app/admin/analytics/` | Derived from online orders; not a combined catering/invoice customer database |
| Operations/settings | `app/admin/menu/`, `app/admin/categories/`, `app/admin/time-slots/`, `app/admin/settings/`, `app/admin/staff/` | Tenant-scoped menu, availability, business settings and staff |

The navigation inventory is in `components/admin/AdminSidebar.tsx`.
The inventory screen exists, but its stock-field update path needs completion;
see follow-ups below.

## Catering workflow and boundaries

1. A customer submits `/contact`; the API attempts to save `quote_requests` and send emails.
2. Staff work in `/admin/quotes`, using statuses `new`, `contacted`, `quoted`,
   `converted`, and `lost`, notes, filters, and PDF attachments.
3. Staff create a document in `/admin/invoice`. The generator has its own quote
   document type; this is distinct from a customer enquiry in `quote_requests`.
4. A PDF can be manually attached to a catering enquiry. The quote list fetches
   attachment metadata; actual file content is fetched separately on download.
5. Staff can copy enquiry details into a Google Calendar event using Add to Calendar.
   This does not store a durable quote-to-Google-event association in the reviewed code.

There is no automatic enquiry -> generated invoice -> Stripe payment chain.
`invoice_history` has a tenant relationship but no enquiry/order foreign key.
The generator can convert one of its saved quote documents into an invoice.

The Event Planner is another separate workflow: event preparation quantities,
packs, costs/selling prices, actual sales, previous-event copying, and SumUp CSV import.
Its records are not automatically synchronized with Google Calendar or invoice history.

## Invoice implementation: edit the right copy

`app/admin/invoice/page.tsx` embeds `/invoice-generator/index.html` in an iframe.
The active assets are `public/invoice-generator/{index.html,app.js,styles.css}`.
No build/copy/link mechanism from the sibling `moto-kitchen-invoices/` was found.
Changing the standalone tool therefore does not change the website's generator.

The website generator supports invoice, quote, and embassy invoice documents;
per-person menus or custom quantities; discounts; mocktails; service fees;
staff billed as people × hours × rate; named additional fees; amended invoices;
previous payments; and an optional 9% VAT breakdown. Document numbers are entered
manually and the history schema does not enforce their uniqueness.

Current calculation details in `public/invoice-generator/app.js`:

- Staff costs are displayed inside the service fee.
- Optional administration fee is 3% of item total + service fee + staff cost.
- The named additional fee is added separately and excluded from that 3% base.
- Invoice deposit is 100% when the event is within seven days of invoice date,
  otherwise 50%; amended documents have their own balance display behavior.

These are descriptions of existing code; preserve them unless the requested change
explicitly revises the business rules.

PDFs are generated in the browser using locally bundled jsPDF and html2canvas
in the website copy. The older standalone copy uses CDN script references.
Both tools attempt to load menu data from Google Sheets through an AllOrigins proxy,
with hardcoded fallback menu data. That list is separate from both the marketing
menu and the Supabase online-order menu.

Website history is saved on PDF download through `/api/invoice-history`.
It stores form-data JSON, not the generated PDF. Authenticated APIs scope history
to the admin's tenant; schema/RLS are in
`supabase/migrations/2026-02-18-invoice-history.sql`.
Drafts stay in browser localStorage. Failed history API access falls back to localStorage;
no later merge/upload of local-only history was found. The standalone tool stores
drafts and its last 50 history entries only in that browser.

## Ordering, authentication, and services

Ordering routes are `/order`, `/order/cart`, `/order/checkout`, and
`/order/order-success`. `/order` has a browser-side password gate; it does not
protect the underlying public APIs. Its live launch status was not established.

The payment route creates a Stripe session, then calls `create_pending_order_with_slot`
to reserve capacity and create an order atomically. If that step fails, it expires
the Stripe session. A signed `checkout.session.completed` webhook invokes
`process_webhook_atomically`; local SQL covers payment updates, email queueing,
expired reservations, and recovery. Cron endpoints process emails, clean pending
orders, and generate slots. Actual deployed SQL and cron schedules remain unverified.

2026-11-04: Supabase reported the Disk IO Budget depleting on project
`qdtusashoqscbujhymdd`. Note that this project is named "moto kitchen website
email list" in the Supabase dashboard but is the main website database, not a
mailing list. Cause was cron plumbing, not traffic: `process-email-queue` ran
every minute and `cleanup-expired-pending-orders` every five, and both wrote a
`cron_job_runs` row on every tick regardless of whether work was found, while
nothing pruned `cron_job_runs`, `cron.job_run_details`, or `net._http_response`.
About 1,728 writes/day accumulated indefinitely.

The user confirmed ordering and payments are unused; the live features are
Quotes, Generate Invoice, and Calendar. Verified independent: Quotes uses
`quote_requests` and sends mail directly through Resend in `app/api/contact/route.ts`;
Generate Invoice uses `invoice_history`; Calendar uses the Google Calendar API and
no Supabase table. `email_queue.order_id` is `NOT NULL REFERENCES orders(id)`, so
the queue cannot carry quote mail and is empty while ordering is off.

`supabase/migrations/2026-11-04-pause-ordering-crons-and-log-retention.sql`
unschedules the ordering crons, truncates the three log tables only, guards both
idle-logging inserts, and adds a weekly `prune_job_logs`. No customer or business
table is touched. Reversal SQL is in that file's footer.

Applied to production on 2026-11-04 and verified. Note a name drift found during
that run: `docs/SUPABASE_CRON_SETUP.md` documented the job as
`cleanup-expired-pending-orders`, but the deployed job was named
`cleanup-expired-orders`, so the first pass did not unschedule it. It was
unscheduled separately and both the migration and the setup doc now use the
deployed name. Verified end state of `cron.job`: a single job, `prune-job-logs`
on `17 4 * * 0`. Treat cron job names in docs as unverified until checked against
`select jobname from cron.job`.

Current admin authentication is Supabase Auth plus `tenant_members`, selecting the
user's first membership (`lib/auth/server-admin.ts`). Implemented roles include
owner/admin/staff. JWT-scoped and service-role Supabase clients coexist; inspect
the specific call path before changing access rules. Older auth helpers also remain.

Integration configuration names, without values:

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ENABLE_AUTO_REPLY`, `TEST_EMAIL_REDIRECT`.
- Calendar: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`.
- Other: `CRON_SECRET`, site/base URL settings, order gate/base-path settings, GTM, dormant Sanity settings.

## Recent local development

| Date | Changes visible in local Git history |
| --- | --- |
| 2026-10-03 | Avoid downloading every quote PDF in the list; calendar read/write/display in Amsterdam time |
| 2026-10-02 | Named additional fees; staff inside service fee; additional fee excluded from 3% admin fee |
| 2026-09 | Staff people/hours/rate calculation; New Document buttons; menu additions; saved-document previews; multi-day calendar events |
| 2026-08 | Invoice overflow/page sizing fixes; menu/input improvements |
| 2026-05–06 | Quote-to-invoice conversion, embassy history fixes, amended invoices, VAT display changes |
| 2026-02–03 | Database invoice history, custom order mode, quote PDF attachments, Event Planner and Calendar |

## Verification baseline and concrete follow-ups

Completed local checks on 2026-10-23 using Node 22.22.1:

- JavaScript syntax checks passed for both invoice `app.js` files.
- TypeScript `--noEmit --incremental false` exited 2, with existing errors in
  `__tests__/double-booking-prevention.test.ts`, `__tests__/stripe-payment-flow.test.ts`,
  and `__tests__/rls.test.ts`. Errors concern Supabase types resolving to `never` /
  RPC arguments to `undefined`, nullability, and variables used before assignment.
- No application-source TypeScript errors were reported by that invocation.
- No build, runtime/browser verification, full Jest run, deployment, or migration was performed.

Follow-ups observed in source; these are not claims about verified production incidents:

| Finding | Evidence / next investigation |
| --- | --- |
| Database integration tests can remove real records | `jest.setup.js` loads `.env.local`; `__tests__/pending-order-flow.test.ts:18` and `__tests__/webhook-failure-scenarios.test.ts:25` broadly delete rows using service role. Require a verified disposable test database before running them. |
| Checkout trusts client-provided prices and totals | `app/api/payments/create-session/route.ts:45`, `:99`, `:115`; no authoritative menu-price calculation or create-session idempotency key in this route. Compare implementation against `PAYMENTS_TRUTH.md`. |
| Webhook coverage differs from payment contract | `app/api/payments/webhook/route.ts:71` handles only checkout completion; processor receives IDs without paid amount/currency. Other event types are acknowledged unhandled. Success-page polling is much shorter than documented. |
| Tenant/header handling needs review | `middleware.ts` sets response headers, while admin layout and `lib/tenant.ts` read request headers. Tenant helper accepts tenant headers and defaults unknown hosts to Moto Kitchen. |
| Calendar CSRF return value is ignored | Mutation handlers in `app/api/admin/calendar/route.ts` and `from-quote/route.ts` call asynchronous verification without awaiting or checking its boolean. |
| Inventory changes are not fully wired | Inventory UI submits stock/tracking fields; `app/api/admin/menu/items/[id]/route.ts` copies only standard menu update fields. |
| Invoice history can be local-only without a clear distinction | Generator API failure fallback; verify intended offline/sync behavior before changing storage. |
| Quote read protection depends on database policies | Quote GET APIs rely on JWT client/RLS without explicit admin membership checks; confirm deployed policies before asserting access is restricted. |
| Enquiry delivery can fail while the API reports success | `app/api/contact/route.ts` logs database insertion failures and returned email errors, then can still return `success: true`; review durable intake and retry behavior. |

The product/engineering/payment truth files remain requirements, but their scope,
checklists, and older completion reports do not fully describe today's code.
The website README is still the Next.js starter README. Older setup SQL includes
reset/drop scripts; inspect migrations and the target environment before running any SQL.

## Working entry points

From `moto-kitchen-website/`, `npm run dev` starts the development server.
Scripts also provide build, lint, Jest, and multiple service-connected verification
tasks. Read a script's side effects before running it; the `test` label does not
guarantee isolated or non-destructive behavior.

Read `.claud.md` for established editing and release conventions. Update relevant
truth documents when intentionally changing payment, auth, tenancy, or product
requirements. Keep this map current when workflows or integration boundaries change.
