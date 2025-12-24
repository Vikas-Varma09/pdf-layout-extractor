export function isNumericText(text) {
	if (typeof text !== 'string') return false;
	const trimmed = text.trim();
	// Entire string must be a number (integer or decimal). No guessing of units or formats.
	return /^-?\d+(\.\d+)?$/.test(trimmed);
}

// Fields that represent checkbox-style selections where an "X" denotes yes/selected
const CHECKBOX_FIELDS = new Set([
	'Detached House',
	'Semi-Detached House',
	'Terraced House',
	'Bungalow',
	'Flat',
	'Maisonette',
]);

function normalizeCheckboxMark(text) {
	const t = String(text ?? '').trim();
	// Some PDFs render a tick/cross as various glyphs or even "1"
	// Map any known checkbox-like markers to "X"
	const markers = new Set(['1', 'X', 'x', '✓', '✔', '☑', '☒', '■', '●']);
	if (markers.has(t)) return 'X';
	return t;
}

/**
 * Map hardcoded field labels to nearest right-hand answers within the same row.
 * Logs label and chosen answer positions to console.
 *
 * @param {Array<{ page: number, top: number, spans: Array<{ text: string, left: number, top: number, page: number }> }>} rows
 * @param {Array<string>} fields
 * @returns {Record<string, string|null>}
 */
export function mapFieldsToValues(rows, fields) {
	const result = {};
	if (!Array.isArray(rows) || rows.length === 0) {
		for (const field of fields) {
			console.log(`[extract] Field "${field}": No rows available -> null`);
			result[field] = null;
		}
		return result;
	}

	// Flatten span list with row reference for quick lookup
	const spanEntries = [];
	for (const row of rows) {
		for (const span of row.spans) {
			spanEntries.push({ span, row });
		}
	}

	for (const field of fields) {
		// Find label span exact match
		const labelEntry = spanEntries.find(e => e.span.text === field);

		if (!labelEntry) {
			console.log(`[extract] Field "${field}": Label not found -> null`);
			result[field] = null;
			continue;
		}

		const labelSpan = labelEntry.span;
		const labelRow = labelEntry.row;
		console.log(
			`[extract] Label "${field}": page=${labelSpan.page}, left=${labelSpan.left}, top=${labelSpan.top}`
		);

		// Candidates to the right within the same row
		const rightCandidates = labelRow.spans.filter(s => s.left > labelSpan.left);

		if (rightCandidates.length === 0) {
			console.log(`[extract] Field "${field}": No right-hand spans -> null`);
			result[field] = null;
			continue;
		}

		const numericCandidates = rightCandidates.filter(c => isNumericText(c.text));

		function horizontalDistance(c) {
			return Math.abs(c.left - labelSpan.left);
		}

		let chosen = null;
		if (numericCandidates.length > 0) {
			chosen = numericCandidates.reduce((best, curr) => {
				return horizontalDistance(curr) < horizontalDistance(best) ? curr : best;
			});
		} else {
			chosen = rightCandidates.reduce((best, curr) => {
				return horizontalDistance(curr) < horizontalDistance(best) ? curr : best;
			});
		}

		if (!chosen) {
			console.log(`[extract] Field "${field}": No suitable answer -> null`);
			result[field] = null;
			continue;
		}

		console.log(
			`[extract] Answer for "${field}": "${chosen.text}" at page=${chosen.page}, left=${chosen.left}, top=${chosen.top}`
		);
		let value = String(chosen.text).trim();
		if (CHECKBOX_FIELDS.has(field)) {
			const normalized = normalizeCheckboxMark(value);
			if (normalized !== value) {
				console.log(`[extract] Checkbox normalization for "${field}": "${value}" -> "${normalized}"`);
			}
			value = normalized;
		}
		result[field] = value;
	}

	return result;
}


