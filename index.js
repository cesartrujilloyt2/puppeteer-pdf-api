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

  try {
    console.log('🚀 Lanzando navegador Puppeteer...');
    const browser = await puppeteer.launch({
      headless: 'new', // ✅ importante para Puppeteer moderno
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('✅ Navegador lanzado');
    const page = await browser.newPage();

    console.log('📄 Cargando contenido HTML');
    await page.setContent(html, { waitUntil: 'networkidle0' });

    console.log('🖨️ Generando PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    console.log('✅ PDF generado. Cerrando navegador...');
    await browser.close();

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
    res.status(500).send({
      error: 'Error generando PDF',
      details: error.message
    });
  }
});

// Puerto configurado por Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en el puerto ${PORT}`);
});
