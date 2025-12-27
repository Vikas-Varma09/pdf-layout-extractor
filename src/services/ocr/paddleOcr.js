/**
 * PaddleOCR Integration - Runs OCR on images using Python PaddleOCR
 */

import path from 'path';
import fs from 'fs-extra';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function ocrWithPaddle(sectionToImageMap, options = {}) {
	const sessionId = options.sessionId || String(Date.now());
	const tmpRoot = options.tmpRoot || path.join(os.tmpdir(), 'ocr-tmp');
	await fs.ensureDir(tmpRoot);
	const inputPath = path.join(tmpRoot, `${sessionId}-paddle-input.json`);
	await fs.writeJson(inputPath, sectionToImageMap, { spaces: 0 });

	const pythonExe = process.env.PYTHON_EXE || 'python';
	// Python script should be in the root python folder
	const scriptPath = path.join(process.cwd(), 'python', 'paddle_ocr.py');
	const args = [scriptPath, '--input', inputPath, '--lang', options.lang || 'en'];
	const proc = spawnSync(pythonExe, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
	if (proc.error) {
		throw proc.error;
	}
	const stdout = (proc.stdout || '').trim();
	const stderr = (proc.stderr || '').trim();
	if (proc.status !== 0) {
		throw new Error(`Python exited ${proc.status}: ${stderr || stdout}`.slice(0, 4000));
	}
	let payload = null;
	try {
		payload = JSON.parse(stdout);
	} catch (e) {
		throw new Error(`Invalid OCR output: ${stdout.slice(0, 4000)}`);
	}
	if (!payload || payload.success !== true) {
		const data = payload && (payload.data || payload.result);
		return typeof data === 'object' && data ? data : {};
	}
	return payload.data || {};
}

