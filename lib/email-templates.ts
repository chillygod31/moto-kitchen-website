import { MotoEmailLayout } from '@/lib/email-layout'

export function getEmailRecipient(originalEmail: string | null | undefined): string | null {
  if (!originalEmail) return null

  const testEmailRedirect = process.env.TEST_EMAIL_REDIRECT
  if (testEmailRedirect) {
    return testEmailRedirect
  }

  return originalEmail
}

export interface OrderItemSnapshot {
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  notes?: string | null
}

export interface OrderEmailData {
  orderNumber: string
  orderId?: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  fulfillmentType: 'pickup' | 'delivery'
  scheduledFor: string | null
  deliveryAddress?: string | null
  postcode?: string | null
  city?: string | null
  pickupAddress?: string | null
  pickupInstructions?: string | null
  items: OrderItemSnapshot[]
  subtotal: number
  deliveryFee: number
  total: number
  vatTotal?: number
  notes?: string | null
  businessName?: string
  businessEmail?: string
  businessPhone?: string
  orderUrl?: string
  adminUrl?: string
  kitchenTicketUrl?: string
  slotId?: string | null
  status?: 'Paid' | 'Pending'
  additionalMessage?: string
}

const fmtMoney = (value = 0) => `€${value.toFixed(2)}`
const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'TBD'

function renderItemsTable(items: OrderItemSnapshot[]) {
  if (!items || items.length === 0) {
    return `<p style="margin:10px 0 0; font-size:13px; color:#6b5b53;">Items not available — view in dashboard.</p>`
  }

  return `
    <table class="table" role="presentation">
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th style="text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item) => `
              <tr>
                <td>
                  ${item.name}
                  ${item.notes ? `<div style="font-size:12px; color:#6b5b53; margin-top:4px;">${item.notes}</div>` : ''}
                </td>
                <td>${item.quantity}</td>
                <td style="text-align:right;">${fmtMoney(item.lineTotal)}</td>
              </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  `
}

function renderTotals({ subtotal, deliveryFee, vatTotal, total }: OrderEmailData) {
  return `
    <div class="totals">
      <div class="totals-row"><span>Subtotal</span><span>${fmtMoney(subtotal)}</span></div>
      ${deliveryFee ? `<div class="totals-row"><span>Delivery fee</span><span>${fmtMoney(deliveryFee)}</span></div>` : ''}
      ${vatTotal ? `<div class="totals-row"><span>VAT</span><span>${fmtMoney(vatTotal)}</span></div>` : ''}
      <div class="totals-row total"><span>Total</span><span>${fmtMoney(total)}</span></div>
    </div>
  `
}

export function getCustomerConfirmationEmail(data: OrderEmailData): { html: string; text: string } {
  const preheader = `${data.fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'} • ${fmtDate(data.scheduledFor)} • Total ${fmtMoney(
    data.total,
  )}`
  const summaryStrip = `
    <div class="grid-3">
      <span class="pill">Order #${data.orderNumber}</span>
      <span class="pill">${fmtDate(data.scheduledFor)}</span>
      <span class="pill">${fmtMoney(data.total)}</span>
    </div>
  `
  const fulfillmentCard =
    data.fulfillmentType === 'pickup'
      ? `
        <div class="card">
          <h3>Pickup details</h3>
          <div style="font-size:13px; line-height:1.6;">
            <div><strong>Address:</strong> ${data.pickupAddress || 'Moto Kitchen, Het IJ, Amsterdam'}</div>
            ${data.pickupInstructions ? `<div><strong>Instructions:</strong> ${data.pickupInstructions}</div>` : ''}
            <div><strong>Pickup time:</strong> ${fmtDate(data.scheduledFor)}</div>
          </div>
        </div>`
      : `
        <div class="card">
          <h3>Delivery details</h3>
          <div style="font-size:13px; line-height:1.6;">
            <div><strong>Address:</strong> ${data.deliveryAddress || ''} ${data.postcode || ''} ${data.city || ''}</div>
            <div><strong>Delivery time:</strong> ${fmtDate(data.scheduledFor)}</div>
            <div><strong>Delivery fee:</strong> ${fmtMoney(data.deliveryFee)}</div>
          </div>
        </div>`

  const itemsCard = `
    <div class="card">
      <h3>Order items</h3>
      ${renderItemsTable(data.items)}
      ${renderTotals(data)}
    </div>
  `

  const cta =
    data.orderUrl && data.orderUrl.length
      ? `<div class="cta-wrap"><a class="btn" href="${data.orderUrl}">View your order</a></div>`
      : ''

  const footerNote = `<p style="font-size:13px; color:#6b5b53; margin-top:6px;">If you have any questions, please contact us at contact@motokitchen.nl.</p>`

  const html = MotoEmailLayout({
    title: 'Order confirmed',
    preheader,
    children: `
      ${summaryStrip}
      ${fulfillmentCard}
      ${itemsCard}
      ${footerNote}
      ${cta}
    `,
  })

  const text = `
Order confirmed!

Order #${data.orderNumber}
${fmtDate(data.scheduledFor)}

Subtotal: ${fmtMoney(data.subtotal)}
${data.deliveryFee ? `Delivery fee: ${fmtMoney(data.deliveryFee)}\n` : ''}${
    data.vatTotal ? `VAT: ${fmtMoney(data.vatTotal)}\n` : ''
  }Total: ${fmtMoney(data.total)}

Need to change something? Reply to this email as soon as possible.
If you have any questions, please contact us at contact@motokitchen.nl.
`

  return { html, text }
}

export function getAdminAlertEmail(data: OrderEmailData): { html: string; text: string } {
  const targetUrl = data.adminUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/orders`
  const preheader = `Total ${fmtMoney(data.total)} • ${data.customerName} • ${data.customerPhone || ''}`
  const summaryStrip = `
    <div class="grid-3">
      <span class="pill">Order #${data.orderNumber}</span>
      <span class="pill">${fmtDate(data.scheduledFor)}</span>
      <span class="pill">${fmtMoney(data.total)}</span>
    </div>
  `

  const timingCard = `
    <div class="card">
      <h3>Timing & type</h3>
      <div style="font-size:13px; line-height:1.6;">
        <div><strong>Scheduled:</strong> ${fmtDate(data.scheduledFor)}</div>
        <div><strong>Type:</strong> ${data.fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}</div>
        ${data.slotId ? `<div><strong>Slot ID:</strong> ${data.slotId}</div>` : ''}
        ${data.notes ? `<div><strong>Notes / Allergies:</strong> ${data.notes}</div>` : ''}
      </div>
    </div>
  `

  const customerCard = `
    <div class="card">
      <h3>Customer</h3>
      <div style="font-size:13px; line-height:1.6;">
        <div><strong>Name:</strong> ${data.customerName}</div>
        ${data.customerPhone ? `<div><strong>Phone:</strong> ${data.customerPhone}</div>` : ''}
        ${data.customerEmail ? `<div><strong>Email:</strong> ${data.customerEmail}</div>` : ''}
        ${data.fulfillmentType === 'delivery'
          ? `<div><strong>Address:</strong> ${data.deliveryAddress || ''} ${data.postcode || ''} ${data.city || ''}</div>`
          : ''}
      </div>
    </div>
  `

  const itemsCard = `
    <div class="card">
      <h3>Items</h3>
      ${renderItemsTable(data.items)}
      ${renderTotals(data)}
    </div>
  `

  const cta = `
    <div class="cta-wrap">
      ${data.adminUrl ? `<a class="btn" href="${data.adminUrl}">Open in Admin Dashboard</a>` : ''}
      ${data.kitchenTicketUrl ? `<a class="btn" href="${data.kitchenTicketUrl}">Print kitchen ticket</a>` : ''}
    </div>
  `

  const html = MotoEmailLayout({
    title: 'New order received',
    preheader,
    statusBadge: data.status ? { label: data.status, tone: data.status === 'Paid' ? 'success' : 'warning' } : undefined,
    children: `
      ${summaryStrip}
      ${timingCard}
      ${customerCard}
      ${itemsCard}
      ${cta}
    `,
  })

  const text = `
New order received

Order #${data.orderNumber}
${fmtDate(data.scheduledFor)}

Customer: ${data.customerName}
Phone: ${data.customerPhone || 'N/A'}
Email: ${data.customerEmail || 'N/A'}

Items:
${data.items.map((item) => `${item.name} × ${item.quantity} - ${fmtMoney(item.lineTotal)}`).join('\n')}

Total: ${fmtMoney(data.total)}

View in dashboard: ${targetUrl}
`

  return { html, text }
}
