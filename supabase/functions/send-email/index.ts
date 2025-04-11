
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const SUPABASE_URL = "https://daqvphzqrnsxqthggwrw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SMTP_HOST = Deno.env.get("SMTP_HOST")?.trim() || "";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT")) || 465; // Changed to 465 which is more common for SSL
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
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !FROM_EMAIL) {
      console.error("SMTP configuration is incomplete", { 
        hasHost: !!SMTP_HOST, 
        hasPort: !!SMTP_PORT, 
        hasUser: !!SMTP_USER, 
        hasPassword: !!SMTP_PASSWORD,
        hasFromEmail: !!FROM_EMAIL
      });
      throw new Error("SMTP configuration is incomplete");
    }

    console.log(`Attempting to send email to ${to} via ${SMTP_HOST}:${SMTP_PORT}`);
    
    // Create a new SMTP client with the correct configuration for mail.ru
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
      debug: true, // Enable debug logging for SMTP interactions
    });

    // Send the email
    await client.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      content: "text/html",
      html: body,
    });

    await client.close();
    console.log("Email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

// Добавим события для отслеживания в базе данных
const trackNotificationEvent = async (supabase: any, data: EmailPayload) => {
  const { to, subject, ticketId, messageId, userId, ticketStatus } = data;
  
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
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Проверяем содержимое запроса
    const payload: EmailPayload = await req.json();
    console.log("Received email request:", JSON.stringify(payload, null, 2));
    
    const { to, subject, body } = payload;
    
    if (!to || !subject || !body) {
      console.error("Missing required fields:", { to, subject, bodyPresent: !!body });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Выводим информацию о конфигурации SMTP (без пароля)
    console.log("SMTP Config:", {
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER,
      fromEmail: FROM_EMAIL,
      hasPassword: !!SMTP_PASSWORD
    });
    
    const success = await sendEmailWithSMTP(to, subject, body);
    
    if (success) {
      // Отслеживаем событие отправки уведомления
      await trackNotificationEvent(supabase, payload);
      
      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
