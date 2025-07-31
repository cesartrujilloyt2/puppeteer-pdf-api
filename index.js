const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const app = express();

// Acepta JSON y aumenta el límite si vas a mandar HTML grande
app.use(express.json({ limit: '10mb' }));

// Middleware para logging de todas las requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} desde ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Health check solicitado desde:', req.ip);
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    message: 'Puppeteer PDF API funcionando correctamente'
  });
});

// Endpoint raíz
app.get('/', (req, res) => {
  console.log('🏠 Request al endpoint raíz');
  res.status(200).json({
    message: 'Puppeteer PDF API está funcionando',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      generatePdf: 'POST /generate-pdf'
    }
  });
});

app.post('/generate-pdf', async (req, res) => {
  console.log('📩 POST /generate-pdf recibido');
  
  const { html } = req.body;
  
  if (!html) {
    console.error('❌ No se recibió HTML en el cuerpo de la petición');
    return res.status(400).json({ error: 'Missing HTML content' });
  }

  let browser;
  try {
    console.log('🚀 Lanzando navegador Puppeteer...');
    
    // Configuración optimizada para Railway con Chromium ligero
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--disable-web-security'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      timeout: 30000
    });
    
    console.log('✅ Navegador lanzado');
    
    const page = await browser.newPage();
    
    console.log('📄 Cargando contenido HTML');
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('🖨️ Generando PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      timeout: 30000
    });
    
    console.log('✅ PDF generado. Cerrando navegador...');
    await browser.close();
    browser = null;
    
    // Verifica que el PDF no esté vacío
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('❌ PDF vacío o no generado');
      return res.status(500).json({ error: 'PDF generation failed' });
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
    
    // Asegurar que el navegador se cierre en caso de error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error cerrando navegador:', closeError);
      }
    }
    
    res.status(500).json({
      error: 'Error generando PDF',
      details: error.message
    });
  }
});

// Puerto configurado por Railway
const PORT = process.env.PORT || 3000;
console.log('🔧 Puerto desde variable de entorno:', process.env.PORT);
console.log('🔧 Puerto final que usaremos:', PORT);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor escuchando en el puerto ${PORT}`);
  console.log('🔧 Variables de entorno importantes:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  console.log('  - PORT:', process.env.PORT);
});

// Manejo de señales para cierre limpio
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  server.close(() => {
    console.log('🛑 Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  server.close(() => {
    console.log('🛑 Servidor cerrado correctamente');
    process.exit(0);
  });
});

console.log('🚀 Puppeteer PDF API iniciada correctamente');
