const { convertHtmlToPdf } = require('../utils/pdfConverter');
const path = require('path');

const generatePdf = async (req, res) => {
  const { htmlContent } = req.body;

  if (!htmlContent) {
    return res.status(400).json({ message: 'HTML content is required' });
  }

  try {
    const outputPath = path.join(__dirname, '../pdfs/output.pdf');
    await convertHtmlToPdf(htmlContent, outputPath);
    res.download(outputPath);
  } catch (error) {
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
};

module.exports = { generatePdf };
