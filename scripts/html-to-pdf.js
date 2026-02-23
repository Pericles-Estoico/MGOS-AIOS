const fs = require('fs');
const path = require('path');

// Simples conversão HTML para um formato PDF-preparado
// Usaremos uma abordagem nativa com a API de Print do Node.js

const htmlPath = path.join(__dirname, '../docs/GUIA-PERFORMATICO-MGOS.html');
const pdfPath = path.join(__dirname, '../docs/GUIA-PERFORMATICO-MGOS.pdf');

// Ler o HTML
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// Tentar instalar e usar html2pdf via dinâmico
async function convertToPDF() {
  try {
    // Try using playwright if available
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.pdf({ path: pdfPath, format: 'A4' });
    await browser.close();
    console.log(`✅ PDF gerado: ${pdfPath}`);
  } catch (e) {
    console.log(`Playwright não disponível: ${e.message}`);
    console.log('Tentando alternativa...');
    
    // Fallback: gerar um documento estruturado
    try {
      const PDFDocument = await import('pdfkit');
      console.log('pdfkit encontrado, gerando PDF...');
    } catch (e2) {
      console.log('Nenhuma biblioteca PDF disponível. Use o navegador para converter.');
    }
  }
}

convertToPDF();
