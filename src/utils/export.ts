import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Recipe, BusinessIdentity, BusinessMetrics } from "@/types/pricing";
import { formatCurrency } from "./pricing";

// Helper to get current date/time for export
const getExportDate = () => new Date().toLocaleString('pt-BR');

export const exportRecipeToPDF = async (
  recipe: Recipe,
  identity: BusinessIdentity,
  metrics: BusinessMetrics,
  totalCost: number,
  unitCost: number,
  suggestedPrice: number,
  totalRevenue: number,
) => {
  const doc = new jsPDF();
  const exportDate = getExportDate();
  const businessName = identity.razaoSocial || identity.nomeCompleto || "Nome não definido";
  const documentLabel = identity.type === 'cnpj' ? 'CNPJ' : identity.type === 'cpf' ? 'CPF' : 'Documento';

  // Fetch user avatar from Supabase
  let logoUrl = '';
  try {
    const { data: { user } } = await (await import("@/integrations/supabase/client")).supabase.auth.getUser();
    if (user) {
      const { data } = await (await import("@/integrations/supabase/client")).supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.avatar_url) {
        logoUrl = data.avatar_url;
      }
    }
  } catch (error) {
    console.error('Error fetching avatar:', error);
  }

  // Logo (if available)
  if (logoUrl) {
    doc.addImage(logoUrl, 'PNG', 15, 10, 30, 30);
  }

  // Header
  doc.setFontSize(18);
  doc.text('Ficha Técnica da Receita', logoUrl ? 50 : 15, 20);
  doc.setFontSize(12);
  doc.text(businessName, logoUrl ? 50 : 15, 28);
  doc.text(`${documentLabel}: ${identity.documento || ''}`, logoUrl ? 50 : 15, 35);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${exportDate}`, 15, 45);

  // Recipe Info
  doc.setFontSize(14);
  doc.text(`Receita: ${recipe.name}`, 15, 55);
  doc.setFontSize(10);
  doc.text(`Rendimento: ${recipe.yield} unidades`, 15, 62);

  // Ingredients
  const ingredientsData = recipe.ingredients.map(ing => [
    ing.name,
    `${ing.packageQty} ${ing.unit}`,
    formatCurrency(ing.unitPrice),
    `${ing.usedQty} ${ing.unit}`,
    ing.loss ? `${ing.loss}%` : '-',
    formatCurrency(ing.usedValue),
  ]);

  autoTable(doc, {
    startY: 70,
    head: [['Ingrediente', 'Qtd Comprada', 'Valor Pago', 'Qtd Usada', 'Perda', 'Custo']],
    body: ingredientsData,
    theme: 'striped',
    headStyles: { fillColor: [26, 188, 156] }, // Primary color
  });

  // Packaging
  const packagingData = recipe.packaging.map(pkg => [
    pkg.name,
    `${pkg.packageQty} ${pkg.unit}`,
    formatCurrency(pkg.packagePrice),
    `${pkg.usedQty} ${pkg.unit}`,
    formatCurrency(pkg.usedValue),
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Embalagem', 'Qtd Comprada', 'Valor Pago', 'Qtd Usada', 'Custo']],
    body: packagingData,
    theme: 'striped',
    headStyles: { fillColor: [26, 188, 156] }, // Primary color
  });

  // Financial Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text('Resumo Financeiro', 15, finalY);

  const resultsData = [
    ['Custo Total', formatCurrency(totalCost)],
    ['Custo Unitário', formatCurrency(unitCost)],
    ['Margem de Lucro', `${recipe.profitMargin}%`],
    ['Preço Sugerido', formatCurrency(suggestedPrice)],
    ['Faturamento Estimado', formatCurrency(totalRevenue)],
  ];

  autoTable(doc, {
    startY: finalY + 5,
    body: resultsData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
    },
  });

  doc.save(`${recipe.name}_FichaTecnica_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportRecipeToExcel = (
  recipe: Recipe,
  identity: BusinessIdentity,
  metrics: BusinessMetrics, // Not directly used in Excel for now, but kept for consistency
  totalCost: number,
  unitCost: number,
  suggestedPrice: number,
  totalRevenue: number,
) => {
  const wb = XLSX.utils.book_new();
  const exportDate = getExportDate();
  const businessName = identity.razaoSocial || identity.nomeCompleto || "Nome não definido";
  const documentLabel = identity.type === 'cnpj' ? 'CNPJ' : identity.type === 'cpf' ? 'CPF' : 'Documento';

  // Sheet 1: Summary
  const resumoData = [
    ['Calculadora de Precificação - Resumo'],
    [''],
    ['Estabelecimento:', businessName],
    [documentLabel, identity.documento || ''],
    ['Data de Geração:', exportDate],
    [''],
    ['Receita:', recipe.name],
    ['Rendimento:', recipe.yield, 'unidades'],
    [''],
    ['RESUMO FINANCEIRO'],
    ['Custo Total', totalCost],
    ['Custo Unitário', unitCost],
    ['Margem de Lucro', recipe.profitMargin, '%'],
    ['Preço Sugerido', suggestedPrice],
    ['Faturamento Estimado', totalRevenue],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

  // Sheet 2: Ingredients
  const ingredientesData = [
    ['Ingrediente', 'Qtd Comprada', 'Unidade', 'Valor Pago', 'Qtd Usada', 'Perda (%)', 'Custo Utilizado'],
    ...recipe.ingredients.map(ing => [
      ing.name,
      ing.packageQty,
      ing.unit,
      ing.unitPrice,
      ing.usedQty,
      ing.loss || 0,
      ing.usedValue,
    ]),
  ];
  const wsIngredientes = XLSX.utils.aoa_to_sheet(ingredientesData);
  XLSX.utils.book_append_sheet(wb, wsIngredientes, 'Ingredientes');

  // Sheet 3: Packaging
  const embalagemData = [
    ['Embalagem', 'Qtd Comprada', 'Unidade', 'Valor Pago', 'Qtd Usada', 'Custo Utilizado'],
    ...recipe.packaging.map(pkg => [
      pkg.name,
      pkg.packageQty,
      pkg.unit,
      pkg.packagePrice,
      pkg.usedQty,
      pkg.usedValue,
    ]),
  ];
  const wsEmbalagem = XLSX.utils.aoa_to_sheet(embalagemData);
  XLSX.utils.book_append_sheet(wb, wsEmbalagem, 'Embalagens');

  XLSX.writeFile(wb, `${recipe.name}_Insumos_${new Date().toISOString().split('T')[0]}.xlsx`);
};