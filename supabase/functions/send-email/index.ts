
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const SUPABASE_URL = "https://daqvphzqrnsxqthggwrw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SMTP_HOST = Deno.env.get("SMTP_HOST")?.trim() || "";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT")) || 465; // SSL port for mail.ru
const SMTP_USER = Deno.env.get("SMTP_USER") || "";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  ticketId?: string;
  messageId?: string;
  userId?: string;
  ticketStatus?: string;
}

const sendEmailWithSMTP = async (to: string, subject: string, body: string) => {
  try {
    // Detailed validation of SMTP configuration
    const configIssues = [];
    if (!SMTP_HOST) configIssues.push("SMTP_HOST is missing");
    if (!SMTP_PORT) configIssues.push("SMTP_PORT is missing");
    if (!SMTP_USER) configIssues.push("SMTP_USER is missing");
    if (!SMTP_PASSWORD) configIssues.push("SMTP_PASSWORD is missing");
    if (!FROM_EMAIL) configIssues.push("FROM_EMAIL is missing");
    
    if (configIssues.length > 0) {
      console.error("SMTP configuration issues:", configIssues);
      throw new Error(`SMTP configuration is incomplete: ${configIssues.join(", ")}`);
    }

    console.log(`Attempting to send email to ${to} via ${SMTP_HOST}:${SMTP_PORT}`);
    
    // Establish SMTP connection with debug mode enabled
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: true,
        auth: {
          username: SMTP_USER,
          password: SMTP_PASSWORD,
        },
      },
      debug: true, // Enable debug logging
    });

    // Add proper encoding information to ensure Cyrillic text renders correctly
    console.log("Attempting to send email with UTF-8 encoding:", {
      from: FROM_EMAIL,
      to: to,
      subject: subject
    });
    
    // Important: Do NOT use base64 encoding, as this is causing the email content to be displayed as encoded bytes
    // Instead, use the default quoted-printable encoding which is better for UTF-8 content
    const result = await client.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      content: "text/html",
      html: body,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        // Remove base64 encoding to fix the character display issue
      },
    });

    console.log("Email sent successfully, result:", result);
    await client.close();
    return true;
  } catch (error) {
    // Provide more detailed error logging
    console.error("Error sending email:", error);
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    if (error.stack) console.error("Stack trace:", error.stack);
    
    // For mail.ru specific authentication error
    if (error.message && error.message.includes("NEOBHODIM parol prilozheniya")) {
      console.error("Mail.ru requires an application-specific password. Please generate one at https://help.mail.ru/mail/security/protection/external");
    }
    
    return false;
  }
};

// Track notification events in the database
const trackNotificationEvent = async (supabase: any, data: EmailPayload) => {
  const { to, subject, ticketId, messageId, userId, ticketStatus } = data;
  
  try {
    const { error } = await supabase
      .from('notification_events')
      .insert({
        to_email: to,
        subject,
        ticket_id: ticketId,
        message_id: messageId,
        user_id: userId,
        ticket_status: ticketStatus,
        sent_at: new Date().toISOString()
      });
      
    if (error) {
      console.error("Error tracking notification event:", error);
    }
  } catch (err) {
    console.error("Error tracking notification event:", err);
  }
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Log the request body for debugging
    const requestText = await req.text();
    console.log("Raw request body:", requestText);
    
    let payload: EmailPayload;
    try {
      payload = JSON.parse(requestText);
      console.log("Parsed email request:", JSON.stringify(payload, null, 2));
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { to, subject, body } = payload;
    
    if (!to || !subject || !body) {
      console.error("Missing required fields:", { to, subject, bodyPresent: !!body });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Log SMTP configuration (without password)
    console.log("SMTP Config:", {
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER,
      fromEmail: FROM_EMAIL,
      hasPassword: !!SMTP_PASSWORD
    });
    
    const success = await sendEmailWithSMTP(to, subject, body);
    
    if (success) {
      // Track the notification event
      await trackNotificationEvent(supabase, payload);
      
      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to send email",
          note: "If using mail.ru, make sure to use an application-specific password"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        note: "Check server logs for more details"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
