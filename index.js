const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json({ limit: '10mb' }));

app.post('/generate-pdf', async (req, res) => {
  const { html } = req.body;

  if (!html) {
    return res.status(400).send('Falta HTML');
  }

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
      'Content-Disposition': 'inline; filename=documento.pdf'
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).send('Error interno');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});
