'use client';

import { useState, useEffect } from 'react';

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  session_id: string;
  order_id: string | null;
  error_message: string;
  metadata: any;
  created_at: string;
  orders?: {
    order_number: string;
    customer_name: string;
    customer_email: string;
    total: number;
    payment_status: string;
  } | null;
}

export default function RecoveryPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/admin/alerts?acknowledged=false', {
        credentials: 'include'
      });
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (sessionId: string) => {
    setProcessing(sessionId);
    try {
      const res = await fetch('/api/admin/recover-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ session_id: sessionId, action: 'create_order' })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        alert(`Order recovered successfully! Order #${result.order_number}`);
        fetchAlerts();
      } else {
        alert(`Recovery failed: ${result.error || result.message}`);
      }
    } catch (error) {
      alert('Recovery failed. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleRefund = async (sessionId: string) => {
    if (!confirm('Are you sure you want to issue a refund?')) return;
    
    setProcessing(sessionId);
    try {
      const res = await fetch('/api/admin/recover-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ session_id: sessionId, action: 'refund' })
      });
      
      if (res.ok) {
        alert('Refund issued successfully!');
        fetchAlerts();
      } else {
        alert('Refund failed. Please check Stripe dashboard.');
      }
    } catch (error) {
      alert('Refund failed. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="p-8">Loading alerts...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Payment Recovery</h1>
      
      {alerts.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-green-800">✅ No unresolved payment issues</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className="bg-white border-2 border-red-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-red-800">
                    {alert.alert_type === 'webhook_failure' 
                      ? '🚨 Payment Completed - Order Failed'
                      : '⚠️ Order Expired After Payment'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  alert.severity === 'critical' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-2 mb-4 text-sm">
                {alert.orders?.order_number && (
                  <div className="mb-3">
                    <strong>Order:</strong>
                    <a 
                      href={`/admin/orders?search=${alert.orders.order_number}`}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      #{alert.orders.order_number}
                    </a>
                    {alert.orders.customer_name && (
                      <span className="ml-2 text-gray-600">• {alert.orders.customer_name}</span>
                    )}
                    {alert.orders.total && (
                      <span className="ml-2 text-gray-600">• €{alert.orders.total.toFixed(2)}</span>
                    )}
                  </div>
                )}
                <div>
                  <strong>Session ID:</strong>
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded">
                    {alert.session_id}
                  </code>
                </div>
                {alert.metadata?.amount && (
                  <div>
                    <strong>Amount:</strong>
                    <span className="ml-2">€{alert.metadata.amount.toFixed(2)}</span>
                  </div>
                )}
                <div>
                  <strong>Error:</strong>
                  <span className="ml-2 text-red-600">{alert.error_message}</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleRecover(alert.session_id)}
                  disabled={processing === alert.session_id}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing === alert.session_id ? 'Processing...' : 'Create Order + Send Email'}
                </button>
                <button
                  onClick={() => handleRefund(alert.session_id)}
                  disabled={processing === alert.session_id}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Issue Refund
                </button>
                <button
                  onClick={() => window.open(
                    `https://dashboard.stripe.com/test/payments/${alert.session_id}`,
                    '_blank'
                  )}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  View in Stripe
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

