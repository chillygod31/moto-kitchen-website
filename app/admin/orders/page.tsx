"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderItem {
  id: string;
  menu_item_id: string;
  name_snapshot: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  notes: string | null;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  fulfillment_type: 'pickup' | 'delivery';
  scheduled_for: string | null;
  delivery_address: string | null;
  postcode: string | null;
  city: string | null;
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  admin_fee: number;
  total: number;
  status: string;
  payment_status: string;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "All Payment Statuses" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    // Check authentication via API (server-side session)
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/session");
        if (!response.ok) {
          router.push("/admin/login");
          return;
        }
        fetchOrders();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [statusFilter, paymentStatusFilter, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        let filteredOrders = data || [];
        
        // Filter by payment status if needed
        if (paymentStatusFilter !== "all") {
          filteredOrders = filteredOrders.filter(
            (order: Order) => order.payment_status === paymentStatusFilter
          );
        }

        setOrders(filteredOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const response = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders();
        if (selectedOrder?.id === id) {
          const updatedOrder = await response.json();
          setSelectedOrder(updatedOrder);
        }
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const updatePaymentStatus = async (id: string, newPaymentStatus: string) => {
    try {
      setUpdatingId(id);
      const response = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: newPaymentStatus }),
      });

      if (response.ok) {
        fetchOrders();
        if (selectedOrder?.id === id) {
          const updatedOrder = await response.json();
          setSelectedOrder(updatedOrder);
        }
      } else {
        alert("Failed to update payment status");
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("Failed to update payment status");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    return new Date(dateString).toLocaleString("en-NL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      confirmed: "bg-purple-100 text-purple-800",
      preparing: "bg-yellow-100 text-yellow-800",
      ready: "bg-green-100 text-green-800",
      completed: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      unpaid: "bg-orange-100 text-orange-800",
      paid: "bg-green-100 text-green-800",
      refunded: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p style={{ color: 'var(--brand-muted, #4B4B4B)' }}>Loading orders...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600, color: 'var(--brand-secondary, #3A2A24)' }}>
            Orders
          </h1>
          <p style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, color: 'var(--brand-muted, #4B4B4B)' }}>
            Manage and track all customer orders
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by customer name, email, or order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B]"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
        <div className="grid md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#1F1F1F] mb-2" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                Order Status
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
              <label className="block text-sm font-semibold text-[#1F1F1F] mb-2" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                Payment Status
              </label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B]"
              >
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1F1F1F] mb-2" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1F1F1F] mb-2" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B]"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setPaymentStatusFilter("all");
                  setSearchQuery("");
                  setDateFrom("");
                  setDateTo("");
                  fetchOrders();
                }}
                className="text-sm text-[#C9653B] hover:underline"
              >
                Clear Filters
              </button>
            </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-[#E6D9C8] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F1E7DA]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6D9C8]">
                    {(() => {
                      // Apply search and date filters
                      let filteredOrders = orders;
                      
                      // Search filter
                      if (searchQuery) {
                        filteredOrders = filteredOrders.filter((order) => {
                          const query = searchQuery.toLowerCase();
                          return (
                            order.order_number?.toLowerCase().includes(query) ||
                            order.customer_name?.toLowerCase().includes(query) ||
                            order.customer_email?.toLowerCase().includes(query)
                          );
                        });
                      }
                      
                      // Date range filter
                      if (dateFrom) {
                        const fromDate = new Date(dateFrom);
                        fromDate.setHours(0, 0, 0, 0);
                        filteredOrders = filteredOrders.filter((order) => {
                          const orderDate = new Date(order.created_at);
                          return orderDate >= fromDate;
                        });
                      }
                      
                      if (dateTo) {
                        const toDate = new Date(dateTo);
                        toDate.setHours(23, 59, 59, 999);
                        filteredOrders = filteredOrders.filter((order) => {
                          const orderDate = new Date(order.created_at);
                          return orderDate <= toDate;
                        });
                      }

                      return filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-[#4B4B4B]">
                            {searchQuery ? "No orders match your search" : "No orders found"}
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className={`hover:bg-[#FAF6EF] cursor-pointer ${
                            selectedOrder?.id === order.id ? "bg-[#FAF6EF]" : ""
                          }`}
                          onClick={async () => {
                            // Fetch full order details with items
                            try {
                              const response = await fetch(`/api/orders/${order.id}`)
                              if (response.ok) {
                                const fullOrder = await response.json()
                                setSelectedOrder(fullOrder)
                              } else {
                                // Fallback to order from list if fetch fails
                                setSelectedOrder(order)
                              }
                            } catch (error) {
                              console.error('Error fetching order details:', error)
                              // Fallback to order from list
                              setSelectedOrder(order)
                            }
                          }}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#1F1F1F]">
                            {order.order_number}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#4B4B4B]">
                            <div>
                              <div className="font-medium">{order.customer_name}</div>
                              {order.customer_email && (
                                <div className="text-xs text-[#C9653B]">{order.customer_email}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#4B4B4B]">
                            <span className="capitalize">{order.fulfillment_type}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-[#1F1F1F]">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#4B4B4B]">
                            {formatDate(order.created_at)}
                          </td>
                        </tr>
                        ))
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
        </div>

        {/* Order Details Sidebar */}
        <div className="lg:col-span-1">
            {selectedOrder ? (
              <div className="bg-white rounded-lg border border-[#E6D9C8] p-6 sticky top-24">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-[#3A2A24] mb-3" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                    Order {selectedOrder.order_number}
                  </h2>
                  <p className="text-sm text-[#4B4B4B] mb-4">
                    Created: {formatDate(selectedOrder.created_at)}
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedOrder.payment_status === 'unpaid' && (
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/orders/${selectedOrder.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ payment_status: 'paid' }),
                            });
                            if (response.ok) {
                              fetchOrders();
                              const updated = await response.json();
                              setSelectedOrder(updated);
                            }
                          } catch (error) {
                            console.error("Error updating payment status:", error);
                          }
                        }}
                        className="px-4 py-2 text-sm font-medium bg-green-100 text-green-700 rounded hover:bg-green-200 transition min-h-[36px]"
                      >
                        Mark Paid
                      </button>
                    )}
                    {selectedOrder.status !== 'ready' && selectedOrder.status !== 'completed' && (
                      <button
                        onClick={() => updateStatus(selectedOrder.id, 'ready')}
                        className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition min-h-[36px]"
                      >
                        Mark Ready
                      </button>
                    )}
                    {selectedOrder.status !== 'cancelled' && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this order?')) {
                            updateStatus(selectedOrder.id, 'cancelled');
                          }
                        }}
                        className="px-4 py-2 text-sm font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition min-h-[36px]"
                      >
                        Cancel
                      </button>
                    )}
                    <Link
                      href={`/admin/orders/${selectedOrder.id}/ticket`}
                      target="_blank"
                      className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition inline-block min-h-[36px] flex items-center justify-center"
                    >
                      Print Ticket
                    </Link>
                    {selectedOrder.customer_email && (
                      <button
                        onClick={async () => {
                          if (!confirm('Resend confirmation email to customer?')) return
                          try {
                            const response = await fetch(`/api/orders/${selectedOrder.id}/send-confirmation`, {
                              method: 'POST',
                            })
                            if (response.ok) {
                              alert('Confirmation email sent successfully!')
                              fetchOrders()
                            } else {
                              const error = await response.json()
                              alert(error.message || 'Failed to send email')
                            }
                          } catch (error) {
                            console.error('Error sending confirmation email:', error)
                            alert('Failed to send email')
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                      >
                        Resend Email
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-6 pb-6 border-b border-[#E6D9C8]">
                  <h3 className="font-semibold text-[#1F1F1F] mb-3" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>Customer Details</h3>
                  <div className="space-y-2 text-sm text-[#4B4B4B]">
                    <div>
                      <span className="font-medium">Name:</span> {selectedOrder.customer_name}
                    </div>
                    {selectedOrder.customer_email && (
                      <div>
                        <span className="font-medium">Email:</span>{" "}
                        <a
                          href={`mailto:${selectedOrder.customer_email}`}
                          className="text-[#C9653B] hover:underline"
                        >
                          {selectedOrder.customer_email}
                        </a>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Phone:</span>{" "}
                      <a
                        href={`tel:${selectedOrder.customer_phone}`}
                        className="text-[#C9653B] hover:underline"
                      >
                        {selectedOrder.customer_phone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6 pb-6 border-b border-[#E6D9C8]">
                  <h3 className="font-semibold text-[#1F1F1F] mb-3" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div>
                          <div className="font-medium text-[#1F1F1F]">
                            {item.name_snapshot} × {item.quantity}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-[#4B4B4B] italic">{item.notes}</div>
                          )}
                        </div>
                        <div className="text-[#1F1F1F] font-medium">
                          {formatCurrency(item.line_total)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mb-6 pb-6 border-b border-[#E6D9C8]">
                  <h3 className="font-semibold text-[#1F1F1F] mb-3" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#4B4B4B]">Subtotal:</span>
                      <span className="text-[#1F1F1F]">{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.delivery_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#4B4B4B]">Delivery Fee:</span>
                        <span className="text-[#1F1F1F]">
                          {formatCurrency(selectedOrder.delivery_fee)}
                        </span>
                      </div>
                    )}
                    {selectedOrder.service_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#4B4B4B]">Service Fee:</span>
                        <span className="text-[#1F1F1F]">
                          {formatCurrency(selectedOrder.service_fee)}
                        </span>
                      </div>
                    )}
                    {selectedOrder.admin_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#4B4B4B]">Admin Fee:</span>
                        <span className="text-[#1F1F1F]">
                          {formatCurrency(selectedOrder.admin_fee)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-[#3A2A24] pt-2 border-t border-[#E6D9C8]">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery/Pickup Info */}
                <div className="mb-6 pb-6 border-b border-[#E6D9C8]">
                  <h3 className="font-semibold text-[#1F1F1F] mb-3">
                    {selectedOrder.fulfillment_type === "delivery" ? "Delivery" : "Pickup"} Info
                  </h3>
                  <div className="space-y-2 text-sm text-[#4B4B4B]">
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      <span className="capitalize">{selectedOrder.fulfillment_type}</span>
                    </div>
                    {selectedOrder.fulfillment_type === "delivery" && (
                      <>
                        {selectedOrder.delivery_address && (
                          <div>
                            <span className="font-medium">Address:</span>{" "}
                            {selectedOrder.delivery_address}
                          </div>
                        )}
                        {selectedOrder.postcode && selectedOrder.city && (
                          <div>
                            <span className="font-medium">Location:</span> {selectedOrder.postcode}{" "}
                            {selectedOrder.city}
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      <span className="font-medium">Scheduled:</span>{" "}
                      {formatDateTime(selectedOrder.scheduled_for)}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="mb-6 pb-6 border-b border-[#E6D9C8]">
                    <h3 className="font-semibold text-[#1F1F1F] mb-3" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>Customer Notes</h3>
                    <p className="text-sm text-[#4B4B4B]">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Internal Notes (Admin Only) */}
                <div className="mb-6 pb-6 border-b border-[#E6D9C8]">
                  <h3 className="font-semibold text-[#1F1F1F] mb-3" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>Internal Notes</h3>
                  <textarea
                    value={selectedOrder.admin_notes || ''}
                    onChange={async (e) => {
                      const newNotes = e.target.value
                      setSelectedOrder({ ...selectedOrder, admin_notes: newNotes })
                      // Auto-save after 1 second of no typing
                      setTimeout(async () => {
                        try {
                          await fetch(`/api/orders/${selectedOrder.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ admin_notes: newNotes }),
                          })
                        } catch (error) {
                          console.error('Error saving admin notes:', error)
                        }
                      }, 1000)
                    }}
                    placeholder="Add internal notes (not visible to customer)..."
                    rows={4}
                    className="w-full px-3 py-2 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] text-sm"
                  />
                  <p className="text-xs text-[#4B4B4B] mt-1">
                    These notes are only visible to admin staff
                  </p>
                </div>

                {/* Status Updates */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#1F1F1F] mb-2" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                      Update Order Status
                    </label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                      disabled={updatingId === selectedOrder.id}
                      className="w-full px-4 py-2 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.filter((opt) => opt.value !== "all").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1F1F1F] mb-2" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
                      Update Payment Status
                    </label>
                    <select
                      value={selectedOrder.payment_status}
                      onChange={(e) => updatePaymentStatus(selectedOrder.id, e.target.value)}
                      disabled={updatingId === selectedOrder.id}
                      className="w-full px-4 py-2 border border-[#E6D9C8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9653B] disabled:opacity-50"
                    >
                      {PAYMENT_STATUS_OPTIONS.filter((opt) => opt.value !== "all").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        selectedOrder.status
                      )}`}
                    >
                      {selectedOrder.status}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(
                        selectedOrder.payment_status
                      )}`}
                    >
                      {selectedOrder.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#E6D9C8] p-6 text-center">
                <p className="text-[#4B4B4B]">Select an order to view details</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

