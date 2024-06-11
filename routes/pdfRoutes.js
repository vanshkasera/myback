const express = require('express');
const router = express.Router();
const { generatePdf } = require('../controllers/pdfController');

// @route   POST /api/pdf
// @desc    Generate PDF from HTML
// @access  Public
router.post('/', generatePdf);

module.exports = router;
