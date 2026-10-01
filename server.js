const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

app.post('/api/convert', async (req, res) => {
    try {
        const { html, filename } = req.body;
        if (!html) {
            return res.status(400).send('HTML content is required');
        }

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Wait until all resources are loaded
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true, // This preserves CSS backgrounds
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        await browser.close();

        const downloadName = filename ? (filename.endsWith('.pdf') ? filename : `${filename}.pdf`) : 'converted.pdf';
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${downloadName}"`,
            'Content-Length': pdfBuffer.length
        });

        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
