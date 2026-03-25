import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook token
    const webhookToken = Deno.env.get("KIWIFY_WEBHOOK_TOKEN");
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || req.headers.get("x-kiwify-token");

    // Kiwify sends token as query param or header
    const body = await req.json();
    const bodyToken = body?.webhook_token;

    const receivedToken = token || bodyToken;

    if (!webhookToken || receivedToken !== webhookToken) {
      console.error("Invalid webhook token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const event = body;
    const orderStatus = event.order_status;
    const customerEmail = event.Customer?.email?.toLowerCase();
    const transactionId = event.order_id || event.subscription_id;
    const productName = event.Product?.product_name;

    console.log(`Kiwify webhook: status=${orderStatus}, email=${customerEmail}, tx=${transactionId}`);

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "No customer email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map Kiwify status to internal status
    let status: string;
    let cancelledAt: string | null = null;

    switch (orderStatus) {
      case "paid":
      case "approved":
        status = "active";
        break;
      case "refunded":
        status = "refunded";
        cancelledAt = new Date().toISOString();
        break;
      case "chargedback":
      case "chargeback":
        status = "chargedback";
        cancelledAt = new Date().toISOString();
        break;
      case "subscription_canceled":
      case "canceled":
        status = "canceled";
        cancelledAt = new Date().toISOString();
        break;
      case "subscription_overdue":
      case "overdue":
        status = "past_due";
        break;
      case "subscription_renewed":
      case "renewed":
        status = "active";
        break;
      default:
        console.log(`Unhandled event status: ${orderStatus}`);
        return new Response(JSON.stringify({ ok: true, message: "Event ignored" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Determine plan from product name
    const plan = productName?.toLowerCase().includes("anual") ? "annual" : "monthly";

    // Look up user by email
    const { data: userData } = await supabase.auth.admin.listUsers();
    let user = userData?.users?.find(
      (u) => u.email?.toLowerCase() === customerEmail
    );

    // If user doesn't exist and payment is active, create the user
    if (!user && status === "active") {
      // Use customer CPF (numbers only) as initial password
      const rawCpf = event.Customer?.CPF || event.Customer?.cpf || event.Customer?.document || "";
      const cleanCpf = String(rawCpf).replace(/\D/g, "");
      const initialPassword = cleanCpf.length >= 8 ? cleanCpf : String(Math.floor(10000000 + Math.random() * 90000000));
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: customerEmail,
        password: initialPassword,
        email_confirm: true,
        user_metadata: {
          display_name: event.Customer?.full_name || customerEmail.split("@")[0],
          temp_password: initialPassword,
        },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        return new Response(JSON.stringify({ error: "Failed to create user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      user = newUser.user;
      console.log(`New user created: email=${customerEmail}, password=CPF(${cleanCpf.length} digits)`);
    }

    const userId = user?.id;

    // Upsert subscription
    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          email: customerEmail,
          user_id: userId || "00000000-0000-0000-0000-000000000000",
          kiwify_transaction_id: transactionId,
          plan,
          status,
          cancelled_at: cancelledAt,
          started_at: status === "active" ? new Date().toISOString() : undefined,
        },
        { onConflict: "email" }
      );

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If user exists and subscription was canceled/refunded, we could add notifications
    if (userId && (status === "canceled" || status === "refunded" || status === "chargedback")) {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "subscription",
        title: "Assinatura alterada",
        message: `Sua assinatura foi ${status === "canceled" ? "cancelada" : status === "refunded" ? "reembolsada" : "estornada"}.`,
        action_link: "/",
      });
    }

    console.log(`Subscription updated: email=${customerEmail}, status=${status}`);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
