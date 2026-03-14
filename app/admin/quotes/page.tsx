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
  quote_file: string | null;
  quote_file_name: string | null;
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
  const [uploadingFileId, setUploadingFileId] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarForm, setCalendarForm] = useState({
    summary: '', date: '', startTime: '', endTime: '', location: '', description: '',
  });
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const [calendarSuccess, setCalendarSuccess] = useState(false);

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

  const uploadQuoteFile = async (id: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }
    try {
      setUploadingFileId(id);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (csrfToken) headers["x-csrf-token"] = csrfToken;
        const response = await fetch(`/api/quotes/${id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ quote_file: base64, quote_file_name: file.name }),
        });
        if (response.ok) {
          fetchQuotes();
          if (selectedQuote?.id === id) {
            setSelectedQuote({ ...selectedQuote, quote_file: base64, quote_file_name: file.name });
          }
        } else {
          alert("Failed to upload file");
        }
        setUploadingFileId(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
      setUploadingFileId(null);
    }
  };

  const deleteQuoteFile = async (id: string) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfToken) headers["x-csrf-token"] = csrfToken;
      const response = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ quote_file: null, quote_file_name: null }),
      });
      if (response.ok) {
        fetchQuotes();
        if (selectedQuote?.id === id) {
          setSelectedQuote({ ...selectedQuote, quote_file: null, quote_file_name: null });
        }
      }
    } catch (error) {
      console.error("Error deleting file:", error);
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

  const openCalendarModal = (quote: QuoteRequest) => {
    // Parse event_date to YYYY-MM-DD format if possible
    let dateStr = '';
    if (quote.event_date) {
      try {
        const parsed = new Date(quote.event_date);
        if (!isNaN(parsed.getTime())) {
          dateStr = parsed.toISOString().split('T')[0];
        }
      } catch {
        dateStr = '';
      }
    }

    const descParts = [];
    if (quote.guest_count) descParts.push(`Guests: ${quote.guest_count}`);
    if (quote.budget_range) descParts.push(`Budget: ${formatBudgetRange(quote.budget_range)}`);
    if (quote.service_type) descParts.push(`Service: ${formatServiceType(quote.service_type)}`);
    if (quote.dietary_requirements?.length) descParts.push(`Dietary: ${quote.dietary_requirements.join(', ')}`);
    if (quote.message) descParts.push(`\nMessage: ${quote.message}`);

    setCalendarForm({
      summary: `${quote.name} - ${quote.event_type}${quote.guest_count ? ` (${quote.guest_count} guests)` : ''}`,
      date: dateStr,
      startTime: '',
      endTime: '',
      location: quote.location || '',
      description: descParts.join('\n'),
    });
    setCalendarSuccess(false);
    setShowCalendarModal(true);
  };

  const handleAddToCalendar = async () => {
    if (!calendarForm.summary || !calendarForm.date) return;
    setAddingToCalendar(true);
    try {
      const res = await fetch('/api/admin/calendar/from-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        body: JSON.stringify({
          summary: calendarForm.summary,
          date: calendarForm.date,
          startTime: calendarForm.startTime || undefined,
          endTime: calendarForm.endTime || undefined,
          location: calendarForm.location || undefined,
          description: calendarForm.description || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to add to calendar');
      setCalendarSuccess(true);
      setTimeout(() => {
        setShowCalendarModal(false);
        setCalendarSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Error adding to calendar:', err);
      alert('Failed to add to calendar. Check that Google Calendar is configured.');
    } finally {
      setAddingToCalendar(false);
    }
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
                        {quote.quote_file && (
                          <span title="Quote attached">
                            <svg className="w-3.5 h-3.5 text-[#C9653B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                          </span>
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
                            {quote.quote_file && (
                              <span title="Quote attached">
                                <svg className="w-3.5 h-3.5 text-[#C9653B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                              </span>
                            )}
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

                  {/* Quote Attachment */}
                  <div>
                    <h3 className="font-semibold text-sm text-[#1F1F1F] mb-2">Quote Attachment</h3>
                    {selectedQuote.quote_file ? (
                      <div className="flex items-center gap-3 p-3 bg-[#FAF6EF] rounded-lg border border-[#E6D9C8]">
                        <svg className="w-5 h-5 text-[#C9653B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-[#1F1F1F] flex-1 truncate">{selectedQuote.quote_file_name || "quote.pdf"}</span>
                        <a
                          href={selectedQuote.quote_file}
                          download={selectedQuote.quote_file_name || "quote.pdf"}
                          className="text-xs px-3 py-1 text-[#C9653B] border border-[#C9653B] rounded hover:bg-[#C9653B]/5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Download
                        </a>
                        <button
                          onClick={() => {
                            if (confirm("Remove attached file?")) {
                              deleteQuoteFile(selectedQuote.id);
                            }
                          }}
                          className="text-xs px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[#E6D9C8] rounded-lg cursor-pointer hover:border-[#C9653B] hover:bg-[#FAF6EF] transition-colors">
                        <svg className="w-5 h-5 text-[#6B5B55]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-sm text-[#6B5B55]">
                          {uploadingFileId === selectedQuote.id ? "Uploading..." : "Upload quote PDF"}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          className="hidden"
                          disabled={uploadingFileId === selectedQuote.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadQuoteFile(selectedQuote.id, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>

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

                  {/* Add to Calendar */}
                  <div>
                    <button
                      onClick={() => openCalendarModal(selectedQuote)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition"
                      style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Add to Calendar
                    </button>
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

      {/* Add to Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCalendarModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add to Calendar</h2>
            </div>
            {calendarSuccess ? (
              <div className="p-10 text-center">
                <div className="text-4xl mb-3">&#10003;</div>
                <p className="text-sm font-medium text-green-700">Added to calendar</p>
              </div>
            ) : (
              <>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={calendarForm.summary}
                      onChange={(e) => setCalendarForm(p => ({ ...p, summary: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={calendarForm.date}
                      onChange={(e) => setCalendarForm(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={calendarForm.startTime}
                        onChange={(e) => setCalendarForm(p => ({ ...p, startTime: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={calendarForm.endTime}
                        onChange={(e) => setCalendarForm(p => ({ ...p, endTime: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={calendarForm.location}
                      onChange={(e) => setCalendarForm(p => ({ ...p, location: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={calendarForm.description}
                      onChange={(e) => setCalendarForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    onClick={() => setShowCalendarModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddToCalendar}
                    disabled={addingToCalendar || !calendarForm.summary || !calendarForm.date}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50"
                    style={{ backgroundColor: 'var(--brand-primary, #C9653B)' }}
                  >
                    {addingToCalendar ? 'Adding...' : 'Add to Calendar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
