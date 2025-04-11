
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const SUPABASE_URL = "https://daqvphzqrnsxqthggwrw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SMTP_HOST = Deno.env.get("SMTP_HOST") || "";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT")) || 587;
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
      throw new Error("SMTP configuration is incomplete");
    }

    const conn = await Deno.connect({ hostname: SMTP_HOST, port: SMTP_PORT });
    const reader = conn.readable.getReader();
    const writer = conn.writable.getWriter();

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const read = async () => {
      const { value, done } = await reader.read();
      return decoder.decode(value);
    };

    const write = async (s: string) => {
      console.log(`> ${s}`);
      await writer.write(encoder.encode(s + "\r\n"));
    };

    const response = await read();
    console.log(`< ${response}`);

    await write("EHLO rplus.app");
    await read();

    await write("STARTTLS");
    await read();

    // Upgrade connection to TLS
    const tls = await Deno.startTls(conn, { hostname: SMTP_HOST });
    const tlsReader = tls.readable.getReader();
    const tlsWriter = tls.writable.getWriter();

    const tlsRead = async () => {
      const { value, done } = await tlsReader.read();
      return decoder.decode(value);
    };

    const tlsWrite = async (s: string) => {
      console.log(`> ${s}`);
      await tlsWriter.write(encoder.encode(s + "\r\n"));
    };

    await tlsWrite("EHLO rplus.app");
    await tlsRead();

    await tlsWrite(`AUTH LOGIN`);
    await tlsRead();

    await tlsWrite(btoa(SMTP_USER));
    await tlsRead();

    await tlsWrite(btoa(SMTP_PASSWORD));
    await tlsRead();

    await tlsWrite(`MAIL FROM: <${FROM_EMAIL}>`);
    await tlsRead();

    await tlsWrite(`RCPT TO: <${to}>`);
    await tlsRead();

    await tlsWrite("DATA");
    await tlsRead();

    await tlsWrite(`From: rplus <${FROM_EMAIL}>`);
    await tlsWrite(`To: <${to}>`);
    await tlsWrite(`Subject: ${subject}`);
    await tlsWrite("Content-Type: text/html; charset=utf-8");
    await tlsWrite("");
    await tlsWrite(body);
    await tlsWrite(".");
    await tlsRead();

    await tlsWrite("QUIT");
    await tlsRead();

    tlsWriter.close();
    tlsReader.releaseLock();
    
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
    const payload: EmailPayload = await req.json();
    const { to, subject, body } = payload;
    
    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
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
