import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

function roundToTwo(num) {
	return Math.round(num * 100) / 100;
}

/**
 * Extract text spans from a PDF buffer with normalized positions
 * @param {Buffer} pdfBuffer
 * @returns {Promise<Array<{ text: string, left: number, top: number, page: number, fontSize?: number }>>}
 */
export async function extractSpansFromPdfBuffer(pdfBuffer) {
	if (!pdfBuffer || !pdfBuffer.length) {
		throw new Error('Empty PDF buffer');
	}

	// pdfjs-dist requires Uint8Array, not Node Buffer
	const uint8 = new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength);
	const loadingTask = pdfjsLib.getDocument({ data: uint8 });
	const pdfDocument = await loadingTask.promise;

	const allSpans = [];

	for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
		const page = await pdfDocument.getPage(pageNum);
		const viewport = page.getViewport({ scale: 1.0 });
		const pageWidth = viewport.width;
		const pageHeight = viewport.height;

		const textContent = await page.getTextContent({
			// Keep default combining; we only need item.str and transform
		});

		for (const item of textContent.items) {
			// transform: [a, b, c, d, e, f] with e=x, f=y in PDF units (origin bottom-left)
			const x = item.transform?.[4] ?? 0;
			const y = item.transform?.[5] ?? 0;
			// Approximate font size using scale components
			const scaleX = Math.abs(item.transform?.[0] ?? 0);
			const scaleY = Math.abs(item.transform?.[3] ?? 0);
			const fontSize = roundToTwo(Math.max(scaleX, scaleY));

			const leftPct = (x / pageWidth) * 100;
			const topPct = (1 - y / pageHeight) * 100;

			allSpans.push({
				text: String(item.str ?? '').trim(),
				left: roundToTwo(leftPct),
				top: roundToTwo(topPct),
				page: pageNum,
				fontSize,
			});
		}
	}

	return allSpans;
}

