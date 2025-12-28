import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not set" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    // Sample data for admin notification email
    const name = "Chi Ha";
    const email = "chilechhaa@gmail.com";
    const phone = "+31 678876580";
    const eventType = "wedding";
    const eventTypeLabel = "Wedding";
    const guestCount = "75";
    const location = "Amsterdam";
    const serviceType = "full-catering";
    const budget = "2500-5000";
    const dietary = "Vegetarian, Vegan";
    const message = "We would love to have Susan and her team cater our special day!";
    const howFound = "Google Search";
    const eventDate = "2026-01-09";
    
    // Calculate days until event
    const testEventDate = new Date(eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    testEventDate.setHours(0, 0, 0, 0);
    const daysUntilEvent = Math.ceil((testEventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Helper function to add ordinal suffix
    const getOrdinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    // Format dates
    const shortDate = new Date(eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const longDate = (() => {
      const date = new Date(eventDate);
      const dayOfWeek = date.toLocaleDateString('en-GB', { weekday: 'long' });
      const day = date.getDate();
      const month = date.toLocaleDateString('en-GB', { month: 'long' });
      const year = date.getFullYear();
      return `${dayOfWeek}, ${day}${getOrdinalSuffix(day)} ${month} ${year}`;
    })();

    // Determine urgency
    const isUrgent = daysUntilEvent <= 14;
    const priorityLevel = isUrgent ? "URGENT" : "NORMAL";
    const priorityBadge = isUrgent 
      ? `<span class="priority-badge urgent">URGENT — within ${daysUntilEvent} days</span>`
      : `<span class="priority-badge">${priorityLevel}</span><span class="priority-badge">${daysUntilEvent} days away</span>`;

    // Format budget
    const budgetDisplay = budget === "2500-5000" ? "€2,500–5,000" : budget;

    // Format service type
    const formatServiceType = (serviceType: string) => {
      const serviceMap: Record<string, string> = {
        "full-catering": "Full Catering Service (We deliver, set up, serve, and clean up)",
        "drop-off": "Drop-Off Catering (We deliver fresh food, you handle serving)",
        "pickup-only": "Pick-Up Only (You collect from our location in Rotterdam)",
        "not-sure-service": "Not sure yet (We'll help you decide)",
      };
      return serviceMap[serviceType] || serviceType;
    };

    const adminEmailHtml = `
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
            padding: 0;
          }
          .header { 
            background: #3A2A24; 
            color: white; 
            padding: 24px 32px; 
            text-align: left; 
          }
          .header h1 {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 8px 0;
            letter-spacing: 0.3px;
          }
          .submitted {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            margin: 12px 0 0 0;
          }
          .content { 
            padding: 32px; 
            background: white; 
          }
          .section { 
            margin: 0 0 28px 0;
            padding: 0 0 24px 0;
            border-bottom: 1px solid #E6D9C8;
          }
          .section:last-child {
            border-bottom: none;
          }
          .section-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
          }
          .section-icon {
            width: 18px;
            height: 18px;
            color: #666;
            flex-shrink: 0;
          }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #3A2A24;
            margin: 0;
            text-transform: none;
            letter-spacing: 0;
          }
          .field {
            display: grid;
            grid-template-columns: 220px 1fr;
            gap: 0;
            margin: 0 0 10px 0;
            font-size: 14px;
          }
          .field:last-child {
            margin-bottom: 0;
          }
          .field-label {
            color: #666;
            font-weight: 400;
          }
          .field-value {
            color: #1F1F1F;
            font-weight: 500;
            min-width: 0;
            word-wrap: break-word;
          }
          @media only screen and (max-width: 600px) {
            .field {
              grid-template-columns: 100px 1fr;
              font-size: 13px;
            }
            .field-label {
              font-size: 12px;
            }
            .field-value {
              font-size: 13px;
            }
          }
          .button-container {
            text-align: center; 
            margin: 32px 0 24px 0;
            padding-top: 24px;
            border-top: 1px solid #E6D9C8;
          }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #FAF6F0; 
            color: #1F1F1F; 
            text-decoration: none; 
            border: 1px solid #E6D9C8;
            border-radius: 4px; 
            font-size: 14px;
            font-weight: 500;
            margin: 0 8px 8px 0;
          }
          .button:hover {
            background: #F5F1E8;
          }
          .priority-badge {
            display: inline-block;
            padding: 4px 10px;
            background: #E6D9C8;
            color: #3A2A24;
            font-size: 11px;
            font-weight: 500;
            border-radius: 3px;
            margin-left: 8px;
            margin-top: 4px;
            white-space: nowrap;
          }
          .priority-badge.urgent {
            background: #ffc107;
            color: #3A2A24;
          }
          .footer { 
            padding: 24px 32px; 
            text-align: center; 
            color: #666; 
            font-size: 12px; 
            background: #FAF6EF;
            border-top: 1px solid #E6D9C8;
          }
          a {
            color: #C9653B;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
        <div class="header">
            <h1>New Quote Request • ${eventTypeLabel} • ${guestCount} pax • ${location} • ${shortDate} • ${budgetDisplay} — ${name}${isUrgent ? `<span class="priority-badge urgent">URGENT — within ${daysUntilEvent} days</span>` : `<span class="priority-badge">${priorityLevel}</span><span class="priority-badge">${daysUntilEvent} days away</span>`}</h1>
            <p class="submitted">Submitted: ${new Date().toLocaleString('en-NL', { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>
        
        <div class="content">
            <div class="section">
              <div class="section-header">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <h2 class="section-title">Event Details</h2>
              </div>
              <div class="field">
                <span class="field-label">Event type:</span>
                <span class="field-value">${eventTypeLabel}</span>
              </div>
              <div class="field">
                <span class="field-label">Date:</span>
                <span class="field-value">${longDate}${daysUntilEvent !== null ? ` (${daysUntilEvent} days away)` : ''}</span>
              </div>
              <div class="field">
                <span class="field-label">Guests:</span>
                <span class="field-value">${guestCount}</span>
              </div>
              <div class="field">
                <span class="field-label">City:</span>
                <span class="field-value">${location}</span>
              </div>
              <div class="field">
                <span class="field-label">Service style:</span>
                <span class="field-value">${formatServiceType(serviceType)}</span>
              </div>
          </div>

          <div class="section">
              <div class="section-header">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
                <h2 class="section-title">Budget</h2>
              </div>
              <div class="field">
                <span class="field-label">Budget range:</span>
                <span class="field-value">${budgetDisplay}</span>
              </div>
          </div>

          <div class="section">
              <div class="section-header">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <h2 class="section-title">Contact</h2>
              </div>
              <div class="field">
                <span class="field-label">Name:</span>
                <span class="field-value">${name}</span>
              </div>
              <div class="field">
                <span class="field-label">Email:</span>
                <span class="field-value"><a href="mailto:${email}">${email}</a></span>
              </div>
              <div class="field">
                <span class="field-label">Phone:</span>
                <span class="field-value"><a href="tel:${phone}">${phone}</a></span>
              </div>
          </div>

          <div class="section">
              <div class="section-header">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h2 class="section-title">Dietary Requirements</h2>
              </div>
              <div class="field">
                <span class="field-value">${dietary}</span>
          </div>
          </div>

          <div class="section">
              <div class="section-header">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2h-3l-4 4z"></path>
                </svg>
                <h2 class="section-title">Additional Message</h2>
              </div>
              <div class="field">
                <span class="field-value">${message}</span>
              </div>
          </div>

          <div class="section">
              <div class="section-header">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
                <h2 class="section-title">Lead Source</h2>
              </div>
              <div class="field">
                <span class="field-value">${howFound || "Not specified"}</span>
              </div>
          </div>

            <div class="button-container">
            <a href="mailto:${email}?subject=Re: Your Quote Request for ${eventTypeLabel}" class="button">
                Reply to customer
            </a>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0;"><strong>Moto Kitchen</strong> | East African Catering</p>
          <p style="margin: 8px 0 0 0;"><a href="mailto:contact@motokitchen.nl">contact@motokitchen.nl</a></p>
        </div>
        </div>
      </body>
      </html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "Moto Kitchen <contact@motokitchen.nl>",
      to: ["chilechhaa@gmail.com"],
      replyTo: "contact@motokitchen.nl",
      subject: `New Quote Request • ${eventTypeLabel} • ${guestCount} pax • ${location} • ${shortDate} • ${budgetDisplay} — ${name}`,
      html: adminEmailHtml,
    });

    if (emailError) {
      console.error("Email error:", emailError);
      return NextResponse.json(
        { error: "Failed to send email", details: emailError },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Test admin notification email sent to chilechhaa@gmail.com"
    });
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
