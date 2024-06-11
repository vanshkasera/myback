const puppeteer = require('puppeteer');

const convertHtmlToPdf = async (htmlContent, outputPath) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
    });

    await browser.close();
    return outputPath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Could not generate PDF');
  }
};

module.exports = { convertHtmlToPdf };
