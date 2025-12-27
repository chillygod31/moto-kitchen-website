import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerAdminClient } from "@/lib/supabase/server-admin";
import { rateLimitMiddleware, rateLimitConfigs } from '@/lib/rate-limit'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

export async function POST(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('POST', '/api/contact', context)
  
  // Apply rate limiting
  const rateLimit = rateLimitMiddleware(request, rateLimitConfigs.quoteSubmit)
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded for contact form', context)
    return rateLimit.response as NextResponse
  }

  try {
    // Check Supabase environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('Supabase environment variables not set', undefined, {
        ...context,
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      });
      // Continue anyway - we'll try to save but it will fail gracefully
    }
    
    // Initialize Resend only at runtime, not during build
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      logger.error('RESEND_API_KEY is not set', undefined, context)
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }
    
    const resend = new Resend(apiKey);
    
    const body = await request.json();
    
    const {
      name,
      email,
      phone,
      eventType,
      eventDate,
      guestCount,
      location,
      serviceType,
      dietary,
      message,
      howFound,
      budget,
    } = body;

    // Validate required fields (budget is conditionally required)
    const isBudgetRequired = serviceType !== "pickup-only" && serviceType !== "not-sure-service";
    
    if (!name || !email || !phone || !eventType || !guestCount || !location || !serviceType || (isBudgetRequired && !budget)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate event date (cannot be in the past)
    if (eventDate && eventDate !== "Flexible") {
      const selectedDate = new Date(eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (isNaN(selectedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid event date format" },
          { status: 400 }
        );
      }
      
      if (selectedDate < today) {
        return NextResponse.json(
          { error: "Event date cannot be in the past" },
          { status: 400 }
        );
      }
    }

    // Save to database FIRST (so we don't lose data if email fails)
    let quoteRequest = null;
    try {
      const supabase = createServerAdminClient();
      const { data, error: dbError } = await supabase
        .from('quote_requests')
        .insert({
          name,
          email,
          phone,
          event_type: eventType,
          event_date: eventDate || null,
          guest_count: parseInt(guestCount),
          location,
          service_type: serviceType || null,
          dietary_requirements: dietary || [],
          message: message || null,
          how_found: howFound || null,
          budget_range: budget || null,
          status: 'new',
        })
        .select()
        .single();

      if (dbError) {
        logger.api.error('POST', '/api/contact', dbError as Error, {
          ...context,
          errorDetails: {
            message: dbError.message,
            details: dbError.details,
            hint: dbError.hint,
            code: dbError.code
          }
        });
        captureException(dbError as Error, context);
        // Still continue to send email, but log the error clearly
      } else {
        quoteRequest = data;
        logger.info("Quote request saved successfully", { ...context, quoteRequestId: quoteRequest.id });
      }
    } catch (dbError: any) {
      logger.api.error('POST', '/api/contact', dbError, context);
      captureException(dbError, context);
      // Continue to send email even if database fails
    }

    // Format event date for display
    const formattedDate = eventDate && eventDate !== "Flexible" 
      ? new Date(eventDate).toLocaleDateString('en-NL', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : "Flexible";

    // Calculate days until event and days from now
    const daysUntilEvent = eventDate && eventDate !== "Flexible"
      ? Math.ceil((new Date(eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    const daysFromNow = daysUntilEvent;

    // Format date as "14 Jan 2026" for title and subject line
    const shortDate = eventDate && eventDate !== "Flexible"
      ? new Date(eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : "Flexible";

    // Check if date is urgent (within 14 days)
    const isUrgent = eventDate && eventDate !== "Flexible" 
      ? daysUntilEvent !== null && daysUntilEvent <= 14
      : false;

    // Determine priority level and response time
    let priorityLevel = "NORMAL";
    let responseTime = "Within 48 hours";
    if (daysUntilEvent !== null && daysUntilEvent <= 14) {
      priorityLevel = "URGENT";
      responseTime = "Within 24 hours";
    }

    const dietaryList = dietary?.length > 0 
      ? dietary.join(", ") 
      : "None specified";

    const eventTypeLabel = eventType.charAt(0).toUpperCase() + eventType.slice(1).replace(/-/g, " ");
    
    // Format budget range for display
    const formatBudgetRange = (budgetRange: string | null) => {
      if (!budgetRange) return "Not specified";
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

    // Format budget range for subject line (with en dash)
    const formatBudgetForSubject = (budgetRange: string | null) => {
      if (!budgetRange || budgetRange === "not-sure") return "Budget TBD";
      const budgetMap: Record<string, string> = {
        "250-500": "€250–500",
        "500-1000": "€500–1,000",
        "1000-2500": "€1,000–2,500",
        "2500-5000": "€2,500–5,000",
        "5000+": "€5,000+",
      };
      return budgetMap[budgetRange] || budgetRange.replace(/-/g, "–");
    };

    // Format budget for title (simpler format without second €)
    const formatBudgetForTitle = (budgetRange: string | null) => {
      if (!budgetRange || budgetRange === "not-sure") return "Budget TBD";
      const budgetMap: Record<string, string> = {
        "250-500": "€250–500",
        "500-1000": "€500–1,000",
        "1000-2500": "€1,000–2,500",
        "2500-5000": "€2,500–5,000",
        "5000+": "€5,000+",
      };
      return budgetMap[budgetRange] || budgetRange.replace(/-/g, "–");
    };

    // Format event type to short form for subject line
    const formatEventTypeShort = (eventTypeValue: string) => {
      const eventTypeMap: Record<string, string> = {
        "private": "Private",
        "corporate": "Corporate",
        "wedding": "Wedding",
        "pickup-only": "Pick-Up",
        "pickup-delivery": "Pick-Up",
        "other": "Other",
      };
      return eventTypeMap[eventTypeValue] || eventTypeValue.charAt(0).toUpperCase() + eventTypeValue.slice(1).replace(/-/g, " ");
    };

    // Calculate per-person budget from customer's selected budget range
    const calculatePerPersonBudget = (budgetRange: string | null, guestCount: number) => {
      if (!budgetRange || budgetRange === "not-sure" || guestCount <= 0) return null;
      
      const budgetMap: Record<string, { min: number; max: number }> = {
        "250-500": { min: 250, max: 500 },
        "500-1000": { min: 500, max: 1000 },
        "1000-2500": { min: 1000, max: 2500 },
        "2500-5000": { min: 2500, max: 5000 },
        "5000+": { min: 5000, max: 10000 }, // Use 10000 as max for 5000+
      };
      
      const budgetValues = budgetMap[budgetRange];
      if (!budgetValues) return null;
      
      const perPersonMin = Math.round(budgetValues.min / guestCount);
      const perPersonMax = Math.round(budgetValues.max / guestCount);
      
      return { min: perPersonMin, max: perPersonMax };
    };

    // Format service type for display
    const formatServiceType = (serviceTypeValue: string | null) => {
      if (!serviceTypeValue) return "Not specified";
      const serviceMap: Record<string, string> = {
        "full-catering": "Full Catering Service (We deliver, set up, serve, and clean up)",
        "drop-off": "Drop-Off Catering (We deliver fresh food, you handle serving)",
        "pickup-only": "Pick-Up Only (You collect from our location in Rotterdam)",
        "not-sure-service": "Not sure yet (We'll help you decide)",
      };
      return serviceMap[serviceTypeValue] || serviceTypeValue;
    };

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
            <h1>New Quote Request • ${eventTypeLabel} • ${guestCount} pax • ${location} • ${shortDate} • ${formatBudgetForTitle(budget)} — ${name}${isUrgent && daysUntilEvent !== null ? `<span class="priority-badge urgent">URGENT — within ${daysUntilEvent} days</span>` : daysUntilEvent !== null ? `<span class="priority-badge">${priorityLevel}</span><span class="priority-badge">${daysUntilEvent} days away</span>` : ''}</h1>
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
                <span class="field-value">${shortDate}${daysUntilEvent !== null ? ` (${daysUntilEvent} days away)` : ''}</span>
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
                <span class="field-value">${budget ? formatBudgetRange(budget) : 'Not specified'}</span>
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

            ${dietaryList !== 'None specified' ? `
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
          <p><strong>Quote Request ID:</strong> ${quoteRequest?.id || 'N/A'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
NEW QUOTE REQUEST${isUrgent && daysUntilEvent !== null ? ` [URGENT — within ${daysUntilEvent} days]` : daysUntilEvent !== null ? ` [${priorityLevel}] [${daysUntilEvent} days away]` : ''}
${'='.repeat(60)}

${eventTypeLabel} • ${guestCount} pax • ${location} • ${shortDate} • ${formatBudgetForTitle(budget)} — ${name}
Submitted: ${new Date().toLocaleString('en-NL', { dateStyle: 'medium', timeStyle: 'short' })}

${'='.repeat(60)}

EVENT DETAILS
Event type: ${eventTypeLabel}
Date: ${shortDate}${daysUntilEvent !== null ? ` (${daysUntilEvent} days away)` : ''}
Guests: ${guestCount}
City: ${location}
Service style: ${formatServiceType(serviceType)}

BUDGET
Budget range: ${budget ? formatBudgetRange(budget) : 'Not specified'}
${(() => {
  const perPerson = calculatePerPersonBudget(budget, parseInt(guestCount));
  return perPerson ? `Approx per person: €${perPerson.min}–€${perPerson.max} (based on ${guestCount} guests)\n` : '';
})()}

CONTACT
Name: ${name}
Email: ${email}
Phone: ${phone}

${dietaryList !== 'None specified' ? `DIETARY REQUIREMENTS\n${dietaryList}\n\n` : ''}
${message ? `ADDITIONAL MESSAGE\n${message}\n\n` : ''}
LEAD SOURCE
${howFound || "Not specified"}

${'='.repeat(60)}
Quote Request ID: ${quoteRequest?.id || 'N/A'}
    `;

    // Build subject line
    const eventTypeShort = formatEventTypeShort(eventType);
    const budgetDisplay = formatBudgetForSubject(budget);
    const locationDisplay = location; // Use location as-is (could extract city if needed)
    
    let subject: string;
    subject = `New Quote Request • ${eventTypeShort} • ${guestCount} pax • ${locationDisplay} • ${shortDate} • ${budgetDisplay} — ${name}`;

    // Send admin notification email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "Moto Kitchen Website <onboarding@resend.dev>",
      to: ["chilechhaa@gmail.com"],
      replyTo: email,
      subject: subject,
      html: emailHtml,
      text: emailText,
    });

    if (emailError) {
      logger.api.error('POST', '/api/contact', emailError as Error, { ...context, quoteRequestId: quoteRequest?.id });
      captureException(emailError as Error, { ...context, quoteRequestId: quoteRequest?.id });
      // Don't fail the request if email fails - data is already saved
    }

    // Auto-reply email to customer (disabled by default - enable via ENABLE_AUTO_REPLY env var)
    const enableAutoReply = process.env.ENABLE_AUTO_REPLY === "true";
    if (enableAutoReply) {
      // Format budget range for display
      const customerBudgetDisplay = budget ? formatBudgetRange(budget) : "Not specified";
      
      // Format event date for customer email
      const customerDateDisplay = eventDate && eventDate !== "Flexible"
        ? formattedDate
        : "Flexible (to be confirmed)";

      // Determine event type wording for greeting
      const isPickupOnly = eventType === "pickup-only" || eventType === "pickup-delivery";
      const eventTypeWording = eventType === "wedding" 
        ? "wedding" 
        : eventType === "private" || eventType === "corporate" || eventType === "other"
        ? "event"
        : null; // null for pickup-only
      
      // Determine quote response time based on days until event
      const quoteResponseTime = daysUntilEvent !== null && daysUntilEvent <= 14 ? "24 hours" : "24 to 48 hours";

      // Read logo and convert to base64
      // Use hosted logo URL instead of data URI for better mobile compatibility
      // Data URIs are often blocked by Gmail and other mobile email clients
      const logoUrl = "https://motokitchen.nl/motoemaillogo.jpg";

      const autoReplyHtml = `
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
              background: #2B1E1A; 
              color: white; 
              padding: 32px; 
              text-align: center; 
            }
            .header img {
              max-width: 200px;
              height: auto;
              display: block;
              margin: 0 auto;
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
            .section:last-of-type {
              border-bottom: none;
            }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #3A2A24;
              margin: 0 0 12px 0;
            }
            .confirmation-box {
              background: #F1E7DA;
              padding: 20px;
              border-radius: 4px;
              text-align: center;
              margin: 0 0 28px 0;
            }
            .confirmation-box h2 {
              color: #2E7D32;
              font-size: 18px;
              font-weight: 600;
              margin: 0 0 8px 0;
            }
            .confirmation-box p {
              color: #3A2A24;
              margin: 0;
              font-size: 14px;
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
              min-width: 80px;
            }
            .field-value {
              color: #1F1F1F;
              font-weight: 500;
            }
            .link { 
              color: #C9653B; 
              text-decoration: none;
            }
            .link:hover {
              text-decoration: underline;
            }
            .footer { 
              padding: 24px 32px; 
              text-align: center; 
              color: #666; 
              font-size: 12px; 
              background: #FAF6EF;
              border-top: 1px solid #E6D9C8;
            }
            ol, ul {
              margin: 12px 0;
              padding-left: 20px;
            }
            li {
              margin: 8px 0;
              font-size: 14px;
            }
            p {
              margin: 0 0 16px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="Moto Kitchen" />
            </div>
            
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>Thank you for reaching out to Moto Kitchen!${eventTypeWording ? ` We're excited to help make your ${eventTypeWording} unforgettable.` : ''}</p>
              
              <div class="confirmation-box">
                <h2>✓ YOUR REQUEST HAS BEEN RECEIVED</h2>
                <p>We've got all your details and will send you a personalised quote within ${quoteResponseTime}.</p>
              </div>

              <div class="section">
                <p class="section-title">EVENT SUMMARY:</p>
                <div class="field">
                  <span class="field-label">Date:</span>
                  <span class="field-value">${customerDateDisplay}</span>
                </div>
                <div class="field">
                  <span class="field-label">Guests:</span>
                  <span class="field-value">${guestCount} people</span>
                </div>
                <div class="field">
                  <span class="field-label">Location:</span>
                  <span class="field-value">${location}</span>
                </div>
                <div class="field">
                  <span class="field-label">Budget:</span>
                  <span class="field-value">${customerBudgetDisplay}</span>
                </div>
              </div>

              <div class="section">
                <p class="section-title">WHAT HAPPENS NEXT:</p>
                <ol>
                  <li><strong>Within ${quoteResponseTime}:</strong> You'll receive a custom quote with menu options</li>
                  <li><strong>We're here to help!</strong> Questions? Reply to this email</li>
                </ol>
              </div>

              <div class="section">
                <p>In the meantime, check out:</p>
                <ul>
                  <li><a href="http://motokitchen.nl/menu" class="link">Our full menu</a></li>
                  <li><a href="https://www.motokitchen.nl/gallery" class="link">See our recent events</a></li>
                  <li>Follow us on Instagram: <a href="https://instagram.com/motokitchen.nl" class="link">@motokitchen.nl</a></li>
                  <li>Follow us on TikTok: <a href="https://www.tiktok.com/@motokitchen.nl" class="link">@motokitchen.nl</a></li>
                </ul>
              </div>

              <p><strong>Warm regards,</strong><br>Susan & The Moto Kitchen Team</p>
            </div>
            
            <div class="footer">
              <p><strong>Moto Kitchen</strong> | East African Catering</p>
              <p><a href="mailto:contact@motokitchen.nl" style="color: #C9653B; text-decoration: none;">contact@motokitchen.nl</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

      const autoReplyText = `
✓ We received your quote request - Moto Kitchen

Hi ${name},

Thank you for reaching out to Moto Kitchen!${eventTypeWording ? ` We're excited to help make your ${eventTypeWording} unforgettable.` : ''}

✓ YOUR REQUEST HAS BEEN RECEIVED

We've got all your details and will send you a personalised quote within ${quoteResponseTime}.

EVENT SUMMARY:
- Date: ${customerDateDisplay}
- Guests: ${guestCount} people
- Location: ${location}
- Budget: ${customerBudgetDisplay}

WHAT HAPPENS NEXT:

1. Within ${quoteResponseTime}: You'll receive a custom quote with menu options
2. We're here to help! Questions? Reply to this email

In the meantime, check out:
→ Our full menu: http://motokitchen.nl/menu
→ See our recent events: https://www.motokitchen.nl/gallery
→ Follow us on Instagram: @motokitchen.nl
→ Follow us on TikTok: https://www.tiktok.com/@motokitchen.nl

Warm regards,

Susan & The Moto Kitchen Team

---
Moto Kitchen | East African Catering
contact@motokitchen.nl
      `;

      // Send auto-reply email (use environment variable for "from" address when ready)
      // For now, using onboarding@resend.dev - update RESEND_FROM_EMAIL when ready
      const fromEmail = process.env.RESEND_FROM_EMAIL || "Moto Kitchen <onboarding@resend.dev>";
      
      const { error: autoReplyError } = await resend.emails.send({
        from: fromEmail,
        to: [email],
        replyTo: "contact@motokitchen.nl",
        subject: "✓ We received your quote request - Moto Kitchen",
        html: autoReplyHtml,
        text: autoReplyText,
      });

      if (autoReplyError) {
        logger.warn("Auto-reply email error", { ...context, email, error: autoReplyError });
        // Don't fail the request if auto-reply fails
      } else {
        logger.info("Auto-reply email sent successfully", { ...context, email, quoteRequestId: quoteRequest?.id });
      }
    } else {
      logger.debug("Auto-reply email is disabled", context);
    }

    // Add rate limit headers to successful response
    logger.info("Contact form submitted successfully", { ...context, quoteRequestId: quoteRequest?.id, eventType, guestCount });
    const event_token = crypto.randomUUID()
    const response = NextResponse.json({ 
      success: true,
      quoteId: quoteRequest?.id,
      event_token,
    })
    response.headers.set('X-RateLimit-Limit', rateLimitConfigs.quoteSubmit.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toString())
    return response
  } catch (error: any) {
    logger.api.error('POST', '/api/contact', error, context);
    captureException(error, context);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
