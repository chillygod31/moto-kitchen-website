"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TimeSlot = {
  id: string;
  slot_time: string;
  max_orders: number;
  current_orders: number;
  is_active: boolean;
  is_overridden: boolean;
};

type SlotTemplateWindow = {
  start: string;
  end: string;
  interval_minutes: number;
};

type SlotTemplate = {
  timezone?: string;
  days_ahead_customer?: number;
  days_ahead_admin?: number;
  exclude_same_day?: boolean;
  windows?: SlotTemplateWindow[];
  default_capacity?: number;
};

type AdminSlotsResponse = {
  slots: TimeSlot[];
  blackout_dates: string[];
  template?: SlotTemplate;
};

const DEFAULT_TEMPLATE: SlotTemplate = {
  timezone: "Europe/Amsterdam",
  days_ahead_customer: 4,
  days_ahead_admin: 7,
  exclude_same_day: true,
  windows: [
    { start: "11:00", end: "13:00", interval_minutes: 30 },
    { start: "17:00", end: "21:00", interval_minutes: 30 },
  ],
  default_capacity: 2,
};

export default function AdminTimeSlotsPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [template, setTemplate] = useState<SlotTemplate>(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adminDays = template.days_ahead_admin ?? 7;
  const customerDays = template.days_ahead_customer ?? 4;

  const slotsByDate = useMemo(() => {
    return slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
      const day = new Date(slot.slot_time).toISOString().split("T")[0];
      acc[day] = acc[day] || [];
      acc[day].push(slot);
      return acc;
    }, {});
  }, [slots]);

  const dateList = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    const dates: string[] = [];
    for (let i = 0; i < adminDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  }, [adminDays]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/session");
        if (!res.ok) {
          router.push("/admin/login");
          return;
        }
        await fetchSlots();
      } catch {
        router.push("/admin/login");
      }
    };
    checkAuth();
  }, [router]);

  const decodeResponse = async (res: Response) => {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.json();
    }
    return { error: await res.text() };
  };

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/time-slots");
      const data: AdminSlotsResponse = await decodeResponse(res);
      if (!res.ok) throw new Error(data as any);
      setSlots(data.slots || []);
      setBlackoutDates(data.blackout_dates || []);
      setTemplate({ ...DEFAULT_TEMPLATE, ...(data.template || {}) });
    } catch (err: any) {
      setError(err.message || "Failed to load time slots");
    } finally {
      setLoading(false);
    }
  };

  const regenerateDefaults = async (days = 4) => {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/time-slots/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days_ahead: days }),
      });
      const data = await decodeResponse(res);
      if (!res.ok) throw new Error(data.error || "Failed to regenerate slots");
      await fetchSlots();
    } catch (err: any) {
      setError(err.message || "Failed to regenerate slots");
    } finally {
      setUpdating(false);
    }
  };

  const applyRules = async () => {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/time-slots/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apply_rules: true,
          template,
          days_ahead: customerDays,
          fulfillment_type: "pickup",
        }),
      });
      const data = await decodeResponse(res);
      if (!res.ok) throw new Error(data.error || "Failed to apply rules");
      await fetchSlots();
    } catch (err: any) {
      setError(err.message || "Failed to apply rules");
    } finally {
      setUpdating(false);
    }
  };

  const toggleBlackout = async (date: string) => {
    setUpdating(true);
    setError(null);
    try {
      const isBlackout = blackoutDates.includes(date);
      const res = await fetch("/api/admin/time-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isBlackout ? "remove" : "add", date }),
      });
      const data = await decodeResponse(res);
      if (!res.ok) throw new Error(data.error || "Failed to update blackout");
      setBlackoutDates(data.blackout_dates || []);
      await fetchSlots();
    } catch (err: any) {
      setError(err.message || "Failed to update blackout");
    } finally {
      setUpdating(false);
    }
  };

  const updateSlot = async (slotId: string, updates: Partial<TimeSlot>) => {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/time-slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, ...updates }),
      });
      const data = await decodeResponse(res);
      if (!res.ok) throw new Error(data.error || "Failed to update slot");
      await fetchSlots();
    } catch (err: any) {
      setError(err.message || "Failed to update slot");
    } finally {
      setUpdating(false);
    }
  };

  const resetDay = async (date: string) => {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/time-slots/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const data = await decodeResponse(res);
      if (!res.ok) throw new Error(data.error || "Failed to reset day");
      await fetchSlots();
    } catch (err: any) {
      setError(err.message || "Failed to reset day");
    } finally {
      setUpdating(false);
    }
  };

  const resetSlot = async (slotId: string) => {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/time-slots/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot_id: slotId }),
      });
      const data = await decodeResponse(res);
      if (!res.ok) throw new Error(data.error || "Failed to reset slot");
      await fetchSlots();
    } catch (err: any) {
      setError(err.message || "Failed to reset slot");
    } finally {
      setUpdating(false);
    }
  };

  const reconcile = async () => {
    setUpdating(true);
    setError(null);
    try {
      const start = dateList[0];
      const end = dateList[dateList.length - 1];
      const res = await fetch("/api/admin/time-slots/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: start, end_date: end, fulfillment_type: "pickup" }),
      });
      const data = await decodeResponse(res);
      if (!res.ok) throw new Error(data.error || "Failed to reconcile");
      await fetchSlots();
    } catch (err: any) {
      setError(err.message || "Failed to reconcile");
    } finally {
      setUpdating(false);
    }
  };

  const addWindow = () => {
    setTemplate((prev) => ({
      ...prev,
      windows: [...(prev.windows || []), { start: "10:00", end: "12:00", interval_minutes: 30 }],
    }));
  };

  const updateWindow = (idx: number, field: keyof SlotTemplateWindow, value: string | number) => {
    setTemplate((prev) => {
      const windows = [...(prev.windows || [])];
      const win = { ...windows[idx], [field]: value };
      windows[idx] = win;
      return { ...prev, windows };
    });
  };

  const removeWindow = (idx: number) => {
    setTemplate((prev) => {
      const windows = [...(prev.windows || [])];
      windows.splice(idx, 1);
      return { ...prev, windows };
    });
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NL", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Time Slots</h1>
          <p className="text-sm text-gray-600">
            Customer horizon controls booking window; admin horizon is view-only. Default: 4 days (exclude today), 30m, 11–13 & 17–21, capacity 2.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => regenerateDefaults(customerDays)}
            disabled={updating}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {updating ? "Working..." : "Generate/Refresh next 4 days"}
          </button>
          <button
            onClick={reconcile}
            disabled={updating}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Reconcile booked counts
          </button>
        </div>
      </div>

      {/* Rule editor */}
      <div className="rounded border border-gray-200 bg-white p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Rule editor</h2>
            <p className="text-sm text-gray-600">
              Customer horizon applies to the public API; admin horizon is for visibility/editing only.
            </p>
          </div>
          <button
            onClick={applyRules}
            disabled={updating}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            Save & Apply rules
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm text-gray-700 flex flex-col gap-1">
            Customer horizon (days)
            <input
              type="number"
              min={1}
              className="border rounded px-2 py-1"
              value={customerDays}
              onChange={(e) =>
                setTemplate((prev) => ({ ...prev, days_ahead_customer: parseInt(e.target.value || "0", 10) }))
              }
            />
          </label>
          <label className="text-sm text-gray-700 flex flex-col gap-1">
            Admin horizon (days)
            <input
              type="number"
              min={1}
              className="border rounded px-2 py-1"
              value={adminDays}
              onChange={(e) =>
                setTemplate((prev) => ({ ...prev, days_ahead_admin: parseInt(e.target.value || "0", 10) }))
              }
            />
          </label>
          <label className="text-sm text-gray-700 flex flex-col gap-1">
            Default capacity per slot
            <input
              type="number"
              min={1}
              className="border rounded px-2 py-1"
              value={template.default_capacity ?? 2}
              onChange={(e) =>
                setTemplate((prev) => ({ ...prev, default_capacity: parseInt(e.target.value || "0", 10) }))
              }
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 mt-6">
            <input
              type="checkbox"
              checked={template.exclude_same_day ?? true}
              onChange={(e) => setTemplate((prev) => ({ ...prev, exclude_same_day: e.target.checked }))}
            />
            Exclude same day
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Pickup windows</h3>
            <button
              onClick={addWindow}
              className="text-sm text-black border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"
            >
              Add window
            </button>
          </div>
          {(template.windows || []).map((win, idx) => (
            <div key={idx} className="grid grid-cols-4 gap-3 items-center">
              <label className="text-sm text-gray-700 flex flex-col gap-1">
                Start
                <input
                  type="time"
                  value={win.start}
                  onChange={(e) => updateWindow(idx, "start", e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </label>
              <label className="text-sm text-gray-700 flex flex-col gap-1">
                End
                <input
                  type="time"
                  value={win.end}
                  onChange={(e) => updateWindow(idx, "end", e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </label>
              <label className="text-sm text-gray-700 flex flex-col gap-1">
                Interval (minutes)
                <select
                  value={win.interval_minutes}
                  onChange={(e) => updateWindow(idx, "interval_minutes", parseInt(e.target.value, 10))}
                  className="border rounded px-2 py-1"
                >
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={60}>60</option>
                </select>
              </label>
              <button
                onClick={() => removeWindow(idx)}
                className="text-sm text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-600">Loading time slots…</div>
      ) : (
        <div className="space-y-4">
          {dateList.length === 0 && (
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              No slots. Click “Generate/Refresh next 4 days” to seed them.
            </div>
          )}

          {dateList.map((day) => {
            const daySlots = slotsByDate[day] || [];
            const isBlackout = blackoutDates.includes(day);
            return (
              <div key={day} className="rounded border border-gray-200">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div>
                    <div className="font-semibold">{formatDate(day)}</div>
                    <div className="text-xs text-gray-500">{day}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleBlackout(day)}
                      disabled={updating}
                      className={`px-3 py-1 text-sm rounded border ${
                        isBlackout
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-white text-gray-700 border-gray-200"
                      }`}
                    >
                      {isBlackout ? "Blackout (click to reopen)" : "Blackout date"}
                    </button>
                    <button
                      onClick={() => resetDay(day)}
                      disabled={updating}
                      className="px-3 py-1 text-sm rounded border border-gray-200 hover:bg-gray-50"
                    >
                      Reset day
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {daySlots.length === 0 && !isBlackout && (
                    <div className="px-4 py-3 text-sm text-gray-500">No slots generated for this day.</div>
                  )}
                  {daySlots
                    .sort((a, b) => (a.slot_time > b.slot_time ? 1 : -1))
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">
                            {formatTime(slot.slot_time)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {slot.current_orders}/{slot.max_orders} booked
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-gray-600">
                            Capacity
                            <input
                              type="number"
                              min={1}
                              className="ml-2 w-20 rounded border border-gray-200 px-2 py-1 text-sm"
                              defaultValue={slot.max_orders}
                              onBlur={(e) =>
                                updateSlot(slot.id, {
                                  max_orders: parseInt(e.target.value || "0", 10),
                                })
                              }
                            />
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={slot.is_active}
                              onChange={(e) =>
                                updateSlot(slot.id, { is_active: e.target.checked })
                              }
                            />
                            Active
                          </label>
                          <button
                            onClick={() => resetSlot(slot.id)}
                            disabled={updating}
                            className="text-xs text-gray-600 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50"
                          >
                            Reset slot
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

