"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  event_type: string;
  event_date: string | null;
  guest_count: number;
  location: string;
  service_type: string | null;
  dietary_requirements: string[];
  message: string | null;
  how_found: string | null;
  budget_range: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

export default function AdminQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Fetch CSRF token on mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf');
        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrfToken);
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };
    fetchCsrfToken();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/session");
        if (!response.ok) {
          router.push("/admin/login");
          return;
        }
        fetchQuotes();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [statusFilter, router]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/quotes?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchQuotes();
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }
      const response = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchQuotes();
        if (selectedQuote?.id === id) {
          setSelectedQuote({ ...selectedQuote, status: newStatus });
        }
      } else {
        const errorData = await response.json();
        console.error("Error updating status:", errorData);
        alert("Failed to update status: " + (errorData.message || errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }
      const response = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        fetchQuotes();
        if (selectedQuote?.id === id) {
          setSelectedQuote({ ...selectedQuote, notes });
        }
      }
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Name", "Email", "Phone", "Event Type", "Event Date", "Guests", "Location", "Service Type", "Budget Range", "Status"];
    const rows = quotes.map((q) => [
      new Date(q.created_at).toLocaleDateString(),
      q.name,
      q.email,
      q.phone,
      q.event_type,
      q.event_date || "Flexible",
      q.guest_count,
      q.location,
      q.service_type ? formatServiceType(q.service_type) : "Not specified",
      q.budget_range ? formatBudgetRange(q.budget_range) : "Not specified",
      q.status,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quote-requests-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const formatBudgetRange = (budgetRange: string) => {
    const budgetMap: Record<string, string> = {
      "250-500": "€250-500",
      "500-1000": "€500-1,000",
      "1000-2500": "€1,000-2,500",
      "2500-5000": "€2,500-5,000",
      "5000+": "€5,000+",
      "not-sure": "Not sure yet",
    };
    return budgetMap[budgetRange] || budgetRange;
  };

  const formatServiceType = (serviceType: string | null) => {
    if (!serviceType) return "Not specified";
    const serviceMap: Record<string, string> = {
      "full-catering": "Full Catering",
      "drop-off": "Drop-Off",
      "pickup-only": "Pick-Up",
      "not-sure-service": "Not sure",
    };
    return serviceMap[serviceType] || serviceType;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NL", {
      day: "numeric",
      month: "short",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      quoted: "bg-purple-100 text-purple-800",
      converted: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <>
      {loading && quotes.length === 0 ? (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-[#4B4B4B]">Loading quotes...</p>
        </div>
      ) : (
        <div>
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600, color: 'var(--brand-secondary, #3A2A24)' }}>
              Quote Requests
            </h1>
            <p className="text-sm lg:text-base" style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, color: 'var(--brand-muted, #4B4B4B)' }}>
              Manage and track all quote requests
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-[#E6D9C8] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#C9653B]"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="flex-1 min-w-[180px] max-w-sm">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search name, email, location..."
                  className="w-full px-3 py-2 border border-[#E6D9C8] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#C9653B]"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 text-sm font-medium text-white rounded-md"
                style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
              >
                Search
              </button>
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSearchTerm("");
                  fetchQuotes();
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 ml-auto"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4 mb-4">
            {quotes.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-[#4B4B4B] border border-gray-200">
                No quote requests found
              </div>
            ) : (
              quotes.map((quote) => (
                <div key={quote.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[#1F1F1F]" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                          {quote.name}
                        </span>
                        {quote.status === 'new' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">New</span>
                        )}
                      </div>
                      <a href={`mailto:${quote.email}`} className="text-sm text-[#C9653B] hover:underline block truncate">
                        {quote.email}
                      </a>
                      <p className="text-xs text-[#6B5B55] mt-1">{formatDate(quote.created_at)}</p>
                    </div>
                    <select
                      value={quote.status}
                      onChange={(e) => updateStatus(quote.id, e.target.value)}
                      disabled={updatingId === quote.id}
                      className={`text-xs px-3 py-1 rounded-full font-semibold border-0 ${getStatusColor(quote.status)}`}
                    >
                      {STATUS_OPTIONS.slice(1).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-[#6B5B55] block text-xs mb-0.5">Event Type</span>
                      <span className="text-[#1F1F1F] line-clamp-2">{quote.event_type}</span>
                    </div>
                    <div>
                      <span className="text-[#6B5B55] block text-xs mb-0.5">Guests</span>
                      <span className="text-[#1F1F1F]">{quote.guest_count}</span>
                    </div>
                    <div>
                      <span className="text-[#6B5B55] block text-xs mb-0.5">Event Date</span>
                      <span className="text-[#1F1F1F]">{quote.event_date ? formatDate(quote.event_date) : "Flexible"}</span>
                    </div>
                    <div>
                      <span className="text-[#6B5B55] block text-xs mb-0.5">Location</span>
                      <span className="text-[#1F1F1F]">{quote.location || "-"}</span>
                    </div>
                  </div>

                  {/* View Details button */}
                  <button
                    onClick={() => setSelectedQuote(quote)}
                    className="w-full py-2 text-sm font-medium text-[#C9653B] border border-[#C9653B] rounded-md hover:bg-[#C9653B]/5"
                  >
                    View Details →
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-lg border border-[#E6D9C8] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F1E7DA]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">Event Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">Guests</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6D9C8]">
                  {quotes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-[#4B4B4B]">
                        No quote requests found
                      </td>
                    </tr>
                  ) : (
                    quotes.map((quote) => (
                      <tr
                        key={quote.id}
                        className={`hover:bg-[#FAF6EF] cursor-pointer ${quote.status === 'new' ? 'bg-blue-50/30' : ''}`}
                        onClick={() => setSelectedQuote(quote)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#4B4B4B]">
                          {formatDate(quote.created_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#1F1F1F]">
                          <div className="flex items-center gap-2">
                            {quote.status === 'new' && (
                              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" title="Not responded"></span>
                            )}
                            {quote.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#4B4B4B]">
                          <a href={`mailto:${quote.email}`} className="text-[#C9653B] hover:underline" onClick={(e) => e.stopPropagation()}>
                            {quote.email}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#4B4B4B]">
                          <span className="block truncate max-w-[120px]" title={quote.event_type}>
                            {quote.event_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#4B4B4B]">
                          {quote.event_date ? formatDate(quote.event_date) : "Flexible"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#4B4B4B]">
                          {quote.guest_count}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={quote.status}
                            onChange={(e) => updateStatus(quote.id, e.target.value)}
                            disabled={updatingId === quote.id}
                            className={`text-xs px-2 py-1 rounded-full font-semibold border-0 cursor-pointer ${getStatusColor(quote.status)}`}
                          >
                            {STATUS_OPTIONS.slice(1).map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quote Details Modal */}
          {selectedQuote && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedQuote(null)}>
              <div className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-[#3A2A24]">Quote Details</h2>
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {/* Contact */}
                  <div>
                    <h3 className="font-semibold text-sm text-[#1F1F1F] mb-2">Contact</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-[#6B5B55] text-xs">Name</span>
                        <p className="text-[#1F1F1F]">{selectedQuote.name}</p>
                      </div>
                      <div>
                        <span className="text-[#6B5B55] text-xs">Phone</span>
                        <p><a href={`tel:${selectedQuote.phone}`} className="text-[#C9653B]">{selectedQuote.phone}</a></p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[#6B5B55] text-xs">Email</span>
                        <p><a href={`mailto:${selectedQuote.email}`} className="text-[#C9653B]">{selectedQuote.email}</a></p>
                      </div>
                    </div>
                  </div>

                  {/* Event */}
                  <div>
                    <h3 className="font-semibold text-sm text-[#1F1F1F] mb-2">Event Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="col-span-2">
                        <span className="text-[#6B5B55] text-xs">Event Type</span>
                        <p className="text-[#1F1F1F]">{selectedQuote.event_type}</p>
                      </div>
                      <div>
                        <span className="text-[#6B5B55] text-xs">Date</span>
                        <p className="text-[#1F1F1F]">{selectedQuote.event_date || "Flexible"}</p>
                      </div>
                      <div>
                        <span className="text-[#6B5B55] text-xs">Guests</span>
                        <p className="text-[#1F1F1F]">{selectedQuote.guest_count}</p>
                      </div>
                      <div>
                        <span className="text-[#6B5B55] text-xs">Location</span>
                        <p className="text-[#1F1F1F]">{selectedQuote.location}</p>
                      </div>
                      <div>
                        <span className="text-[#6B5B55] text-xs">Service Type</span>
                        <p className="text-[#1F1F1F]">{formatServiceType(selectedQuote.service_type)}</p>
                      </div>
                      {selectedQuote.budget_range && (
                        <div>
                          <span className="text-[#6B5B55] text-xs">Budget</span>
                          <p className="text-[#1F1F1F]">{formatBudgetRange(selectedQuote.budget_range)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dietary */}
                  {selectedQuote.dietary_requirements && selectedQuote.dietary_requirements.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm text-[#1F1F1F] mb-1">Dietary Requirements</h3>
                      <p className="text-sm text-[#4B4B4B]">{selectedQuote.dietary_requirements.join(", ")}</p>
                    </div>
                  )}

                  {/* Message */}
                  {selectedQuote.message && (
                    <div>
                      <h3 className="font-semibold text-sm text-[#1F1F1F] mb-1">Message</h3>
                      <p className="text-sm text-[#4B4B4B] whitespace-pre-wrap">{selectedQuote.message}</p>
                    </div>
                  )}

                  {/* How found */}
                  {selectedQuote.how_found && (
                    <div>
                      <h3 className="font-semibold text-sm text-[#1F1F1F] mb-1">How They Found Us</h3>
                      <p className="text-sm text-[#4B4B4B]">{selectedQuote.how_found}</p>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <h3 className="font-semibold text-sm text-[#1F1F1F] mb-1">Internal Notes</h3>
                    <textarea
                      value={selectedQuote.notes || ""}
                      onChange={(e) => setSelectedQuote({ ...selectedQuote, notes: e.target.value })}
                      onBlur={(e) => updateNotes(selectedQuote.id, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#C9653B]"
                      rows={3}
                      placeholder="Add notes..."
                    />
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-gray-200 text-xs text-[#6B5B55]">
                    Submitted: {new Date(selectedQuote.created_at).toLocaleDateString("en-NL", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
