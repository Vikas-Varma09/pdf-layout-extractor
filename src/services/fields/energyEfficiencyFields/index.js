import { ENERGY_EFFICIENCY_FIELDS } from './config.js';

function pickSingleChoiceOnRow(spans, rowLabel, options, topThreshold = 0.6, leftThreshold = 2.0, requireMarker = true) {
	if (!Array.isArray(spans) || !rowLabel || !Array.isArray(options)) return null;
	const labelSpan = spans.find(s => s.text === rowLabel);
	if (!labelSpan) return null;
	const markers = new Set(['X', 'x', '✓', '✔', '☑', '☒', '■', '●', '1']);

	// Check for an explicit marker near each option left
	for (const opt of options) {
		const near = spans.find(s =>
			s.page === labelSpan.page &&
			Math.abs(s.top - labelSpan.top) < topThreshold &&
			Math.abs(s.left - opt.left) <= leftThreshold &&
			typeof s.text === 'string' &&
			markers.has(String(s.text).trim())
		);
		if (near) return opt.value;
	}

	// If an explicit marker is required, return null when none found
	if (requireMarker) return null;

	// Fallback: pick the nearest non-empty text to any option and return its option value (legacy behavior)
	let best = null;
	for (const opt of options) {
		const cand = spans
			.filter(s =>
				s.page === labelSpan.page &&
				Math.abs(s.top - labelSpan.top) < topThreshold &&
				Math.abs(s.left - opt.left) <= leftThreshold &&
				typeof s.text === 'string' &&
				s.text.trim().length > 0
			)
			.map(s => ({ s, dist: Math.abs(s.left - opt.left) }))
			.sort((a, b) => a.dist - b.dist)[0];
		if (cand && (!best || cand.dist < best.dist)) {
			best = { opt, cand };
		}
	}
	return best ? best.opt.value : null;
}

export function buildEnergyEfficiencyGroup({ spans, valueCols }) {
	const out = {};
	for (const item of ENERGY_EFFICIENCY_FIELDS) {
		const outputKey = item.outputKey || item.key;
		const sourceKey = item.key;
		let value = null;
		if (item.source === 'valueCols') {
			value = valueCols?.[sourceKey] ?? null;
		} else if (item.source === 'singleChoiceRow') {
			value = pickSingleChoiceOnRow(
				spans,
				sourceKey,
				item.options || [],
				item.topThreshold ?? 0.6,
				item.leftThreshold ?? 2.0,
				item.requireMarker ?? true
			);
		}
		out[outputKey] = value ?? null;
	}
	return out;
}

export { ENERGY_EFFICIENCY_FIELDS };


