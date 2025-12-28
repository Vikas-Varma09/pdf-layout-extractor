import { ENERGY_EFFICIENCY_FIELDS } from './config.js';

function pickSingleChoiceOnRow(spans, rowLabel, options, topThreshold = 0.6, leftThreshold = 2.0, requireMarker = true, debug = false) {
	if (!Array.isArray(spans) || !rowLabel || !Array.isArray(options)) return null;
	const labelSpan = spans.find(s => s.text === rowLabel);
	if (!labelSpan) return null;
	const markers = new Set(['X', 'x', '✓', '✔', '☑', '☒', '■', '●', '1']);

	if (debug) {
		console.log('[singleChoiceRow] label:', rowLabel, 'page/top:', { page: labelSpan.page, top: labelSpan.top, left: labelSpan.left });
		console.log('[singleChoiceRow] topThreshold/leftThreshold:', { topThreshold, leftThreshold, requireMarker });
	}

	// Gather all marker spans on this page for debug / fallback logic
	const pageMarkers = spans
		.filter(s => s.page === labelSpan.page && typeof s.text === 'string' && markers.has(String(s.text).trim()))
		.map(s => ({ text: String(s.text).trim(), left: s.left, top: s.top }));
	if (debug) {
		console.log('[singleChoiceRow] pageMarkers count:', pageMarkers.length);
		console.log('[singleChoiceRow] pageMarkers (sample):', pageMarkers.slice(0, 20));
	}

	// Check for an explicit marker near each option left
	for (const opt of options) {
		const near = spans.find(s =>
			s.page === labelSpan.page &&
			Math.abs(s.top - labelSpan.top) < topThreshold &&
			Math.abs(s.left - opt.left) <= leftThreshold &&
			typeof s.text === 'string' &&
			markers.has(String(s.text).trim())
		);
		if (debug) {
			console.log('[singleChoiceRow] option:', opt, 'near:', near ? { text: near.text, left: near.left, top: near.top } : null);
		}
		if (near) return opt.value;
	}

	// Expanded-window fallback: some PDFs place the tick slightly below/above the label row.
	// If requireMarker is true, we still only return a value when a marker is found, but we widen the search.
	const expandedTop = Math.max(topThreshold * 3, 3.0);
	const expandedLeft = Math.max(leftThreshold * 3, 6.0);
	if (debug) {
		console.log('[singleChoiceRow] expanded search:', { expandedTop, expandedLeft });
	}

	let bestExpanded = null;
	for (const opt of options) {
		const nearbyMarkers = spans
			.filter(s =>
				s.page === labelSpan.page &&
				typeof s.text === 'string' &&
				markers.has(String(s.text).trim()) &&
				Math.abs(s.left - opt.left) <= expandedLeft &&
				Math.abs(s.top - labelSpan.top) <= expandedTop
			)
			.map(s => ({
				s,
				// Prefer close left match first, then close top match
				score: Math.abs(s.left - opt.left) + (Math.abs(s.top - labelSpan.top) * 0.25),
				dLeft: Math.abs(s.left - opt.left),
				dTop: Math.abs(s.top - labelSpan.top),
			}))
			.sort((a, b) => a.score - b.score);

		if (debug) {
			console.log('[singleChoiceRow] option expanded candidates:', opt.value, nearbyMarkers.slice(0, 5).map(c => ({ text: c.s.text, left: c.s.left, top: c.s.top, dLeft: c.dLeft, dTop: c.dTop, score: c.score })));
		}

		const cand = nearbyMarkers[0];
		if (cand && (!bestExpanded || cand.score < bestExpanded.score)) {
			bestExpanded = { opt, ...cand };
		}
	}

	if (bestExpanded) {
		if (debug) {
			console.log('[singleChoiceRow] picked (expanded):', { value: bestExpanded.opt.value, marker: { text: bestExpanded.s.text, left: bestExpanded.s.left, top: bestExpanded.s.top }, dLeft: bestExpanded.dLeft, dTop: bestExpanded.dTop });
		}
		return bestExpanded.opt.value;
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
				item.requireMarker ?? true,
				item.debug ?? false
			);
		}
		out[outputKey] = value ?? null;
	}
	return out;
}

export { ENERGY_EFFICIENCY_FIELDS };


