const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.text({ type: 'text/html' }));

app.post('/generar-pdf', async (req, res) => {
  const html = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const bodyHandle = await page.$('body');
    const boundingBox = await bodyHandle.boundingBox();
    const height = Math.ceil(boundingBox.height) + 50;

    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: '794px',
      height: `${height}px`,
      pageRanges: '1'
    });

    await browser.close();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="documento.pdf"',
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).send('Error interno al generar el PDF');
  }
});

app.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});
