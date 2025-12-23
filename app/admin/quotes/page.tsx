"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  useEffect(() => {
    // Check authentication via API (server-side session)
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
      const response = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchQuotes();
        if (selectedQuote?.id === id) {
          setSelectedQuote({ ...selectedQuote, status: newStatus });
        }
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
      const response = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
    const headers = ["Date", "Name", "Email", "Phone", "Event Type", "Date", "Guests", "Location", "Service Type", "Budget Range", "Status"];
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
      "100-250": "€100-250",
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
      "full-catering": "Full Catering Service",
      "drop-off": "Drop-Off Catering",
      "pickup-only": "Pick-Up Only",
      "not-sure-service": "Not sure yet",
    };
    return serviceMap[serviceType] || serviceType;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NL", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  if (loading && quotes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF]">
        <p className="text-[#4B4B4B]">Loading quotes...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--brand-secondary, #3A2A24)' }}>
            Quote Requests
          </h1>
          <p style={{ color: 'var(--brand-muted, #4B4B4B)' }}>
            Manage and track all quote requests
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={exportToCSV}
            className="btn-secondary px-6"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B]"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
                Search
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Name, email, or location"
                  className="flex-1 px-4 py-2 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B]"
                />
                <button onClick={handleSearch} className="btn-primary px-6">
                  Search
                </button>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSearchTerm("");
                  fetchQuotes();
                }}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F1E7DA]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                    Guests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                    Service Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6D9C8]">
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-[#4B4B4B]">
                      No quote requests found
                    </td>
                  </tr>
                ) : (
                  quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-[#FAF6EF]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4B4B4B]">
                        {formatDate(quote.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1F1F1F]">
                        {quote.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4B4B4B]">
                        <a href={`mailto:${quote.email}`} className="text-[#C9653B] hover:underline">
                          {quote.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4B4B4B]">
                        {quote.event_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4B4B4B]">
                        {quote.guest_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4B4B4B]">
                        {quote.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4B4B4B]">
                        {quote.service_type ? formatServiceType(quote.service_type) : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="text-[#C9653B] hover:underline"
                        >
                          View
                        </button>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setSelectedQuote(null)}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E6D9C8] flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#3A2A24]">Quote Details</h2>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="text-[#4B4B4B] hover:text-[#1F1F1F]"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-[#1F1F1F] mb-2">Contact Information</h3>
                  <p><strong>Name:</strong> {selectedQuote.name}</p>
                  <p><strong>Email:</strong> <a href={`mailto:${selectedQuote.email}`} className="text-[#C9653B]">{selectedQuote.email}</a></p>
                  <p><strong>Phone:</strong> <a href={`tel:${selectedQuote.phone}`} className="text-[#C9653B]">{selectedQuote.phone}</a></p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1F1F1F] mb-2">Event Details</h3>
                  <p><strong>Type:</strong> {selectedQuote.event_type}</p>
                  <p><strong>Date:</strong> {selectedQuote.event_date || "Flexible"}</p>
                  <p><strong>Guests:</strong> {selectedQuote.guest_count}</p>
                  <p><strong>Location:</strong> {selectedQuote.location}</p>
                  {selectedQuote.service_type && (
                    <p><strong>Service Type:</strong> {formatServiceType(selectedQuote.service_type)}</p>
                  )}
                  {selectedQuote.budget_range && (
                    <p><strong>Budget Range:</strong> {formatBudgetRange(selectedQuote.budget_range)}</p>
                  )}
                </div>
                {selectedQuote.dietary_requirements && selectedQuote.dietary_requirements.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-[#1F1F1F] mb-2">Dietary Requirements</h3>
                    <p>{selectedQuote.dietary_requirements.join(", ")}</p>
                  </div>
                )}
                {selectedQuote.message && (
                  <div>
                    <h3 className="font-semibold text-[#1F1F1F] mb-2">Message</h3>
                    <p className="text-[#4B4B4B]">{selectedQuote.message}</p>
                  </div>
                )}
                {selectedQuote.how_found && (
                  <div>
                    <h3 className="font-semibold text-[#1F1F1F] mb-2">How They Found Us</h3>
                    <p className="text-[#4B4B4B]">{selectedQuote.how_found}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-[#1F1F1F] mb-2">Internal Notes</h3>
                  <textarea
                    value={selectedQuote.notes || ""}
                    onChange={(e) => {
                      const updated = { ...selectedQuote, notes: e.target.value };
                      setSelectedQuote(updated);
                    }}
                    onBlur={(e) => updateNotes(selectedQuote.id, e.target.value)}
                    className="w-full px-4 py-2 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B]"
                    rows={4}
                    placeholder="Add internal notes..."
                  />
                </div>
                <div className="pt-4 border-t border-[#E6D9C8]">
                  <p className="text-sm text-[#4B4B4B]">
                    <strong>Submitted:</strong> {formatDate(selectedQuote.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

