/**
 * OCR Service - Integrated OCR functionality
 * Uses the integrated OCR modules instead of external service
 */

import { extractRawTextFromPDF } from './ocr/index.js';

/**
 * Extract raw text from PDF using integrated OCR
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<string|null>} Raw text content or null if OCR fails
 */
export async function extractRawTextFromOCR(pdfBuffer) {
	try {
		return await extractRawTextFromPDF(pdfBuffer);
	} catch (error) {
		console.error('OCR extraction error:', error.message);
		// Don't fail the entire extraction if OCR fails
		return null;
	}
}

