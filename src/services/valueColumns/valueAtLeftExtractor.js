import { isNumericText } from '../../../fieldMapper.js';

/**
 * Find the numeric value located at a target left% on the same row as a label.
 *
 * @param {Array<{ text: string, left: number, top: number, page: number }>} spans
 * @param {{ label: string, targetLeft: number, topThreshold?: number, leftThreshold?: number }} config
 * @returns {string|null}
 */
export function extractValueAtLeft(spans, config) {
	const { label, targetLeft, topThreshold = 0.6, leftThreshold = 2.0 } = config;
	if (!Array.isArray(spans) || spans.length === 0) return null;
	if (!label || typeof targetLeft !== 'number') return null;

	const labelSpan = spans.find(s => s.text === label);
	if (!labelSpan) return null;

	// Candidates on same row
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
		return String(chosen.text).trim();
	}

	return null;
}


