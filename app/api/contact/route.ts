import { NextResponse } from "next/server";
import { Resend } from "resend";

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

    const dietaryList = dietary?.length > 0 
      ? dietary.join(", ") 
      : "None specified";

    const emailHtml = `
      <h1>New Quote Request from Moto Kitchen Website</h1>
      
      <h2>Event Details</h2>
      <ul>
        <li><strong>Event Type:</strong> ${eventType}</li>
        <li><strong>Date:</strong> ${eventDate || "Not specified"}</li>
        <li><strong>Number of Guests:</strong> ${guestCount}</li>
        <li><strong>Location:</strong> ${location}</li>
      </ul>

      <h2>Contact Information</h2>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone}</li>
      </ul>

      <h2>Dietary Requirements</h2>
      <p>${dietaryList}</p>

      <h2>Message</h2>
      <p>${message || "No additional message"}</p>

      <h2>How They Found Us</h2>
      <p>${howFound || "Not specified"}</p>
    `;

    const emailText = `
New Quote Request from Moto Kitchen Website

EVENT DETAILS
- Event Type: ${eventType}
- Date: ${eventDate || "Not specified"}
- Number of Guests: ${guestCount}
- Location: ${location}

CONTACT INFORMATION
- Name: ${name}
- Email: ${email}
- Phone: ${phone}

DIETARY REQUIREMENTS
${dietaryList}

MESSAGE
${message || "No additional message"}

HOW THEY FOUND US
${howFound || "Not specified"}
    `;

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: "Moto Kitchen Website <noreply@motokitchen.nl>",
      to: ["contact@motokitchen.nl"],
      replyTo: email,
      subject: `New Quote Request: ${eventType} - ${guestCount} guests in ${location}`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

