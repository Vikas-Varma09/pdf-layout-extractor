/**
 * Generic Yes/No extractor based on spatial logic only.
 *
 * Config:
 *  - label: exact label text to anchor the row (page + top)
 *  - yesLeft: left% coordinate for "Yes"
 *  - noLeft:  left% coordinate for "No"
 *  - topThreshold: optional, default 0.6
 *
 * Returns "Yes", "No" or null.
 */
export function extractYesNo(spans, config) {
	const { label, yesLeft, noLeft, topThreshold = 0.6 } = config;
	if (!Array.isArray(spans) || spans.length === 0) return null;
	if (!label || typeof yesLeft !== 'number' || typeof noLeft !== 'number') return null;

	const labelSpan = spans.find(s => s.text === label);
	if (!labelSpan) return null;

	const xMarks = spans.filter(s => String(s.text).trim() === 'X');
	if (xMarks.length === 0) return null;

	const candidates = xMarks
		.filter(x => x.page === labelSpan.page && Math.abs(x.top - labelSpan.top) < topThreshold)
		.map(x => ({
			x,
			distYes: Math.abs(x.left - yesLeft),
			distNo: Math.abs(x.left - noLeft),
		}));

	if (candidates.length === 0) return null;

	const best = candidates.reduce((a, b) => {
		const aMin = Math.min(a.distYes, a.distNo);
		const bMin = Math.min(b.distYes, b.distNo);
		return aMin <= bMin ? a : b;
	});

	const choice = best.distYes <= best.distNo ? 'Yes' : 'No';
	return choice;
}


