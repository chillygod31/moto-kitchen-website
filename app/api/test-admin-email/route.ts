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

    // Sample data matching the real quote request format
    const name = "Bob Junior";
    const email = "bobjunior@gmail.com";
    const phone = "+31 682244896";
    const eventType = "private";
    const eventTypeLabel = "Private";
    const eventDate = "2026-01-14";
    const guestCount = "20";
    const location = "Zoetermeer";
    const serviceType = "drop-off";
    const budget = "500-1000";
    const dietary = ["vegetarian", "halal"];
    const message = "Looking forward to working with you!";
    const howFound = "Google Search";

    // Calculate dates
    const eventDateObj = new Date(eventDate);
    const now = new Date();
    const daysUntilEvent = Math.ceil((eventDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysFromNow = daysUntilEvent;
    const isUrgent = daysUntilEvent !== null && daysUntilEvent <= 7;
    
    const shortDate = eventDateObj.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
    const formattedDate = eventDateObj.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    // Priority and response time
    let priorityLevel = "NORMAL";
    let responseTime = "Within 48 hours";
    if (daysUntilEvent <= 3) {
      priorityLevel = "HIGH";
      responseTime = "Within 12 hours";
    } else if (daysUntilEvent <= 7) {
      priorityLevel = "MEDIUM";
      responseTime = "Within 24 hours";
    }

    // Format budget
    const formatBudgetRange = (budgetValue: string) => {
      if (!budgetValue) return "Not specified";
      const ranges: Record<string, string> = {
        "under-250": "Under €250",
        "250-500": "€250–€500",
        "500-1000": "€500–€1,000",
        "1000-2500": "€1,000–€2,500",
        "2500-5000": "€2,500–€5,000",
        "over-5000": "Over €5,000",
      };
      return ranges[budgetValue] || budgetValue;
    };

    // Format budget for title (simpler format without second €)
    const formatBudgetForTitle = (budgetValue: string) => {
      if (!budgetValue) return "Not specified";
      const ranges: Record<string, string> = {
        "under-250": "Under €250",
        "250-500": "€250–500",
        "500-1000": "€500–1,000",
        "1000-2500": "€1,000–2,500",
        "2500-5000": "€2,500–5,000",
        "over-5000": "Over €5,000",
      };
      return ranges[budgetValue] || budgetValue;
    };

    // Calculate per person budget
    const calculatePerPersonBudget = (budgetValue: string, guestCount: number) => {
      if (!budgetValue || !guestCount) return null;
      const ranges: Record<string, { min: number; max: number }> = {
        "under-250": { min: 10, max: 25 },
        "250-500": { min: 10, max: 20 },
        "500-1000": { min: 25, max: 50 },
        "1000-2500": { min: 40, max: 125 },
        "2500-5000": { min: 125, max: 250 },
        "over-5000": { min: 250, max: 500 },
      };
      const range = ranges[budgetValue];
      if (!range) return null;
      return { min: range.min, max: range.max };
    };

    // Format service type
    const formatServiceType = (serviceTypeValue: string) => {
      if (!serviceTypeValue) return "Not specified";
      const serviceMap: Record<string, string> = {
        "full-catering": "Full Catering Service (We deliver, set up, serve, and clean up)",
        "drop-off": "Drop-Off Catering (We deliver fresh food, you handle serving)",
        "pickup-only": "Pick-Up Only (You collect from our location in Rotterdam)",
        "not-sure-service": "Not sure yet (We'll help you decide)",
      };
      return serviceMap[serviceTypeValue] || serviceTypeValue;
    };

    // Format dietary requirements
    const dietaryList = dietary && dietary.length > 0 
      ? dietary.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")
      : "None";

    const emailHtml = `
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
          .summary-line {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
            margin: 8px 0 0 0;
            font-weight: 400;
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
            margin: 0 0 10px 0;
            font-size: 14px;
          }
          .field:last-child {
            margin-bottom: 0;
          }
          .field-label {
            color: #666;
            font-weight: 400;
            display: inline-block;
            min-width: 120px;
          }
          .field-value {
            color: #1F1F1F;
            font-weight: 500;
          }
          .button-container {
            text-align: center; 
            margin: 32px 0 24px 0;
            padding-top: 24px;
            border-top: 1px solid #E6D9C8;
          }
          .button { 
            display: inline-block; 
            padding: 10px 20px; 
            background: #C9653B; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
            font-size: 14px;
            font-weight: 500;
            margin: 0 8px 8px 0;
          }
          .button:hover {
            background: #B8552B;
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
          .priority-badge {
            display: inline-block;
            padding: 4px 10px;
            background: #E6D9C8;
            color: #3A2A24;
            font-size: 11px;
            font-weight: 500;
            border-radius: 3px;
            margin-left: 8px;
          }
          .priority-badge.urgent {
            background: #ffc107;
            color: #3A2A24;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Quote Request • ${eventTypeLabel} • ${guestCount} pax • ${location} • ${shortDate} • ${formatBudgetForTitle(budget)} — ${name}${isUrgent ? `<span class="priority-badge urgent">URGENT — within ${daysUntilEvent} days</span>` : `<span class="priority-badge">${priorityLevel}</span><span class="priority-badge">${daysUntilEvent} days away</span>`}</h1>
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
                <span class="field-value">${shortDate} (${daysUntilEvent} days away)</span>
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
                <span class="field-value">${formatBudgetRange(budget)}</span>
              </div>
              ${(() => {
                const perPerson = calculatePerPersonBudget(budget, parseInt(guestCount));
                return perPerson ? `
                  <div class="field">
                    <span class="field-label">Approx per person:</span>
                    <span class="field-value">€${perPerson.min}–€${perPerson.max} (based on ${guestCount} guests)</span>
                  </div>
                ` : '';
              })()}
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

            ${dietaryList !== 'None' ? `
            <div class="section">
              <div class="section-header">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h2 class="section-title">Dietary Requirements</h2>
              </div>
              <div class="field">
                <span class="field-value">${dietaryList}</span>
              </div>
            </div>
            ` : ''}

            ${message ? `
            <div class="section">
              <div class="section-header">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <h2 class="section-title">Additional Message</h2>
              </div>
              <div class="field">
                <span class="field-value">${message}</span>
              </div>
            </div>
            ` : ''}

            <div class="section">
              <div class="section-header">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                <h2 class="section-title">Lead Source</h2>
              </div>
              <div class="field">
                <span class="field-value">${howFound || "Not specified"}</span>
              </div>
            </div>

            <div class="button-container">
              <a href="mailto:${email}?subject=Re: Your Quote Request for ${eventTypeLabel}" class="button">
                Reply
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Quote Request ID:</strong> TEST-${Date.now()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const fromEmail = process.env.RESEND_FROM_EMAIL || "Moto Kitchen <onboarding@resend.dev>";

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: ["chilechhaa@gmail.com"],
      replyTo: email,
      subject: `New Quote Request • Private • 20 pax • Zoetermeer • 14 Jan 2026 • €500–1,000 — Bob Junior`,
      html: emailHtml,
      text: "Test email - please view HTML version",
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
      message: "Test admin email sent to chilechhaa@gmail.com"
    });
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

