import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `# IDENTIDADE E PROPÓSITO

**Nome:** Lucra

**Função:** Consultora de Inteligência Financeira do ecossistema DeliveryNoAzul.

**Missão:** Ser a mentora financeira que todo dono de delivery precisava ter. Você não dá respostas genéricas - você ENSINA, ANALISA e ORIENTA com profundidade, usando os dados reais do negócio do usuário.

**Personalidade:** Você é como aquela amiga expert em finanças que fala de forma clara, sem jargões desnecessários, mas que também sabe ser técnica quando precisa. Você celebra as vitórias do usuário, mas também é honesta quando algo precisa melhorar.

# REGRAS DE OURO DO LUCRA

## 1. SEJA CONSULTORA, NÃO ROBÔ
- Nunca dê respostas padronizadas ou evasivas
- Analise os dados reais do usuário e fale sobre A SITUAÇÃO DELE especificamente
- Se não tiver dados suficientes, PERGUNTE para entender melhor antes de responder

## 2. ENSINE COM EXEMPLOS PRÁTICOS
Quando o usuário perguntar "como precificar?", não diga apenas "considere os custos". ENSINE:

**Exemplo de resposta boa sobre precificação:**
"Vou te ensinar o método que uso com todos os donos de delivery que atendo:

**Passo 1 - Custo Real do Ingrediente**
Pegue o preço que você pagou e divida pelo que realmente vai usar. Ex: Se a cebola custou R$ 5 por kg, mas você joga fora 20% (cascas), seu custo real é R$ 6,25/kg.

**Passo 2 - Some TODOS os ingredientes**
Não esqueça: óleo, temperos, gás, embalagem. Muita gente esquece e aí o lucro 'some'.

**Passo 3 - Adicione suas despesas fixas rateadas**
Aluguel, luz, internet dividido pela quantidade de pratos que você vende.

**Passo 4 - Defina sua margem de lucro**
Sugiro no mínimo 30% para delivery. Menos que isso, qualquer imprevisto te coloca no vermelho.

Quer que eu analise uma receita sua específica? [Vamos às suas receitas](/receitas)"

## 3. USE OS DADOS DO USUÁRIO ATIVAMENTE
Se o usuário tem receitas com margem baixa, MENCIONE ELAS pelo nome.
Se o estoque está baixo, ALERTE sobre isso.
Faça conexões: "Você tem 3 receitas com margem abaixo de 20%. Isso pode ser o motivo do seu lucro não aparecer no final do mês."

## 4. FAÇA PERGUNTAS INTELIGENTES
Antes de dar conselho genérico, entenda a situação:
- "Quantos pratos você vende por dia em média?"
- "Qual seu custo fixo mensal (aluguel, luz, etc)?"
- "Você usa algum app de delivery? Qual a taxa deles?"

## 5. FORMATO DE RESPOSTA
- Comece reconhecendo a pergunta/situação do usuário
- Dê a orientação de forma estruturada e clara
- Use **negrito** para conceitos importantes
- Termine com uma ação específica ou pergunta para continuar a conversa

## 6. LINKS DE AÇÃO
Use o formato [texto](/rota) para direcionar:
- [Ver suas receitas](/receitas) 
- [Analisar fluxo de caixa](/fluxo-caixa)
- [Verificar estoque](/estoque)
- [Ver métricas](/metricas)

## 7. PROIBIÇÕES
- Nunca seja evasiva ou genérica
- Nunca diga "depende de vários fatores" sem explicar quais
- Nunca revele fórmulas matemáticas brutas - explique o conceito
- Nunca use termos como "segundo minha base de dados"

# CONTEXTO DO NEGÓCIO DO USUÁRIO

{{USER_CONTEXT}}

Use esses dados para personalizar TODAS as suas respostas. Cite números específicos, nomes de receitas, alertas reais.

# BASE DE CONHECIMENTO

{{KNOWLEDGE_BASE}}

Incorpore esse conhecimento naturalmente nas suas respostas, sem citar a fonte.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext, analyzeRecipeId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch admin knowledge base (all active items)
    let knowledgeBase: { title: string; content: string }[] = [];
    let recipeAnalysisContext = "";
    let attachmentContext = "";
    
    const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY 
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;
    
    if (supabase) {
      const { data, error } = await supabase
        .from("knowledge_base")
        .select("title, content")
        .eq("is_active", true);
      
      if (error) {
        console.error("Error fetching knowledge base:", error);
      } else {
        knowledgeBase = data || [];
      }

      // Fetch detailed recipe data if analyzeRecipeId is provided
      if (analyzeRecipeId) {
        console.log("Fetching recipe details for analysis:", analyzeRecipeId);
        
        const [recipeRes, ingredientsRes, packagingRes, expensesRes] = await Promise.all([
          supabase.from("recipes").select("*").eq("id", analyzeRecipeId).single(),
          supabase.from("ingredients").select("*, inventory_items(name, unit_cost, stock_unit)").eq("recipe_id", analyzeRecipeId),
          supabase.from("packaging").select("*, inventory_items(name, unit_cost, stock_unit)").eq("recipe_id", analyzeRecipeId),
          supabase.from("expenses").select("*").eq("recipe_id", analyzeRecipeId),
        ]);

        if (recipeRes.data) {
          const recipe = recipeRes.data;
          const ingredients = ingredientsRes.data || [];
          const packaging = packagingRes.data || [];
          const expenses = expensesRes.data || [];

          // Calculate costs
          let totalIngredientsCost = 0;
          const ingredientDetails = ingredients.map((ing: any) => {
            const costPerUnit = ing.unit_price / (ing.package_qty || 1);
            const usedCost = costPerUnit * ing.used_qty * (1 + (ing.loss || 0) / 100);
            totalIngredientsCost += usedCost;
            return `   - ${ing.name}: ${ing.used_qty} ${ing.used_unit || ing.unit} × R$ ${costPerUnit.toFixed(4)} (+ ${ing.loss || 0}% perda) = R$ ${usedCost.toFixed(2)}`;
          });

          let totalPackagingCost = 0;
          const packagingDetails = packaging.map((pkg: any) => {
            const costPerUnit = pkg.package_price / (pkg.package_qty || 1);
            const usedCost = costPerUnit * pkg.used_qty;
            totalPackagingCost += usedCost;
            return `   - ${pkg.name}: ${pkg.used_qty} ${pkg.used_unit || pkg.unit} × R$ ${costPerUnit.toFixed(4)} = R$ ${usedCost.toFixed(2)}`;
          });

          let totalExpensesCost = 0;
          const expenseDetails = expenses.map((exp: any) => {
            totalExpensesCost += exp.value;
            return `   - ${exp.name}: R$ ${exp.value.toFixed(2)}`;
          });

          const totalCost = totalIngredientsCost + totalPackagingCost + totalExpensesCost;
          const costPerUnit = totalCost / (recipe.yield || 1);
          const suggestedPrice = recipe.suggested_price || 0;
          const profitPerUnit = suggestedPrice - costPerUnit;
          const profitMargin = suggestedPrice > 0 ? ((profitPerUnit / suggestedPrice) * 100) : 0;

          // Calculate fee impacts
          const appFee = recipe.app_fee || 0;
          const cardFee = recipe.card_fee || 0;
          const taxFee = recipe.tax_fee || 0;
          const totalFees = appFee + cardFee + taxFee;
          const priceAfterFees = suggestedPrice * (1 - totalFees / 100);
          const realProfit = priceAfterFees - costPerUnit;
          const realMargin = suggestedPrice > 0 ? ((realProfit / suggestedPrice) * 100) : 0;

          recipeAnalysisContext = `
🔍 **ANÁLISE DETALHADA DA RECEITA: ${recipe.name}**

📊 **Informações Gerais:**
- Rendimento: ${recipe.yield} unidades
- Preço sugerido: R$ ${suggestedPrice.toFixed(2)}
- Categoria: ${recipe.category || "Não definida"}
- Status: ${recipe.status || "Não definido"}

🥘 **INGREDIENTES (${ingredients.length} itens):**
${ingredientDetails.length > 0 ? ingredientDetails.join("\n") : "   Nenhum ingrediente cadastrado"}
**Subtotal Ingredientes: R$ ${totalIngredientsCost.toFixed(2)}**

📦 **EMBALAGENS (${packaging.length} itens):**
${packagingDetails.length > 0 ? packagingDetails.join("\n") : "   Nenhuma embalagem cadastrada"}
**Subtotal Embalagens: R$ ${totalPackagingCost.toFixed(2)}**

💸 **DESPESAS RATEADAS (${expenses.length} itens):**
${expenseDetails.length > 0 ? expenseDetails.join("\n") : "   Nenhuma despesa cadastrada"}
**Subtotal Despesas: R$ ${totalExpensesCost.toFixed(2)}**

📈 **RESUMO FINANCEIRO:**
- Custo total da receita: R$ ${totalCost.toFixed(2)}
- Custo por unidade: R$ ${costPerUnit.toFixed(2)}
- Preço de venda: R$ ${suggestedPrice.toFixed(2)}
- Lucro bruto por unidade: R$ ${profitPerUnit.toFixed(2)}
- Margem bruta: ${profitMargin.toFixed(1)}%

💳 **IMPACTO DAS TAXAS:**
- Taxa de app: ${appFee}%
- Taxa de cartão: ${cardFee}%
- Impostos: ${taxFee}%
- Total de taxas: ${totalFees.toFixed(1)}%
- Preço após taxas: R$ ${priceAfterFees.toFixed(2)}
- Lucro REAL por unidade: R$ ${realProfit.toFixed(2)}
- Margem REAL: ${realMargin.toFixed(1)}%

${realMargin < 20 ? "🚨 **ALERTA: Margem real abaixo de 20%! Receita precisa de ajustes urgentes.**" : realMargin < 30 ? "⚠️ **ATENÇÃO: Margem real entre 20-30%. Considere otimizações.**" : "✅ **Margem real saudável (acima de 30%)**"}

Use esses dados para fazer uma análise consultiva completa, identificando pontos de melhoria, sugerindo ajustes de preço ou ingredientes, e explicando o impacto de cada custo no resultado final.`;

          console.log("Recipe analysis context built for:", recipe.name);
        }
      }

      // Process attachments from the last user message
      const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user");
      if (lastUserMessage?.attachments && lastUserMessage.attachments.length > 0) {
        console.log("Processing", lastUserMessage.attachments.length, "attachments");
        
        const attachmentContents: string[] = [];
        
        for (const att of lastUserMessage.attachments) {
          if (!att.url) continue;
          
          try {
            // Extract file path from URL
            const urlParts = att.url.split("/knowledge-docs/");
            if (urlParts.length < 2) {
              console.log("Could not parse file path from URL:", att.url);
              continue;
            }
            
            const filePath = decodeURIComponent(urlParts[1]);
            console.log("Downloading attachment:", filePath);
            
            const { data: fileData, error: downloadError } = await supabase.storage
              .from("knowledge-docs")
              .download(filePath);
            
            if (downloadError) {
              console.error("Download error for attachment:", downloadError);
              attachmentContents.push(`[Erro ao baixar arquivo: ${att.name}]`);
              continue;
            }
            
            const fileExtension = att.name.split(".").pop()?.toLowerCase();
            let extractedText = "";
            
            if (fileExtension === "txt") {
              extractedText = await fileData.text();
            } else if (fileExtension === "pdf" || fileExtension === "docx" || fileExtension === "doc" || fileExtension === "xlsx" || fileExtension === "xls") {
              // Use AI to extract content
              extractedText = await extractDocumentWithAI(fileData, att.name, fileExtension, LOVABLE_API_KEY);
            } else if (att.type === "image") {
              // For images, we'll include them in the message content
              extractedText = `[Imagem: ${att.name}]`;
            } else {
              extractedText = `[Arquivo: ${att.name}] - Formato não suportado para leitura automática`;
            }
            
            if (extractedText && extractedText.length > 0) {
              attachmentContents.push(`📎 **Conteúdo do arquivo "${att.name}":**\n${extractedText}`);
              console.log(`Extracted ${extractedText.length} chars from ${att.name}`);
            }
          } catch (attError) {
            console.error("Error processing attachment:", attError);
            attachmentContents.push(`[Erro ao processar: ${att.name}]`);
          }
        }
        
        if (attachmentContents.length > 0) {
          attachmentContext = "\n\n# ARQUIVOS ANEXADOS PELO USUÁRIO (LEIA E RESPONDA SOBRE ELES)\n\n" + attachmentContents.join("\n\n");
          console.log("Attachment context built with", attachmentContents.length, "items");
        }
      }
    }

    // Build dynamic system prompt with user context
    let systemPrompt = SYSTEM_PROMPT;
    
    if (userContext) {
      const contextParts = [];
      
      if (userContext.recipes) {
        contextParts.push(`📋 **Receitas cadastradas:** ${userContext.recipes.total} receitas no sistema`);
        if (userContext.recipes.lowMargin?.length > 0) {
          contextParts.push(`🚨 **ALERTA - Receitas com margem baixa (abaixo de 30%):**`);
          userContext.recipes.lowMargin.forEach((r: any) => {
            contextParts.push(`   - "${r.name}": margem de apenas ${r.profit_margin?.toFixed(1)}% (PRECISA AJUSTAR)`);
          });
        } else if (userContext.recipes.total > 0) {
          contextParts.push(`✅ Todas as receitas estão com margem saudável (acima de 30%)`);
        }
      }
      
      if (userContext.inventory) {
        contextParts.push(`📦 **Estoque:** ${userContext.inventory.total} itens cadastrados`);
        if (userContext.inventory.lowStock?.length > 0) {
          contextParts.push(`🚨 **ALERTA - Estoque crítico:**`);
          userContext.inventory.lowStock.forEach((i: any) => {
            contextParts.push(`   - "${i.name}": PRECISA REPOR`);
          });
        }
      }
      
      if (userContext.cashFlow) {
        contextParts.push(`💰 **Fluxo de caixa deste mês:**`);
        contextParts.push(`   - Entradas: R$ ${userContext.cashFlow.income?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}`);
        contextParts.push(`   - Saídas: R$ ${userContext.cashFlow.expenses?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '0,00'}`);
        const balance = userContext.cashFlow.balance || 0;
        if (balance >= 0) {
          contextParts.push(`   - Resultado: R$ ${balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (POSITIVO ✅)`);
        } else {
          contextParts.push(`   - Resultado: R$ ${balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (NEGATIVO 🚨 - ATENÇÃO!)`);
        }
      }
      
      if (userContext.metrics) {
        contextParts.push(`🎯 **Metas configuradas:**`);
        contextParts.push(`   - Faturamento mensal: R$ ${userContext.metrics.monthly_revenue?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || 'não definido'}`);
        contextParts.push(`   - Meta diária: R$ ${userContext.metrics.daily_target?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || 'não definido'}`);
        contextParts.push(`   - Margem mínima: ${userContext.metrics.min_profit_margin || 30}%`);
      }

      if (contextParts.length === 0) {
        contextParts.push("⚠️ O usuário ainda não cadastrou dados. Incentive-o a começar pelas receitas principais e depois pelo estoque.");
      }
      
      systemPrompt = systemPrompt.replace("{{USER_CONTEXT}}", contextParts.join("\n"));
    } else {
      systemPrompt = systemPrompt.replace("{{USER_CONTEXT}}", "⚠️ Nenhum dado disponível ainda. O usuário precisa cadastrar receitas, estoque e registrar vendas para você poder dar orientações personalizadas. Incentive-o a começar!");
    }

    // Add admin knowledge base to system prompt
    if (knowledgeBase.length > 0) {
      const knowledgeParts = knowledgeBase.map((kb) => `**${kb.title}:**\n${kb.content}`);
      systemPrompt = systemPrompt.replace("{{KNOWLEDGE_BASE}}", knowledgeParts.join("\n\n"));
      console.log(`Loaded ${knowledgeBase.length} knowledge base items`);
    } else {
      systemPrompt = systemPrompt.replace("{{KNOWLEDGE_BASE}}", "Nenhum conhecimento personalizado adicionado ainda.");
    }

    // Add recipe analysis context if available
    if (recipeAnalysisContext) {
      systemPrompt += "\n\n# DADOS DA RECEITA PARA ANÁLISE\n" + recipeAnalysisContext;
    }

    // Add attachment context if available - CRITICAL: This makes the AI aware of the files
    if (attachmentContext) {
      systemPrompt += attachmentContext;
    }

    console.log("Starting chat request with", messages.length, "messages", analyzeRecipeId ? `(analyzing recipe ${analyzeRecipeId})` : "", attachmentContext ? "(with attachments)" : "");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro ao processar mensagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response back to client");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to extract document content using AI
async function extractDocumentWithAI(fileData: Blob, fileName: string, fileExtension: string, apiKey: string): Promise<string> {
  const arrayBuffer = await fileData.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  
  let mimeType = "application/pdf";
  if (fileExtension === "docx" || fileExtension === "doc") {
    mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else if (fileExtension === "xlsx" || fileExtension === "xls") {
    mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Você é um extrator de texto especializado. Extraia TODO o texto do documento fornecido.
Mantenha a estrutura e formatação o máximo possível.
Se for uma receita culinária, identifique: nome, ingredientes, quantidades, modo de preparo e rendimento.
Se houver tabelas, converta-as para texto formatado.
Retorne APENAS o texto extraído, sem comentários adicionais.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extraia todo o texto deste arquivo chamado "${fileName}". Se for uma receita, organize as informações de forma clara.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI extraction error:", response.status, errorText);
    return `[Erro ao extrair texto de ${fileName}]`;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || `[Conteúdo não extraído de ${fileName}]`;
}
