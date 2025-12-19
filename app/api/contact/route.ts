import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase/server";
import { getPricing } from "@/lib/pricing-data";

// Map form event types to pricing service types
function mapEventTypeToServiceType(eventType: string): "private-events" | "corporate" | "weddings" | "pick-up-delivery" {
  if (eventType === "private") return "private-events";
  if (eventType === "corporate") return "corporate";
  if (eventType === "wedding") return "weddings";
  if (eventType === "pickup-delivery" || eventType === "pickup-only") return "pick-up-delivery";
  return "private-events"; // default
}

export async function POST(request: Request) {
  try {
    // Check Supabase environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase environment variables not set:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      });
      // Continue anyway - we'll try to save but it will fail gracefully
    }
    
    // Initialize Resend only at runtime, not during build
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not set");
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

    // Save to database FIRST (so we don't lose data if email fails)
    let quoteRequest = null;
    try {
      const supabase = createServerClient();
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
        console.error("Database error:", JSON.stringify(dbError, null, 2));
        console.error("Error details:", {
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code
        });
        // Still continue to send email, but log the error clearly
      } else {
        quoteRequest = data;
        console.log("Quote request saved successfully:", quoteRequest.id);
      }
    } catch (dbError: any) {
      console.error("Database connection error:", dbError);
      console.error("Error stack:", dbError?.stack);
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

    // Format date as "Jan 23" or "Dec 22" for subject line
    const shortDate = eventDate && eventDate !== "Flexible"
      ? new Date(eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : "Flexible";

    // Calculate estimated budget range (using your pricing)
    const guestCountNum = parseInt(guestCount);
    const pricingServiceType = mapEventTypeToServiceType(eventType);
    const basePrice = getPricing(pricingServiceType).price;
    const estimatedMin = guestCountNum * basePrice;
    const estimatedMax = guestCountNum * (basePrice + 10);

    // Calculate per person rate
    const perPersonMin = basePrice;
    const perPersonMax = basePrice + 10;

    // Check if date is urgent (within 14 days / 2 weeks)
    const isUrgent = eventDate && eventDate !== "Flexible" 
      ? (new Date(eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 14
      : false;

    // Determine priority level and response time
    const priorityLevel = isUrgent ? "URGENT" : "NORMAL";
    const responseTime = isUrgent ? "Within 24 hours" : "Within 48 hours";

    const dietaryList = dietary?.length > 0 
      ? dietary.join(", ") 
      : "None specified";

    const eventTypeLabel = eventType.charAt(0).toUpperCase() + eventType.slice(1).replace(/-/g, " ");
    
    // Format budget range for display
    const formatBudgetRange = (budgetRange: string | null) => {
      if (!budgetRange) return "Not specified";
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .header { background: #3A2A24; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #FAF6EF; }
          .section { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #C9653B; border-radius: 4px; }
          .urgent { background: #fff3cd; border-left-color: #ffc107; }
          .button { display: inline-block; padding: 12px 24px; background: #C9653B; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; background: #F1E7DA; }
          .highlight { background: #F1E7DA; padding: 10px; border-radius: 4px; margin: 10px 0; }
          h2 { color: #3A2A24; margin-top: 0; }
          a { color: #C9653B; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">🍽️ New Quote Request</h1>
          ${isUrgent && daysUntilEvent !== null ? `<p style="color: #ffc107; font-weight: bold; margin: 10px 0 0 0;">⚠️ URGENT: Event within ${daysUntilEvent} days</p>` : ''}
        </div>
        
        <div class="content">
          <div class="section ${isUrgent ? 'urgent' : ''}">
            <h2>📅 EVENT DETAILS</h2>
            <p><strong>Event Type:</strong> ${eventTypeLabel}</p>
            <p><strong>Event Date:</strong> ${formattedDate}${daysFromNow !== null ? ` (${daysFromNow} days from now)` : ''}</p>
            <p><strong>Guest Count:</strong> ${guestCount} people</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Service Type:</strong> ${formatServiceType(serviceType)}</p>
          </div>

          <div class="section">
            <h2>💰 BUDGET ANALYSIS</h2>
            <p><strong>Estimated Budget:</strong> €${estimatedMin.toLocaleString()} - €${estimatedMax.toLocaleString()}</p>
            <p><strong>Per Person Rate:</strong> €${perPersonMin} - €${perPersonMax}/person</p>
            ${budget ? `<p><strong>Customer Budget Range:</strong> ${formatBudgetRange(budget)}</p>` : ''}
          </div>

          <div class="section ${isUrgent ? 'urgent' : ''}">
            <h2>⏰ URGENCY</h2>
            <p><strong>Days Until Event:</strong> ${daysUntilEvent !== null ? `${daysUntilEvent} days` : 'Flexible'}</p>
            <p><strong>Priority Level:</strong> ${priorityLevel}</p>
            <p><strong>Recommended Response Time:</strong> ${responseTime}</p>
          </div>

          <div class="section">
            <h2>👤 Contact Information</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
          </div>

          <div class="section">
            <h2>🥗 Dietary Requirements</h2>
            <p>${dietaryList}</p>
          </div>

          ${message ? `
          <div class="section">
            <h2>💬 Additional Message</h2>
            <p>${message}</p>
          </div>
          ` : ''}

          <div class="section">
            <h2>📊 Lead Source</h2>
            <p>${howFound || "Not specified"}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${email}?subject=Re: Your Quote Request for ${eventTypeLabel}" class="button">
              Reply to ${name}
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Quote Request ID:</strong> ${quoteRequest?.id || 'N/A'}</p>
          <p>Submitted: ${new Date().toLocaleString('en-NL')}</p>
        </div>
      </body>
      </html>
    `;

    const emailText = `
NEW QUOTE REQUEST ${isUrgent ? '⚠️ URGENT' : ''}
${'='.repeat(50)}

📅 EVENT DETAILS
Event Type: ${eventTypeLabel}
Event Date: ${formattedDate}${daysFromNow !== null ? ` (${daysFromNow} days from now)` : ''}
Guest Count: ${guestCount} people
Location: ${location}
Service Type: ${formatServiceType(serviceType)}

💰 BUDGET ANALYSIS
Estimated Budget: €${estimatedMin.toLocaleString()} - €${estimatedMax.toLocaleString()}
Per Person Rate: €${perPersonMin} - €${perPersonMax}/person
${budget ? `Customer Budget Range: ${formatBudgetRange(budget)}` : ''}

⏰ URGENCY
Days Until Event: ${daysUntilEvent !== null ? `${daysUntilEvent} days` : 'Flexible'}
Priority Level: ${priorityLevel}
Recommended Response Time: ${responseTime}

CONTACT INFORMATION
- Name: ${name}
- Email: ${email}
- Phone: ${phone}

DIETARY REQUIREMENTS
${dietaryList}

${message ? `MESSAGE\n${message}\n` : ''}

LEAD SOURCE
${howFound || "Not specified"}

${'='.repeat(50)}
Quote Request ID: ${quoteRequest?.id || 'N/A'}
Submitted: ${new Date().toLocaleString('en-NL')}
    `;

    // Build subject line
    let subject: string;
    if (isUrgent && daysUntilEvent !== null) {
      subject = `🔥 URGENT (${daysUntilEvent} days): ${name} - ${eventTypeLabel} - ${guestCount} pax`;
    } else {
      subject = `🍽️ Quote Request: ${name} - ${eventTypeLabel} - ${shortDate} - ${guestCount} pax`;
    }

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
      console.error("Resend error:", emailError);
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

      const autoReplyHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #FAF6EF; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #3A2A24; color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .checkmark { color: #4CAF50; font-size: 24px; font-weight: bold; }
            .section { margin: 20px 0; padding: 15px; background: #F1E7DA; border-radius: 4px; }
            .section-title { font-weight: bold; color: #3A2A24; margin-bottom: 10px; }
            .link { color: #C9653B; text-decoration: none; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; background: #F1E7DA; border-top: 1px solid #E6D9C8; }
            .signature { margin-top: 30px; }
            h1 { margin: 0; }
            ul { margin: 10px 0; padding-left: 20px; }
            li { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Moto Kitchen</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">East African Catering</p>
            </div>
            
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>Thank you for reaching out to Moto Kitchen! We're excited to help make your ${eventTypeLabel.toLowerCase()} unforgettable.</p>
              
              <div class="section">
                <p class="checkmark">✓ YOUR REQUEST HAS BEEN RECEIVED</p>
                <p>We've got all your details and will send you a personalised quote within 24 hours.</p>
              </div>

              <div class="section">
                <p class="section-title">EVENT SUMMARY:</p>
                <ul>
                  <li><strong>Date:</strong> ${customerDateDisplay}</li>
                  <li><strong>Guests:</strong> ${guestCount} people</li>
                  <li><strong>Location:</strong> ${location}</li>
                  <li><strong>Budget:</strong> ${customerBudgetDisplay}</li>
                </ul>
              </div>

              <div class="section">
                <p class="section-title">WHAT HAPPENS NEXT:</p>
                <ol>
                  <li><strong>Within 24 hours:</strong> You'll receive a custom quote with menu options</li>
                  <li><strong>We're here to help!</strong> Questions? Reply to this email</li>
                </ol>
              </div>

              <p>In the meantime, check out:</p>
              <ul>
                <li>→ <a href="https://motokitchen.nl/menu" class="link">Our full menu</a></li>
                <li>→ <a href="https://motokitchen.nl/gallery" class="link">See our recent events</a></li>
                <li>→ Follow us on Instagram: <a href="https://instagram.com/motokitchen.nl" class="link">@motokitchen.nl</a></li>
              </ul>

              <div class="signature">
                <p><strong>Karibu (Welcome)!</strong></p>
                <p>Susan & The Moto Kitchen Team</p>
              </div>
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

Thank you for reaching out to Moto Kitchen! We're excited to help make your ${eventTypeLabel.toLowerCase()} unforgettable.

✓ YOUR REQUEST HAS BEEN RECEIVED

We've got all your details and will send you a personalised quote within 24 hours.

EVENT SUMMARY:
- Date: ${customerDateDisplay}
- Guests: ${guestCount} people
- Location: ${location}
- Budget: ${customerBudgetDisplay}

WHAT HAPPENS NEXT:

1. Within 24 hours: You'll receive a custom quote with menu options
2. We're here to help! Questions? Reply to this email

In the meantime, check out:
→ Our full menu: https://motokitchen.nl/menu
→ See our recent events: https://motokitchen.nl/gallery
→ Follow us on Instagram: @motokitchen.nl

Karibu (Welcome)!

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
        console.error("Auto-reply email error:", autoReplyError);
        // Don't fail the request if auto-reply fails
      } else {
        console.log("Auto-reply email sent successfully to:", email);
      }
    } else {
      console.log("Auto-reply email is disabled. Set ENABLE_AUTO_REPLY=true to enable.");
    }

    return NextResponse.json({ 
      success: true,
      quoteId: quoteRequest?.id 
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
