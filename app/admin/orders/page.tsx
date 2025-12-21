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

  useEffect(() => {
    // Check authentication
    const isAuthenticated = sessionStorage.getItem("admin_authenticated");
    if (!isAuthenticated) {
      router.push("/admin/login");
      return;
    }

    fetchOrders();
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF]">
        <p className="text-[#4B4B4B]">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#3A2A24] mb-2">Orders</h1>
            <p className="text-[#4B4B4B]">Manage and track all customer orders</p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin/quotes" className="btn-secondary px-6">
              View Quotes
            </Link>
            <button
              onClick={() => {
                sessionStorage.removeItem("admin_authenticated");
                router.push("/admin/login");
              }}
              className="btn-secondary px-6"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-6 border border-[#E6D9C8]">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
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
              <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
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
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setPaymentStatusFilter("all");
                  fetchOrders();
                }}
                className="btn-secondary w-full"
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#1F1F1F] uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6D9C8]">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[#4B4B4B]">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr
                          key={order.id}
                          className={`hover:bg-[#FAF6EF] cursor-pointer ${
                            selectedOrder?.id === order.id ? "bg-[#FAF6EF]" : ""
                          }`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1F1F1F]">
                            {order.order_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4B4B4B]">
                            <div>
                              <div className="font-medium">{order.customer_name}</div>
                              {order.customer_email && (
                                <div className="text-xs text-[#C9653B]">{order.customer_email}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4B4B4B]">
                            <span className="capitalize">{order.fulfillment_type}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#1F1F1F]">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4B4B4B]">
                            {formatDate(order.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
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
                  <h2 className="text-2xl font-bold text-[#3A2A24] mb-2">
                    Order {selectedOrder.order_number}
                  </h2>
                  <p className="text-sm text-[#4B4B4B]">
                    Created: {formatDate(selectedOrder.created_at)}
                  </p>
                </div>

                {/* Customer Info */}
                <div className="mb-6 pb-6 border-b border-[#E6D9C8]">
                  <h3 className="font-semibold text-[#1F1F1F] mb-3">Customer Details</h3>
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
                  <h3 className="font-semibold text-[#1F1F1F] mb-3">Order Items</h3>
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
                  <h3 className="font-semibold text-[#1F1F1F] mb-3">Order Summary</h3>
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
                    <h3 className="font-semibold text-[#1F1F1F] mb-3">Notes</h3>
                    <p className="text-sm text-[#4B4B4B]">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Status Updates */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
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
                    <label className="block text-sm font-semibold text-[#1F1F1F] mb-2">
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
    </div>
  );
}

