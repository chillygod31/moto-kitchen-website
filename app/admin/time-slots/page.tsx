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
  days_ahead_customer: 14, // 2 weeks ahead for Saturday bookings
  days_ahead_admin: 21,
  exclude_same_day: true,
  windows: [
    { start: "11:00", end: "17:00", interval_minutes: 15 }, // 11am-5pm, 15min slots, 2 orders per slot
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const slotsByDate = useMemo(() => {
    return slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
      const day = new Date(slot.slot_time).toISOString().split("T")[0];
      acc[day] = acc[day] || [];
      acc[day].push(slot);
      return acc;
    }, {});
  }, [slots]);

  // Get next upcoming Saturdays (for the admin view)
  const saturdayList = useMemo(() => {
    const saturdays: string[] = [];
    const today = new Date();
    let current = new Date(today);

    // Find next Saturday (Saturday = day 6)
    const dayOfWeek = current.getDay();
    const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek + 7) % 7;
    current.setDate(current.getDate() + daysUntilSaturday);

    // Get next 4 Saturdays using local date formatting (avoid UTC timezone shift)
    for (let i = 0; i < 4; i++) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(current.getDate()).padStart(2, "0");
      saturdays.push(`${year}-${month}-${day}`);
      current.setDate(current.getDate() + 7);
    }
    return saturdays;
  }, []);

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
      setSuccessMessage(isBlackout ? "Date reopened for orders" : "Date blacked out");
      setTimeout(() => setSuccessMessage(null), 3000);
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

  const reconcile = async () => {
    setUpdating(true);
    setError(null);
    try {
      const start = saturdayList[0];
      const end = saturdayList[saturdayList.length - 1];
      const res = await fetch("/api/admin/time-slots/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: start, end_date: end, fulfillment_type: "pickup" }),
      });
      const data = await decodeResponse(res);
      if (!res.ok) throw new Error(data.error || "Failed to reconcile");
      await fetchSlots();
      setSuccessMessage("Booking counts synced with actual orders");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reconcile");
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
          days_ahead: template.days_ahead_customer ?? 14,
          fulfillment_type: "pickup",
        }),
      });
      const data = await decodeResponse(res);
      if (!res.ok) throw new Error(data.error || "Failed to apply rules");
      await fetchSlots();
      setSuccessMessage("Settings saved and applied");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to apply rules");
    } finally {
      setUpdating(false);
    }
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString("en-NL", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Amsterdam",
    });
  };

  const formatDateShort = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("en-NL", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  };

  const getSlotStatus = (slot: TimeSlot) => {
    if (!slot.is_active) return { label: "Closed", color: "bg-gray-100 text-gray-600" };
    if (slot.current_orders >= slot.max_orders) return { label: "Full", color: "bg-red-100 text-red-700" };
    if (slot.current_orders > 0) return { label: `${slot.current_orders}/${slot.max_orders}`, color: "bg-yellow-100 text-yellow-700" };
    return { label: "Available", color: "bg-green-100 text-green-700" };
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600, color: 'var(--brand-secondary, #3A2A24)' }}>
          Pickup Time Slots
        </h1>
        <p className="text-sm" style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, color: 'var(--brand-muted, #4B4B4B)' }}>
          Manage Saturday pickup windows. Customers book 15-minute slots (max 2 orders per slot).
        </p>
      </div>

      {/* Quick Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#C9653B]">{saturdayList.length}</div>
              <div className="text-xs text-gray-500">Saturdays Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#3A2A24]">
                {slots.filter(s => s.is_active && s.current_orders < s.max_orders).length}
              </div>
              <div className="text-xs text-gray-500">Open Slots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#3A2A24]">
                {slots.reduce((acc, s) => acc + s.current_orders, 0)}
              </div>
              <div className="text-xs text-gray-500">Total Bookings</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={reconcile}
              disabled={updating}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Sync Counts
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {showSettings ? "Hide Settings" : "Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Settings Panel (collapsible) */}
      {showSettings && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#3A2A24] mb-4" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
            Pickup Settings
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Slot Interval */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slot interval (minutes)
              </label>
              <select
                value={template.windows?.[0]?.interval_minutes ?? 15}
                onChange={(e) => {
                  const windows = [...(template.windows || [])];
                  if (windows[0]) windows[0] = { ...windows[0], interval_minutes: parseInt(e.target.value) };
                  else windows[0] = { start: "11:00", end: "17:00", interval_minutes: parseInt(e.target.value) };
                  setTemplate((prev) => ({ ...prev, windows }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Time between pickup slots</p>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orders per slot
              </label>
              <input
                type="number"
                min={1}
                max={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent"
                value={template.default_capacity ?? 2}
                onChange={(e) =>
                  setTemplate((prev) => ({ ...prev, default_capacity: parseInt(e.target.value || "2", 10) }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">Maximum orders per slot</p>
            </div>

            {/* Booking Window */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance booking (days)
              </label>
              <input
                type="number"
                min={7}
                max={30}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent"
                value={template.days_ahead_customer ?? 14}
                onChange={(e) =>
                  setTemplate((prev) => ({ ...prev, days_ahead_customer: parseInt(e.target.value || "14", 10) }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">How far ahead customers can book</p>
            </div>

            {/* Pickup Hours */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Hours (Saturdays)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent"
                  value={template.windows?.[0]?.start || "11:00"}
                  onChange={(e) => {
                    const windows = [...(template.windows || [])];
                    if (windows[0]) windows[0] = { ...windows[0], start: e.target.value };
                    else windows[0] = { start: e.target.value, end: "17:00", interval_minutes: 15 };
                    setTemplate((prev) => ({ ...prev, windows }));
                  }}
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent"
                  value={template.windows?.[0]?.end || "17:00"}
                  onChange={(e) => {
                    const windows = [...(template.windows || [])];
                    if (windows[0]) windows[0] = { ...windows[0], end: e.target.value };
                    else windows[0] = { start: "11:00", end: e.target.value, interval_minutes: 15 };
                    setTemplate((prev) => ({ ...prev, windows }));
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Operating hours for Saturday pickups</p>
            </div>

            {/* Same Day Toggle */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.exclude_same_day ?? true}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, exclude_same_day: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-[#C9653B] focus:ring-[#C9653B]"
                />
                <span className="text-sm text-gray-700">
                  No same-day orders (customers must order at least 1 day in advance)
                </span>
              </label>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={applyRules}
              disabled={updating}
              className="px-6 py-2 bg-[#C9653B] text-white font-medium rounded-lg hover:bg-[#B8552B] disabled:opacity-50 transition"
            >
              {updating ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}

      {/* Saturday Slots */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Loading time slots...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {saturdayList.map((day) => {
            const daySlots = slotsByDate[day] || [];
            const isBlackout = blackoutDates.includes(day);
            const totalBooked = daySlots.reduce((acc, s) => acc + s.current_orders, 0);
            const totalCapacity = daySlots.reduce((acc, s) => acc + s.max_orders, 0);

            return (
              <div key={day} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Day Header */}
                <div className={`px-4 py-3 flex items-center justify-between ${isBlackout ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold text-[#3A2A24]">{formatDateShort(day)}</h3>
                      <p className="text-xs text-gray-500">
                        {isBlackout ? "Closed for orders" : daySlots.length > 0 ? `${totalBooked} of ${totalCapacity} slots booked` : "No slots available"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleBlackout(day)}
                    disabled={updating}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                      isBlackout
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    } disabled:opacity-50`}
                  >
                    {isBlackout ? "Open Day" : "Close Day"}
                  </button>
                </div>

                {/* Slots Grid */}
                {!isBlackout && daySlots.length > 0 && (
                  <div className="p-4">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {daySlots
                        .filter((slot) => {
                          // Filter slots to only show those within configured time window
                          const slotDate = new Date(slot.slot_time);
                          const slotHour = slotDate.getHours();
                          const slotMinute = slotDate.getMinutes();
                          const slotTimeStr = `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`;

                          const startTime = template.windows?.[0]?.start || "11:00";
                          const endTime = template.windows?.[0]?.end || "17:00";

                          return slotTimeStr >= startTime && slotTimeStr < endTime;
                        })
                        .sort((a, b) => (a.slot_time > b.slot_time ? 1 : -1))
                        .map((slot) => {
                          const status = getSlotStatus(slot);
                          return (
                            <button
                              key={slot.id}
                              onClick={() => updateSlot(slot.id, { is_active: !slot.is_active })}
                              disabled={updating}
                              className={`px-2 py-2 text-xs font-medium rounded-lg border transition ${
                                !slot.is_active
                                  ? "bg-gray-100 text-gray-400 border-gray-200"
                                  : slot.current_orders >= slot.max_orders
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : slot.current_orders > 0
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              } disabled:opacity-50`}
                              title={`${formatTime(slot.slot_time)} - ${status.label}${slot.current_orders > 0 ? ` (${slot.current_orders} booked)` : ""}`}
                            >
                              <div className="font-medium">{formatTime(slot.slot_time)}</div>
                              {slot.current_orders > 0 && (
                                <div className="text-[10px] opacity-75">{slot.current_orders}/{slot.max_orders}</div>
                              )}
                            </button>
                          );
                        })}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-green-100 border border-green-200"></span> Available
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></span> Partial
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-red-100 border border-red-200"></span> Full
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200"></span> Closed
                      </span>
                    </div>
                  </div>
                )}

                {!isBlackout && daySlots.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No pickup slots generated for this Saturday yet
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">How it works</h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Pickups are available on <strong>Saturdays only</strong></li>
          <li>• Configure slot interval, capacity, and hours in Settings</li>
          <li>• Click a time slot to toggle it open/closed</li>
          <li>• Use "Close Day" to block an entire Saturday</li>
          <li>• "Sync Counts" recalculates booked counts from actual orders</li>
          <li>• Click "Save Settings" to regenerate slots with new settings</li>
        </ul>
      </div>
    </div>
  );
}
