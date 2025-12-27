/**
 * Integrated OCR Service - Extracts raw text from PDF using OCR
 */

import fs from 'fs';
import { extractTextFromPDF } from './pdfTextExtractor.js';
import { renderPdfToImages } from './pdfToImages.js';
import { ocrWithPaddle } from './paddleOcr.js';
import os from 'os';
import path from 'path';

function normalizeRawText(input) {
	// Preserve line structure but remove excess spaces and blank lines
	const s = String(input || '').replace(/\r\n/g, '\n');
	const lines = s.split('\n').map((line) => line.replace(/[ \t]+/g, ' ').trim());
	const compact = [];
	for (const ln of lines) {
		if (ln === '' && compact.length > 0 && compact[compact.length - 1] === '') {
			continue; // collapse multiple blank lines
		}
		compact.push(ln);
	}
	return compact.join('\n').trim();
}

/**
 * Extract raw text from PDF buffer
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<string|null>} Raw text content or null if extraction fails
 */
export async function extractRawTextFromPDF(pdfBuffer) {
	let tempFilePath = null;
	try {
		// Ensure we have a proper Buffer
		// The buffer should already be a proper Buffer from the controller, but handle edge cases
		let buffer;
		if (Buffer.isBuffer(pdfBuffer)) {
			// Use the buffer directly if it's already a Buffer
			buffer = pdfBuffer;
		} else if (pdfBuffer instanceof Uint8Array) {
			// Convert Uint8Array to Buffer
			buffer = Buffer.from(pdfBuffer);
		} else if (pdfBuffer instanceof ArrayBuffer) {
			// Convert ArrayBuffer to Buffer
			buffer = Buffer.from(pdfBuffer);
		} else {
			// Try to create Buffer from whatever it is
			buffer = Buffer.from(pdfBuffer);
		}
		
		// Verify buffer is not empty
		if (!buffer || buffer.length === 0) {
			console.error('PDF buffer validation failed:', {
				isBuffer: Buffer.isBuffer(pdfBuffer),
				type: typeof pdfBuffer,
				constructor: pdfBuffer?.constructor?.name,
				length: pdfBuffer?.length,
				bufferLength: buffer?.length
			});
			throw new Error('PDF buffer is empty');
		}
		
		// Verify it looks like a PDF (starts with PDF header) - but don't fail, just warn
		if (buffer.length < 4 || buffer.toString('ascii', 0, 4) !== '%PDF') {
			console.warn('Buffer does not appear to be a valid PDF (missing PDF header), but continuing anyway');
		}
		
		// Write buffer to temporary file
		const tempDir = os.tmpdir();
		tempFilePath = path.join(tempDir, `pdf-extract-${Date.now()}.pdf`);
		await fs.promises.writeFile(tempFilePath, buffer);
		
		// Verify file was written correctly
		const stats = await fs.promises.stat(tempFilePath);
		if (stats.size === 0) {
			throw new Error('Temporary PDF file is empty after write');
		}
		if (stats.size !== buffer.length) {
			console.warn(`File size mismatch: buffer=${buffer.length}, file=${stats.size}`);
		}

		// Try to extract text from PDF first (for digital PDFs)
		let rawText = '';
		try {
			rawText = await extractTextFromPDF(tempFilePath);
		} catch (error) {
			console.log('PDF text extraction failed, falling back to OCR:', error.message);
		}

		// If little or no text extracted, use OCR
		if (!rawText || rawText.trim().length < 100) {
			try {
				// Render PDF to images
				const renderRes = await renderPdfToImages(tempFilePath, { dpi: 350 });
				
				// OCR all pages
				const pageMap = {};
				renderRes.pages.forEach((pagePath, index) => {
					pageMap[`page_${index + 1}`] = pagePath;
				});
				
				const ocrResults = await ocrWithPaddle(pageMap, { 
					sessionId: renderRes.sessionId,
					lang: 'en'
				});
				
				// Combine all OCR results into single text
				rawText = Object.values(ocrResults)
					.map(text => String(text || '').trim())
					.filter(text => text.length > 0)
					.join('\n\n');
			} catch (ocrError) {
				console.error('OCR failed:', ocrError);
				// Return null if both methods fail
				return null;
			}
		}

		return normalizeRawText(rawText);
	} catch (error) {
		console.error('OCR extraction error:', error);
		return null;
	} finally {
		// Cleanup temporary file
		if (tempFilePath) {
			try {
				await fs.promises.unlink(tempFilePath);
			} catch (e) {
				// Ignore cleanup errors
			}
		}
	}
}

