/**
 * PDF to Images Renderer - Converts PDF pages to images
 */

import path from 'path';
import fs from 'fs-extra';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePdftocairo() {
	const exe = process.platform === 'win32' ? 'pdftocairo.exe' : 'pdftocairo';
	const popplerPath = process.env.POPPLER_PATH || '';
	if (popplerPath) return path.join(popplerPath, exe);
	return exe;
}

function buildSessionId(pdfPath) {
	const base = path.basename(pdfPath, path.extname(pdfPath));
	return `${base}-${Date.now()}`;
}

export async function renderPdfToImages(pdfPath, options = {}) {
	const dpi = Number(options.dpi || 350);
	const outputRoot = options.outputRoot || path.join(os.tmpdir(), 'pdf-images');
	const sessionId = options.sessionId || buildSessionId(pdfPath);
	const outDir = path.join(outputRoot, sessionId);
	await fs.ensureDir(outDir);

	const bin = resolvePdftocairo();
	const outPrefix = path.join(outDir, 'page');
	const args = ['-png', '-r', String(dpi), pdfPath, outPrefix];
	const proc = spawnSync(bin, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
	if (proc.error) {
		throw proc.error;
	}
	if (proc.status !== 0) {
		const msg = (proc.stderr || proc.stdout || '').slice(0, 4000);
		throw new Error(`pdftocairo failed with code ${proc.status}: ${msg}`);
	}

	const files = await fs.readdir(outDir);
	const pages = files
		.filter((f) => /^page-\d+\.png$/i.test(f))
		.map((f) => path.join(outDir, f))
		.sort((a, b) => {
			const na = Number(a.match(/page-(\d+)\.png$/i)[1]);
			const nb = Number(b.match(/page-(\d+)\.png$/i)[1]);
			return na - nb;
		});

	return {
		sessionId,
		outputDir: outDir,
		dpi,
		pages
	};
}

