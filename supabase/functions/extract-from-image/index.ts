import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedItem {
  name: string;
  quantity?: number;
  unit?: string;
  brand?: string;
  price?: number;
  category?: string;
  conversionFactor?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, extractionType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Imagem não fornecida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing image extraction, type:", extractionType);

    const systemPrompt = `Você é um assistente especializado em analisar fotos de notas fiscais e listas de compras brasileiras.
Extraia TODOS os itens visíveis na imagem.

REGRAS CRÍTICAS PARA EXTRAÇÃO:

1. QUANTITY (Qtd. Comprada): 
   - Este valor deve vir ESTRITAMENTE da coluna de quantidade da nota fiscal (identificada como 'Qtd', 'Qtde', 'Quant').
   - Se a coluna mostra '1 Pc' ou '1 Un', quantity = 1.
   - NÃO extraia este número do texto da descrição do produto.

2. CONVERSION_FACTOR (Conteúdo Unitário da embalagem):
   - Este valor deve ser extraído DE DENTRO do texto da descrição do produto.
   - Procure por padrões como: 'C/50', '50Un', '50 Un', '1000 Un', 'Pc 24', 'C/25', 'Pc 50Un', '100 Un'.
   - Exemplo: "Guardanapo Florax 22x19 Pc 50Un" → conversionFactor = 50
   - Exemplo: "Saco P/ Din Dim 5x23 Segplast Cm 1000 Un" → conversionFactor = 1000
   - Exemplo: "Kit SobreTampa Rioplastic 140 ML C/25 Und" → conversionFactor = 25
   - Se NÃO houver indicador de quantidade na descrição (ex: 'Água Mineral'), conversionFactor = 1.

3. PRICE (Valor do Pacote):
   - Valor unitário ou total mostrado na nota fiscal para aquele item.

4. CATEGORY (Categoria):
  - "insumos" para ingredientes culinários (farinha, açúcar, ovos, leite, manteiga, óleo, sal, temperos, carnes, legumes, frutas, etc.)
  - "bebidas" para bebidas (água, refrigerante, suco, cerveja, vinho, café, chá, etc.)
  - "embalagens" para embalagens e utensílios (caixas, sacolas, papel alumínio, filme plástico, guardanapos, copos, pratos, sacos, potes, etc.)
  - "limpeza" para produtos de limpeza (detergente, desinfetante, sabão, esponja, pano, vassoura, etc.)

EXEMPLO DE VALIDAÇÃO:
Item: "Guardanapo Florax 22x19 Pc 50Un" com quantidade na coluna = 1
- quantity: 1 (da coluna de quantidade)
- conversionFactor: 50 (extraído de "50Un" na descrição)
- NÃO INVERTA ESSES VALORES!

Responda APENAS com um JSON válido no formato:
{"items": [{"name": "...", "quantity": 1, "unit": "un", "brand": "", "price": 0, "category": "embalagens", "conversionFactor": 1}]}

Se não conseguir identificar algum campo, use valores padrão (quantity: 1, unit: "un", brand: "", price: 0, category: "insumos", conversionFactor: 1).
NÃO inclua explicações, apenas o JSON.`;

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
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta imagem e extraia os itens/produtos visíveis:",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
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
        JSON.stringify({ error: "Erro ao processar imagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);

    // Parse the JSON response
    let extractedItems: ExtractedItem[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        extractedItems = parsed.items || [];
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Não foi possível extrair itens da imagem. Tente com uma foto mais clara.",
          rawResponse: content 
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Extracted items:", extractedItems.length);

    return new Response(
      JSON.stringify({ items: extractedItems, success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Extract from image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
