const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

// Acepta JSON y aumenta el límite si vas a mandar HTML grande
app.use(express.json({ limit: '10mb' }));

app.post('/generate-pdf', async (req, res) => {
  console.log('📩 POST /generate-pdf recibido');
  console.log('🧠 Headers:', req.headers);
  console.log('📦 Body:', req.body);
  
  const { html } = req.body;
  
  if (!html) {
    console.error('❌ No se recibió HTML en el cuerpo de la petición');
    return res.status(400).send({ error: 'Missing HTML content' });
  }

  let browser;
  try {
    console.log('🚀 Lanzando navegador Puppeteer...');
    
    // ✅ Configuración completa para Railway
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // ⭐ CRÍTICO: evita problemas de memoria compartida
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // ⭐ CRÍTICO: usa un solo proceso
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      // ⭐ IMPORTANTE: configuración de memoria
      defaultViewport: null,
      timeout: 30000 // 30 segundos timeout
    });
    
    console.log('✅ Navegador lanzado');
    
    const page = await browser.newPage();
    
    // ⭐ Configurar viewport para mejor rendimiento
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('📄 Cargando contenido HTML');
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 // timeout específico
    });
    
    console.log('🖨️ Generando PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      timeout: 30000 // timeout para PDF
    });
    
    console.log('✅ PDF generado. Cerrando navegador...');
    await browser.close();
    browser = null; // Limpiar referencia
    
    // Verifica que el PDF no esté vacío
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('❌ PDF vacío o no generado');
      return res.status(500).send({ error: 'PDF generation failed' });
    }

    // Enviar el PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="documento.pdf"',
      'Content-Length': pdfBuffer.length
    });
    
    console.log('📤 Enviando PDF al cliente');
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('🔥 Error en el proceso de generación de PDF:', error);
    
    // ⭐ IMPORTANTE: asegurar que el navegador se cierre en caso de error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error cerrando navegador:', closeError);
      }
    }
    
    res.status(500).send({
      error: 'Error generando PDF',
      details: error.message
    });
  }
});

// Health check endpoint para Railway
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'OK', timestamp: new Date().toISOString() });
});

// Puerto configurado por Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor escuchando en el puerto ${PORT}`);
});

// ⭐ Manejo de señales para cierre limpio
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});
