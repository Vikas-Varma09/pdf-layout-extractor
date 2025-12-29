import { ACCOMMODATION_FIELDS } from './config.js';
import { extractTextareaFields } from '../../textareaFields/index.js';

// Compute single-choice value from spans at a given left on the same row.
// Returns 'X' when an X-like marker is present; otherwise returns the nearest text.
function computeSingleChoiceFromSpans(spans, label, left, topThreshold = 0.6, leftThreshold = 2.0) {
	if (!Array.isArray(spans)) return null;
	const labelSpan = spans.find(s => s.text === label);
	if (!labelSpan) return null;

	const candidates = spans
		.filter(s =>
			s.page === labelSpan.page &&
			Math.abs(s.top - labelSpan.top) < topThreshold &&
			Math.abs(s.left - left) <= leftThreshold &&
			typeof s.text === 'string' &&
			s.text.trim().length > 0
		)
		.map(s => ({ s, horiz: Math.abs(s.left - left) }))
		.sort((a, b) => a.horiz - b.horiz);

	if (candidates.length === 0) return null;

	const markers = new Set(['X', 'x', '✓', '✔', '☑', '☒', '■', '●', '1']);
	const marker = candidates.find(c => markers.has(String(c.s.text).trim()));
	if (marker) return 'X';

	return String(candidates[0].s.text).trim();
}

export function buildAccommodationGroup({ spans, checkbox, valueCols }) {
	const out = {};
	// Precompute textarea values once
	let textareaMap = null;
	for (const item of ACCOMMODATION_FIELDS) {
		const outputKey = item.outputKey || item.key;
		const sourceKey = item.key;
		let value = null;
		if (item.source === 'checkbox') {
			// Prefer checkbox aggregation if present; otherwise compute from spans at the configured position
			value = (checkbox && checkbox[outputKey] !== undefined)
				? checkbox[outputKey]
				: computeSingleChoiceFromSpans(spans, sourceKey, item.left);
		} else if (item.source === 'valueCols') {
			value = valueCols?.[sourceKey] ?? null;
		} else if (item.source === 'textarea') {
			if (!textareaMap) textareaMap = extractTextareaFields(spans);
			const textareaKey = item.textareaMapKey || sourceKey;
			value = textareaMap?.[textareaKey] ?? null;
		}
		out[outputKey] = value ?? null;
	}
	return out;
}


