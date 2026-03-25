import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, contentType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Extracting recipe from content type:", contentType);

    const messages: any[] = [
      {
        role: "system",
        content: `Você é um especialista em extrair receitas culinárias de documentos e imagens.
Sua tarefa é analisar CUIDADOSAMENTE o conteúdo e extrair TODOS os ingredientes mencionados.

INSTRUÇÕES CRÍTICAS:
1. Leia o documento COMPLETO antes de responder
2. Identifique CADA ingrediente mencionado, mesmo que esteja em formato de lista ou parágrafo
3. Para cada ingrediente, extraia nome, quantidade e unidade
4. Se a quantidade não estiver clara, estime com base no contexto culinário

Retorne um JSON com esta estrutura EXATA:
{
  "name": "Nome da receita (ex: Strogonoff de Frango)",
  "yield": número de porções (se não informado, estime: 4-6 para pratos principais, 10-12 para bolos),
  "category": "salgado" | "doce" | "bebida" | "sobremesa" | "pão" | "massa",
  "ingredients": [
    {
      "name": "frango",
      "quantity": 500,
      "unit": "g"
    }
  ],
  "instructions": "Modo de preparo resumido"
}

REGRAS PARA INGREDIENTES:
- Nome: use singular, minúsculo, apenas o ingrediente base (ex: "peito de frango" → "frango", "creme de leite" → "creme de leite")
- Quantidade: sempre número (ex: "meia xícara" → 0.5, "1 e 1/2" → 1.5)
- Unidade: padronize para g, kg, mL, L, unidade, colher de sopa, colher de chá, xícara

CONVERSÕES COMUNS:
- 1 xícara farinha = 120g
- 1 xícara açúcar = 200g  
- 1 colher de sopa = 15mL
- 1 colher de chá = 5mL
- 1 lata leite condensado = 395g
- 1 caixinha creme de leite = 200g

IMPORTANTE: Se o documento contém uma receita, SEMPRE retorne ingredientes. Array vazio só se realmente não houver ingredientes no texto.

Retorne APENAS o JSON válido, sem markdown ou texto adicional.`
      }
    ];

    // Handle different content types - always use vision for better extraction
    if (contentType === "image" || contentType === "document") {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Analise esta receita e extraia TODOS os ingredientes com suas quantidades e unidades. Seja minucioso - não deixe nenhum ingrediente de fora:" },
          { type: "image_url", image_url: { url: content } }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: `Analise esta receita e extraia TODOS os ingredientes com suas quantidades e unidades. Seja minucioso:\n\n${content}`
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    console.log("AI Response:", aiResponse);

    // Parse JSON from response
    let recipe;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipe = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse recipe. Please try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Extracted recipe:", recipe);

    return new Response(
      JSON.stringify({ success: true, recipe }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error extracting recipe:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
