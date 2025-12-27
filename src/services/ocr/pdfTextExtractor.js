/**
 * PDF Text Extractor - Extracts text from PDF files
 */

import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedPdfParse = null;

async function resolvePdfParse() {
	// Try dynamic import for ES modules
	try {
		const mod = await import('pdf-parse');
		
		// pdf-parse exports PDFParse (capitalized) as a class/function
		if (mod.PDFParse && typeof mod.PDFParse === 'function') {
			return mod.PDFParse;
		}
		
		// Try default export
		if (mod.default && typeof mod.default === 'function') {
			return mod.default;
		}
		
		// Try unwrapping nested exports
		const fn = unwrapPdfParse(mod);
		if (fn) return fn;
		
		throw new Error('pdf-parse module did not export a function');
	} catch (e) {
		console.error('Failed to load pdf-parse:', e.message);
		return null;
	}
}

function unwrapPdfParse(mod) {
	// Unwrap nested default exports up to a few levels
	let cur = mod;
	let guard = 5;
	while (cur && typeof cur === 'object' && 'default' in cur && guard-- > 0) {
		cur = cur.default;
	}
	if (typeof cur === 'function') return cur;
	// Some builds might attach under known keys
	if (cur && typeof cur.pdfParse === 'function') return cur.pdfParse;
	if (cur && typeof cur.parse === 'function') return cur.parse;
	return null;
}

export async function extractTextFromPDF(filePath) {
	const dataBuffer = await fs.promises.readFile(filePath);
	if (!cachedPdfParse) {
		cachedPdfParse = await resolvePdfParse();
	}
	try {
		const Parser = cachedPdfParse;
		if (!Parser || typeof Parser !== 'function') {
			throw new Error('pdf-parse module did not export a function');
		}
		// PDFParse is a class, so we need to instantiate it or call it
		// Check if it's a class constructor or a function
		const result = await Parser(dataBuffer);
		// Combine text; pdf-parse returns .text as a single large string
		return (result && result.text) ? result.text : '';
	} catch (e) {
		// Fallback to Poppler pdftotext CLI if available
		const text = extractTextWithPoppler(filePath);
		if (text != null) return text;
		throw e;
	}
}

function extractTextWithPoppler(pdfPath) {
	try {
		const popplerPath = process.env.POPPLER_PATH || '';
		const exe = process.platform === 'win32' ? 'pdftotext.exe' : 'pdftotext';
		const bin = popplerPath ? path.join(popplerPath, exe) : exe;
		const args = ['-layout', '-nopgbrk', pdfPath, '-'];
		const proc = spawnSync(bin, args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
		if (proc.error) {
			return null;
		}
		if (proc.status !== 0) {
			return null;
		}
		return proc.stdout || '';
	} catch {
		return null;
	}
}

