import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase/server";
import { getPricing } from "@/lib/pricing-data";

// Map form event types to pricing service types
function mapEventTypeToServiceType(eventType: string): "private-events" | "corporate" | "weddings" | "pick-up-delivery" {
  if (eventType === "private") return "private-events";
  if (eventType === "corporate") return "corporate";
  if (eventType === "wedding") return "weddings";
  if (eventType === "pickup-delivery") return "pick-up-delivery";
  return "private-events"; // default
}

export async function POST(request: Request) {
  try {
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
      dietary,
      message,
      howFound,
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !eventType || !guestCount || !location) {
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
          dietary_requirements: dietary || [],
          message: message || null,
          how_found: howFound || null,
          status: 'new',
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        // Continue anyway - email is more critical
      } else {
        quoteRequest = data;
      }
    } catch (dbError) {
      console.error("Database connection error:", dbError);
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

    // Calculate estimated budget range (using your pricing)
    const guestCountNum = parseInt(guestCount);
    const serviceType = mapEventTypeToServiceType(eventType);
    const basePrice = getPricing(serviceType).price;
    const estimatedMin = guestCountNum * basePrice;
    const estimatedMax = guestCountNum * (basePrice + 10);

    // Check if date is urgent (within 30 days)
    const isUrgent = eventDate && eventDate !== "Flexible" 
      ? (new Date(eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 30
      : false;

    const dietaryList = dietary?.length > 0 
      ? dietary.join(", ") 
      : "None specified";

    const eventTypeLabel = eventType.charAt(0).toUpperCase() + eventType.slice(1).replace(/-/g, " ");

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
          ${isUrgent ? '<p style="color: #ffc107; font-weight: bold; margin: 10px 0 0 0;">⚠️ URGENT: Event within 30 days</p>' : ''}
        </div>
        
        <div class="content">
          <div class="section ${isUrgent ? 'urgent' : ''}">
            <h2>📅 Event Details</h2>
            <p><strong>Type:</strong> ${eventTypeLabel}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Guests:</strong> ${guestCount}</p>
            <p><strong>Location:</strong> ${location}</p>
            <div class="highlight">
              <strong>Estimated Budget:</strong> €${estimatedMin.toLocaleString()} - €${estimatedMax.toLocaleString()}
            </div>
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

EVENT DETAILS
- Type: ${eventTypeLabel}
- Date: ${formattedDate}
- Guests: ${guestCount}
- Location: ${location}
- Estimated Budget: €${estimatedMin.toLocaleString()} - €${estimatedMax.toLocaleString()}

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

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "Moto Kitchen Website <onboarding@resend.dev>",
      to: ["chilechhaa@gmail.com"],
      replyTo: email,
      subject: `${isUrgent ? '⚠️ URGENT: ' : ''}New Quote: ${eventTypeLabel} - ${guestCount} guests in ${location}`,
      html: emailHtml,
      text: emailText,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      // Don't fail the request if email fails - data is already saved
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
