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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday

    // Get all users with inventory items
    const { data: users } = await supabase
      .from("inventory_items")
      .select("user_id")
      .limit(1000);

    const uniqueUserIds = [...new Set((users || []).map((u: { user_id: string }) => u.user_id))];

    let notificationsCreated = 0;

    for (const userId of uniqueUserIds) {
      // 1. Check low stock items
      const { data: lowStockItems } = await supabase
        .from("inventory_items")
        .select("id, name, current_stock, min_alert_level")
        .eq("user_id", userId);

      const actualLowStock = (lowStockItems || []).filter(
        (item: { current_stock: number; min_alert_level: number }) => 
          item.current_stock < item.min_alert_level
      );

      if (actualLowStock.length > 0) {
        // Check if notification already exists today
        const { data: existingLowStock } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "estoque_baixo")
          .gte("created_at", `${todayStr}T00:00:00`)
          .limit(1);

        if (!existingLowStock || existingLowStock.length === 0) {
          const itemNames = actualLowStock
            .slice(0, 3)
            .map((i: { name: string }) => i.name)
            .join(", ");
          const extra = actualLowStock.length > 3 ? ` e mais ${actualLowStock.length - 3}` : "";

          await supabase.from("notifications").insert({
            user_id: userId,
            type: "estoque_baixo",
            title: "Alerta de Estoque Baixo",
            message: `${actualLowStock.length} item(s) abaixo do nível mínimo: ${itemNames}${extra}`,
            action_link: "/lista-compras",
            reference_id: `low_stock_${todayStr}`,
          });
          notificationsCreated++;
        }
      }

      // 2. Check upcoming expenses (due in 5-7 days)
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 7);
      const futureDateStr = futureDate.toISOString().split("T")[0];

      const fiveDaysLater = new Date(today);
      fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
      const fiveDaysStr = fiveDaysLater.toISOString().split("T")[0];

      // Get user's recipes first
      const { data: userRecipes } = await supabase
        .from("recipes")
        .select("id")
        .eq("user_id", userId);

      if (userRecipes && userRecipes.length > 0) {
        const recipeIds = userRecipes.map((r: { id: string }) => r.id);

        const { data: upcomingExpenses } = await supabase
          .from("expenses")
          .select("id, name, due_date")
          .in("recipe_id", recipeIds)
          .gte("due_date", fiveDaysStr)
          .lte("due_date", futureDateStr);

        if (upcomingExpenses && upcomingExpenses.length > 0) {
          const { data: existingExpense } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", userId)
            .eq("type", "conta_vencer")
            .gte("created_at", `${todayStr}T00:00:00`)
            .limit(1);

          if (!existingExpense || existingExpense.length === 0) {
            const expenseNames = upcomingExpenses
              .slice(0, 2)
              .map((e: { name: string }) => e.name)
              .join(", ");
            const extra = upcomingExpenses.length > 2 ? ` e mais ${upcomingExpenses.length - 2}` : "";

            await supabase.from("notifications").insert({
              user_id: userId,
              type: "conta_vencer",
              title: "Contas a Vencer",
              message: `${upcomingExpenses.length} conta(s) vencem nos próximos dias: ${expenseNames}${extra}`,
              action_link: "/receitas",
              reference_id: `expenses_${todayStr}`,
            });
            notificationsCreated++;
          }
        }
      }

      // 3. Weekly analysis reminder (Monday)
      if (dayOfWeek === 1) {
        const { data: existingWeekly } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "analise_semanal")
          .gte("created_at", `${todayStr}T00:00:00`)
          .limit(1);

        if (!existingWeekly || existingWeekly.length === 0) {
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "analise_semanal",
            title: "Hora da Análise Semanal",
            message: "Confira seu desempenho da semana no Dashboard e nas Métricas do Negócio.",
            action_link: "/",
            reference_id: `weekly_${todayStr}`,
          });
          notificationsCreated++;
        }
      }
    }

    console.log(`Notifications created: ${notificationsCreated}`);

    return new Response(
      JSON.stringify({ success: true, notificationsCreated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Error checking notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
