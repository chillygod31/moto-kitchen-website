/**
 * Reusable email templates for order notifications
 */

/**
 * Get the actual email recipient address
 * If TEST_EMAIL_REDIRECT is set, redirect all emails to that address for testing
 * @param originalEmail - The original recipient email
 * @returns The email address to send to (test redirect or original)
 */
export function getEmailRecipient(originalEmail: string | null | undefined): string | null {
  if (!originalEmail) return null
  
  const testEmailRedirect = process.env.TEST_EMAIL_REDIRECT
  if (testEmailRedirect) {
    return testEmailRedirect
  }
  
  return originalEmail
}

export interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  fulfillmentType: 'pickup' | 'delivery'
  scheduledFor: string | null
  deliveryAddress: string | null
  postcode: string | null
  city: string | null
  pickupAddress: string | null
  pickupInstructions: string | null
  items: Array<{
    name: string
    quantity: number
    price: number
    lineTotal: number
  }>
  subtotal: number
  deliveryFee: number
  total: number
  notes: string | null
  businessName?: string
  businessEmail?: string
  businessPhone?: string
}

/**
 * Customer order confirmation email template
 */
export function getCustomerConfirmationEmail(data: OrderEmailData): { html: string; text: string } {
  const scheduledDate = data.scheduledFor 
    ? new Date(data.scheduledFor).toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'TBD'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
          line-height: 1.6; 
          color: #1F1F1F; 
          margin: 0; 
          padding: 0; 
          background: #FAF6EF;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
        }
        .header { 
          background: #3A2A24; 
          color: white; 
          padding: 24px 32px; 
          text-align: center; 
        }
        .header h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }
        .content { 
          padding: 32px; 
        }
        .order-number {
          font-size: 28px;
          font-weight: bold;
          color: #C9653B;
          text-align: center;
          margin: 24px 0;
        }
        .section {
          margin: 24px 0;
          padding: 20px;
          background: #FAF6EF;
          border-radius: 8px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #3A2A24;
          margin-bottom: 12px;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #E6D9C8;
        }
        .item-row:last-child {
          border-bottom: none;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 18px;
          font-weight: bold;
          padding: 16px 0;
          margin-top: 16px;
          border-top: 2px solid #3A2A24;
        }
        .footer {
          padding: 24px 32px;
          text-align: center;
          color: #666;
          font-size: 12px;
          background: #FAF6EF;
          border-top: 1px solid #E6D9C8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi ${data.customerName},</p>
          <p>Thank you for your order! We've received it and will prepare it for you.</p>
          
          <div class="order-number">Order #${data.orderNumber}</div>
          
          <div class="section">
            <div class="section-title">Pickup Details</div>
            <p><strong>Date & Time:</strong> ${scheduledDate}</p>
            ${data.fulfillmentType === 'pickup' && data.pickupAddress ? `
              <p><strong>Address:</strong> ${data.pickupAddress}</p>
              ${data.pickupInstructions ? `<p><strong>Instructions:</strong> ${data.pickupInstructions}</p>` : ''}
            ` : ''}
            ${data.fulfillmentType === 'delivery' && data.deliveryAddress ? `
              <p><strong>Delivery Address:</strong> ${data.deliveryAddress}, ${data.postcode} ${data.city}</p>
            ` : ''}
          </div>
          
          <div class="section">
            <div class="section-title">Order Items</div>
            ${data.items.map(item => `
              <div class="item-row">
                <span>${item.name} × ${item.quantity}</span>
                <span>€${item.lineTotal.toFixed(2)}</span>
              </div>
            `).join('')}
            ${data.deliveryFee > 0 ? `
              <div class="item-row">
                <span>Delivery Fee</span>
                <span>€${data.deliveryFee.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-row">
              <span>Total</span>
              <span>€${data.total.toFixed(2)}</span>
            </div>
          </div>
          
          ${data.notes ? `
            <div class="section">
              <div class="section-title">Special Notes</div>
              <p>${data.notes}</p>
            </div>
          ` : ''}
          
          <p>If you have any questions, please contact us at ${data.businessEmail || 'contact@motokitchen.nl'} or ${data.businessPhone || ''}.</p>
          
          <p>We look forward to serving you!</p>
          <p><strong>The ${data.businessName || 'Moto Kitchen'} Team</strong></p>
        </div>
        <div class="footer">
          <p><strong>${data.businessName || 'Moto Kitchen'}</strong> | East African Catering</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Order Confirmed!

Hi ${data.customerName},

Thank you for your order! We've received it and will prepare it for you.

Order #${data.orderNumber}

PICKUP DETAILS:
Date & Time: ${scheduledDate}
${data.fulfillmentType === 'pickup' && data.pickupAddress ? `Address: ${data.pickupAddress}` : ''}
${data.fulfillmentType === 'delivery' && data.deliveryAddress ? `Delivery Address: ${data.deliveryAddress}, ${data.postcode} ${data.city}` : ''}

ORDER ITEMS:
${data.items.map(item => `${item.name} × ${item.quantity} - €${item.lineTotal.toFixed(2)}`).join('\n')}
${data.deliveryFee > 0 ? `Delivery Fee - €${data.deliveryFee.toFixed(2)}` : ''}
Total: €${data.total.toFixed(2)}

${data.notes ? `Special Notes: ${data.notes}` : ''}

If you have any questions, please contact us at ${data.businessEmail || 'contact@motokitchen.nl'}.

We look forward to serving you!

The ${data.businessName || 'Moto Kitchen'} Team
  `

  return { html, text }
}

/**
 * Admin order alert email template
 */
export function getAdminAlertEmail(data: OrderEmailData): { html: string; text: string } {
  const scheduledDate = data.scheduledFor 
    ? new Date(data.scheduledFor).toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'TBD'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
          line-height: 1.6; 
          color: #1F1F1F; 
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
        }
        .header { 
          background: #C9653B; 
          color: white; 
          padding: 24px 32px; 
        }
        .content { 
          padding: 32px; 
        }
        .order-number {
          font-size: 24px;
          font-weight: bold;
          color: #C9653B;
        }
        .section {
          margin: 20px 0;
          padding: 16px;
          background: #FAF6EF;
          border-radius: 8px;
        }
        .urgent {
          background: #ffc107;
          padding: 12px;
          border-radius: 8px;
          margin: 16px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🆕 New Order Received</h1>
        </div>
        <div class="content">
          <div class="order-number">Order #${data.orderNumber}</div>
          
          <div class="section">
            <h3>Customer Details</h3>
            <p><strong>Name:</strong> ${data.customerName}</p>
            <p><strong>Email:</strong> ${data.customerEmail}</p>
            <p><strong>Phone:</strong> ${data.customerPhone}</p>
          </div>
          
          <div class="section">
            <h3>Order Details</h3>
            <p><strong>Scheduled for:</strong> ${scheduledDate}</p>
            <p><strong>Type:</strong> ${data.fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}</p>
            ${data.fulfillmentType === 'delivery' && data.deliveryAddress ? `
              <p><strong>Delivery Address:</strong> ${data.deliveryAddress}, ${data.postcode} ${data.city}</p>
            ` : ''}
            <p><strong>Total:</strong> €${data.total.toFixed(2)}</p>
          </div>
          
          <div class="section">
            <h3>Items</h3>
            ${data.items.map(item => `
              <p>${item.name} × ${item.quantity} - €${item.lineTotal.toFixed(2)}</p>
            `).join('')}
          </div>
          
          ${data.notes ? `
            <div class="urgent">
              <strong>Special Notes:</strong> ${data.notes}
            </div>
          ` : ''}
          
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/orders">View in Admin Dashboard</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
🆕 New Order Received

Order #${data.orderNumber}

CUSTOMER DETAILS:
Name: ${data.customerName}
Email: ${data.customerEmail}
Phone: ${data.customerPhone}

ORDER DETAILS:
Scheduled for: ${scheduledDate}
Type: ${data.fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}
${data.fulfillmentType === 'delivery' && data.deliveryAddress ? `Delivery Address: ${data.deliveryAddress}, ${data.postcode} ${data.city}` : ''}
Total: €${data.total.toFixed(2)}

ITEMS:
${data.items.map(item => `${item.name} × ${item.quantity} - €${item.lineTotal.toFixed(2)}`).join('\n')}

${data.notes ? `SPECIAL NOTES: ${data.notes}` : ''}

View in Admin Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/orders
  `

  return { html, text }
}

