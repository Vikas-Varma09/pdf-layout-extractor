import { isNumericText } from '../../../fieldMapper.js';

/**
 * Find the numeric value located at a target left% on the same row as a label.
 *
 * @param {Array<{ text: string, left: number, top: number, page: number }>} spans
 * @param {{ label: string, targetLeft: number, topThreshold?: number, leftThreshold?: number }} config
 * @returns {string|null}
 */
export function extractValueAtLeft(spans, config) {
	const {
		label,
		labelIncludes,
		labelAltIncludes,
		debug = false,
		targetLeft,
		rowRightFallback = false,
		rowRightWithin = 60.0,
		topThreshold = 0.6,
		leftThreshold = 2.0,
		// Combine digits: either gather within a window or use explicit additional lefts
		combineAdjacentDigits = false,
		adjacentLeftWindow = 2.0,
		adjacentRightWindow = 2.0,
		additionalLefts = undefined,
	} = config;
	if (!Array.isArray(spans) || spans.length === 0) return null;
	if (!label || typeof targetLeft !== 'number') return null;

	const findByIncludes = (needle) => {
		if (!needle) return null;
		const n = String(needle).toLowerCase();
		return (
			spans.find(s => typeof s.text === 'string' && String(s.text).toLowerCase().includes(n)) ||
			null
		);
	};

	const labelSpan =
		spans.find(s => s.text === label) ||
		findByIncludes(labelIncludes) ||
		findByIncludes(labelAltIncludes);

	if (debug) {
		console.log('[valueCols] label:', label);
		console.log('[valueCols] labelIncludes:', labelIncludes ?? null);
		console.log('[valueCols] labelAltIncludes:', labelAltIncludes ?? null);
		console.log('[valueCols] matched labelSpan:', labelSpan ? { text: labelSpan.text, page: labelSpan.page, top: labelSpan.top, left: labelSpan.left } : null);
		console.log('[valueCols] targetLeft:', targetLeft, 'topThreshold:', topThreshold, 'leftThreshold:', leftThreshold);
		console.log('[valueCols] rowRightFallback:', rowRightFallback, 'rowRightWithin:', rowRightWithin);
	}
	if (!labelSpan) return null;

	// Helper to find best numeric near a given left on label row
	function pickNearLeft(left) {
		const candidates = spans
			.filter(s =>
				s.page === labelSpan.page &&
				Math.abs(s.top - labelSpan.top) < topThreshold &&
				Math.abs(s.left - left) <= leftThreshold &&
				isNumericText(String(s.text).trim())
			)
			.map(s => ({ s, leftDelta: Math.abs(s.left - left) }))
			.sort((a, b) => a.leftDelta - b.leftDelta);
		return candidates.length > 0 ? candidates[0].s : null;
	}

	// If combining via explicit additional lefts, pick at each and concatenate in left order
	if (combineAdjacentDigits && Array.isArray(additionalLefts) && additionalLefts.length > 0) {
		const allLefts = [targetLeft, ...additionalLefts].sort((a, b) => a - b);
		const tokens = [];
		for (const L of allLefts) {
			const tok = pickNearLeft(L);
			if (tok) tokens.push(String(tok.text).trim());
		}
		const joined = tokens.join('');
		if (joined.length > 0 && /^[0-9]+$/.test(joined)) return joined;
		// fall through to normal behavior if not purely digits
	}

	// If combining by window, gather all numeric tokens in the window to the right/left of targetLeft
	if (combineAdjacentDigits && (!additionalLefts || additionalLefts.length === 0)) {
		const verticalWindow = typeof config.combineVerticalWindow === 'number' ? config.combineVerticalWindow : topThreshold;
		const windowCandidates = spans
			.filter(s =>
				s.page === labelSpan.page &&
				Math.abs(s.top - labelSpan.top) <= verticalWindow &&
				s.left >= (targetLeft - adjacentLeftWindow) &&
				s.left <= (targetLeft + adjacentRightWindow) &&
				isNumericText(String(s.text).trim())
			)
			.sort((a, b) => a.left - b.left);
		if (windowCandidates.length > 0) {
			const joined = windowCandidates.map(s => String(s.text).trim()).join('');
			if (joined.length > 0 && /^[0-9]+$/.test(joined)) return joined;
		}
	}

	// Default: single best near targetLeft
	const rowCandidates = spans
		.filter(s =>
			s.page === labelSpan.page &&
			Math.abs(s.top - labelSpan.top) < topThreshold &&
			Math.abs(s.left - targetLeft) <= leftThreshold &&
			isNumericText(String(s.text).trim())
		)
		.map(s => ({ s, leftDelta: Math.abs(s.left - targetLeft) }))
		.sort((a, b) => a.leftDelta - b.leftDelta);

	if (rowCandidates.length > 0) {
		const chosen = rowCandidates[0].s;
		if (debug) {
			console.log('[valueCols] picked (same row):', { text: chosen.text, left: chosen.left, top: chosen.top, page: chosen.page });
			console.log('[valueCols] candidates (same row sample):', rowCandidates.slice(0, 5).map(c => ({ text: c.s.text, left: c.s.left, top: c.s.top, dLeft: c.leftDelta })));
		}
		return String(chosen.text).trim();
	}

	// Fallback 1: look slightly below the label row (common layout) within a vertical window
	const belowWindow = 3.0;
	const belowCandidates = spans
		.filter(s =>
			s.page === labelSpan.page &&
			s.top > labelSpan.top &&
			(s.top - labelSpan.top) <= belowWindow &&
			Math.abs(s.left - targetLeft) <= leftThreshold &&
			isNumericText(String(s.text).trim())
		)
		.map(s => ({
			s,
			topDelta: s.top - labelSpan.top,
			leftDelta: Math.abs(s.left - targetLeft),
		}))
		.sort((a, b) => {
			if (a.topDelta !== b.topDelta) return a.topDelta - b.topDelta;
			return a.leftDelta - b.leftDelta;
		});

	if (belowCandidates.length > 0) {
		const chosen = belowCandidates[0].s;
		if (debug) {
			console.log('[valueCols] picked (below):', { text: chosen.text, left: chosen.left, top: chosen.top, page: chosen.page });
			console.log('[valueCols] candidates (below sample):', belowCandidates.slice(0, 5).map(c => ({ text: c.s.text, left: c.s.left, top: c.s.top, dTop: c.topDelta, dLeft: c.leftDelta })));
		}
		return String(chosen.text).trim();
	}

	// Fallback 2: vicinity search within +/- window around label row
	const vicinityWindow = 3.0;
	const vicinityCandidates = spans
		.filter(s =>
			s.page === labelSpan.page &&
			Math.abs(s.top - labelSpan.top) <= vicinityWindow &&
			Math.abs(s.left - targetLeft) <= leftThreshold &&
			isNumericText(String(s.text).trim())
		)
		.map(s => ({
			s,
			topAbs: Math.abs(s.top - labelSpan.top),
			leftDelta: Math.abs(s.left - targetLeft),
		}))
		.sort((a, b) => {
			if (a.topAbs !== b.topAbs) return a.topAbs - b.topAbs;
			return a.leftDelta - b.leftDelta;
		});

	if (vicinityCandidates.length > 0) {
		const chosen = vicinityCandidates[0].s;
		if (debug) {
			console.log('[valueCols] picked (vicinity):', { text: chosen.text, left: chosen.left, top: chosen.top, page: chosen.page });
			console.log('[valueCols] candidates (vicinity sample):', vicinityCandidates.slice(0, 5).map(c => ({ text: c.s.text, left: c.s.left, top: c.s.top, dTopAbs: c.topAbs, dLeft: c.leftDelta })));
		}
		return String(chosen.text).trim();
	}

	if (debug) {
		console.log('[valueCols] no candidates found');
	}

	// Last fallback (opt-in): pick the right-most numeric token on the same row to the right of the label.
	// Useful for boxes where targetLeft differs between templates (e.g., HPP vs BTL).
	if (rowRightFallback) {
		const rowRightCandidates = spans
			.filter(s =>
				s.page === labelSpan.page &&
				Math.abs(s.top - labelSpan.top) <= topThreshold &&
				s.left > labelSpan.left &&
				s.left <= (labelSpan.left + rowRightWithin) &&
				isNumericText(String(s.text).trim())
			)
			.sort((a, b) => b.left - a.left);
		if (debug) {
			console.log('[valueCols] rowRightCandidates (sample):', rowRightCandidates.slice(0, 8).map(s => ({ text: s.text, left: s.left, top: s.top })));
		}
		if (rowRightCandidates.length > 0) return String(rowRightCandidates[0].text).trim();
	}

	return null;
}


