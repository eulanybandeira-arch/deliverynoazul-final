import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, fileName, knowledgeId } = await req.json();
    
    if (!filePath || !fileName || !knowledgeId) {
      return new Response(
        JSON.stringify({ error: "filePath, fileName, and knowledgeId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Downloading file: ${filePath}`);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("knowledge-docs")
      .download(filePath);

    if (downloadError) {
      console.error("Download error:", downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    const fileExtension = fileName.split(".").pop()?.toLowerCase();
    let extractedText = "";

    console.log(`Processing file type: ${fileExtension}`);

    if (fileExtension === "txt") {
      // Plain text - just read it
      extractedText = await fileData.text();
    } else if (fileExtension === "pdf") {
      // Use Lovable AI to extract text from PDF
      extractedText = await extractPdfWithAI(fileData, fileName);
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      // Use Lovable AI to extract text from Excel
      extractedText = await extractExcelWithAI(fileData, fileName);
    } else if (fileExtension === "docx" || fileExtension === "doc") {
      // Use Lovable AI to extract text from Word
      extractedText = await extractDocWithAI(fileData, fileName);
    } else {
      extractedText = `[Arquivo: ${fileName}] - Formato não suportado para extração automática`;
    }

    console.log(`Extracted ${extractedText.length} characters`);

    // Update knowledge base with extracted content
    const { error: updateError } = await supabase
      .from("knowledge_base")
      .update({ content: extractedText })
      .eq("id", knowledgeId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(`Failed to update knowledge base: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        extractedLength: extractedText.length,
        preview: extractedText.substring(0, 500) 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Extract document error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function extractPdfWithAI(fileData: Blob, fileName: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  // Convert PDF to base64
  const arrayBuffer = await fileData.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

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
          content: `Você é um extrator de texto especializado. Extraia TODO o texto do documento PDF fornecido.
Mantenha a estrutura e formatação o máximo possível.
Retorne APENAS o texto extraído, sem comentários adicionais.
Se houver tabelas, converta-as para texto formatado.
Se houver listas, mantenha os marcadores.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extraia todo o texto deste arquivo PDF chamado "${fileName}". Retorne apenas o conteúdo extraído.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 16000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI API error:", response.status, errorText);
    throw new Error(`AI extraction failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || `[Erro ao extrair texto de ${fileName}]`;
}

async function extractExcelWithAI(fileData: Blob, fileName: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  // Convert Excel to base64
  const arrayBuffer = await fileData.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

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
          content: `Você é um extrator de dados especializado em planilhas Excel.
Extraia TODO o conteúdo da planilha Excel fornecida.
Para cada aba/sheet, identifique o nome e liste os dados.
Converta tabelas para texto formatado legível.
Mantenha cabeçalhos e estrutura das colunas.
Retorne APENAS os dados extraídos, sem comentários.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extraia todo o conteúdo desta planilha Excel chamada "${fileName}". Retorne os dados de todas as abas em formato texto estruturado.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 16000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI API error:", response.status, errorText);
    throw new Error(`AI extraction failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || `[Erro ao extrair dados de ${fileName}]`;
}

async function extractDocWithAI(fileData: Blob, fileName: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  // Convert Doc to base64
  const arrayBuffer = await fileData.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

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
          content: `Você é um extrator de texto especializado em documentos Word.
Extraia TODO o texto do documento Word fornecido.
Mantenha a estrutura, parágrafos e formatação.
Se houver tabelas, converta-as para texto formatado.
Retorne APENAS o texto extraído, sem comentários.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extraia todo o texto deste documento Word chamado "${fileName}". Retorne apenas o conteúdo extraído.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 16000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI API error:", response.status, errorText);
    throw new Error(`AI extraction failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || `[Erro ao extrair texto de ${fileName}]`;
}
