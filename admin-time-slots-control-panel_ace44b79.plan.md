---
name: admin-time-slots-control-panel
overview: Consolidate all UI, generator, safety, and operational requirements into a single production-safe plan for the Time Slots control panel.
todos:
  - id: ui-rules
    content: Add rule editor & apply rules to /admin/time-slots
    status: pending
  - id: gen-logic
    content: Update generator for create-missing-only and override respect
    status: pending
  - id: api-extend
    content: Extend admin endpoints (rules, blackout, reset, reconcile)
    status: pending
  - id: ui-calendar
    content: Build calendar view, warnings, confirmations, and reconcile control
    status: pending
  - id: verify
    content: Test horizons, generator, booking, and reconciliation
    status: pending
---

# Admin Time Slots Control Panel (Unified Production Plan)

## Core goals
- Provide a tenant-safe admin control panel that lets owners/staff define booking rules, generate slots, and manage overrides while keeping customer booking range fixed.
- Ensure slot generation is idempotent, respects overrides, enforces capacity atomically, and provides reconciliation.
- Keep the UI guarded (warnings, confirms) and the APIs tenant/role aware.

## Key requirements
1. **Source-of-truth horizons**
   - `/api/time-slots` always applies the *customer horizon* (from `slot_template`). That determines what customers see (Moto Kitchen: tomorrow + 3 days, exclude today).
   - Admin UI can display/edit a longer horizon (7–14 days) purely for planning/overrides; it does not leak into the customer-facing endpoint. Make this explicit in the UI text.
2. **Single closure model**
   - `blackout_dates` = whole-day closure (no generation, no slots, customer experience blocked).
   - `time_slots.is_active = false` = closing a single slot.
   - Do NOT build two different day-close controls; expose just the blackout toggle and slot-level active switch with clear messaging.
3. **Capacity semantics + atomic enforcement**
   - Keep the existing `book_time_slot` RPC (atomic `current_orders` increment) because the user chose that option.
   - Define which order/payment states count toward capacity (e.g., pending reserves until expiration, decremented on cancel/refund) and mention it in the admin UI/notes.
4. **Reconciliation action**
   - Add an admin button “Recalculate booked counts” that recomputes bookings from confirmed orders for a date range and syncs `time_slots.current_orders`. Handle refunds/cancels so counts never drift forever.
5. **Permissions**
   - Ensure admin endpoints are tenant/role aware (owner vs staff). Only owners can change templates/blackouts; staff can toggle slot active/capacity but not override templates/blackouts unless permitted.
6. **UI guardrails**
   - Warn if a rule will create an excessive number of slots (small interval + long window).
   - Confirm when setting capacity to zero (“This closes all slots for that day?”) or resetting to template defaults.
   - “Reset to default” actions should have confirmations.
7. **Generator behavior**
   - Enforce unique `(tenant_id, fulfillment_type, slot_time)` DDL.
   - Generator inserts missing slots only, marks them `generated_by_template=true`, and respects `is_overridden` (does not overwrite active/capacity unless user hits “Reset to default”).
   - Support windows (start/end), slot intervals (15/30/60), default capacity, and Moto Kitchen defaults (11–13, 17–21, 30min, capacity 2).
8. **Admin UI features**
   - Rule editor (horizons, exclude same-day, windows list, interval, default capacity) with “Apply rules” to save the template + run generator.
   - “Generate/Refresh next 4 days” button that only inserts missing slots, preserving overrides.
   - 7–14 day calendar grid: day open/close toggle (blackout), bulk capacity quick edits, add one-off windows for a day, slot list with active toggle, capacity edit, booked counts, “Reset to default” confirmed action.
   - Reconciliation action control.
9. **Verification**
   - Use admin UI to apply rules, generate slots, ensure slots appear for customers (4-day horizon) and that booking (checkout) respects slot capacity.
   - Test reconcile button, blackout behavior, and reset confirmations.

## Files in scope
- `[app/admin/time-slots/page.tsx]` – rule editor, calendar, warnings, confirmations, reconciling controls.
- `[lib/time-slots/generate-slots.ts]` – create-missing generator, respect overrides, add reset capability.
- `[app/api/admin/time-slots/route.ts]` & `[app/api/admin/time-slots/regenerate/route.ts]` – extend for rule application, blackout, slot updates, reconciliation.
- `[app/api/time-slots/route.ts]` – ensure it enforces customer horizon and respects blackouts.
- `[lib/email-templates.ts]` etc. only if needed for documentation; parking this plan on core files.

## Execution steps
1. Expand `[app/admin/time-slots/page.tsx]` to include rule form, warnings, hover text explaining customer vs admin horizon, blackout toggle, slot/slot list editing, extra window creation, and reconcile button. Include capacity/warning confirmations.
2. Adjust generator (`generate-slots.ts`) to insert missing slots using the template, respect `is_overridden`, and allow explicit reset. Use the unique constraint for idempotency.
3. Extend admin APIs to support: saving templates, applying rules, resetting slots/days to default, toggling blackouts, incremental slot updates, and reconciliation.
4. Ensure `/api/time-slots` enforces only the customer horizon, respects `blackout_dates`, and filters by `is_active`/capacity.
5. Verify workflow: apply rules, generate, reconcile, blackout, and run throwing scenario (capacity warnings). Ensure the admin UI is the “control panel” for staff.

Would you like me to proceed with this single merged plan?