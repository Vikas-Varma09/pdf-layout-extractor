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
	const {
		label,
		rowLabelIncludes,
		yesLeft,
		noLeft,
		naLeft,
		topThreshold = 0.6,
		leftWindow = 3.5,
		belowAnchorIncludes,
		allowWordFallback = false,
		debug = false,
	} = config;
	if (!Array.isArray(spans) || spans.length === 0) return null;
	if (!label || typeof yesLeft !== 'number' || typeof noLeft !== 'number') return null;

	let labelSpan = null;

	// Prefer finding the label below a section anchor, if provided
	if (belowAnchorIncludes) {
		const needle = String(belowAnchorIncludes).toLowerCase();
		const anchor = spans.find(s => typeof s.text === 'string' && s.text.toLowerCase().includes(needle));
		if (anchor) {
			const candidates = spans
				.filter(s =>
					s.page === anchor.page &&
					s.top > anchor.top &&
					(
						s.text === label ||
						(rowLabelIncludes && typeof s.text === 'string' && s.text.toLowerCase().includes(String(rowLabelIncludes).toLowerCase()))
					)
				)
				.sort((a, b) => (a.top - anchor.top) - (b.top - anchor.top));
			labelSpan = candidates[0] || null;
		}
	}

	// Fallback to direct/contains match
	if (!labelSpan) {
		labelSpan = spans.find(s => s.text === label) ||
			spans.find(s => rowLabelIncludes && typeof s.text === 'string' && s.text.toLowerCase().includes(String(rowLabelIncludes).toLowerCase()));
	}
	if (!labelSpan) return null;

	const xMarks = spans.filter(s => String(s.text).trim() === 'X');

	let candidates = xMarks.length > 0
		? xMarks
			.filter(x => x.page === labelSpan.page && Math.abs(x.top - labelSpan.top) < topThreshold)
			.map(x => ({
				x,
				distYes: Math.abs(x.left - yesLeft),
				distNo: Math.abs(x.left - noLeft),
				distNa: typeof naLeft === 'number' ? Math.abs(x.left - naLeft) : Number.POSITIVE_INFINITY,
			}))
		: [];
	// keep only markers close to at least one expected column
	candidates = candidates.filter(c => Math.min(c.distYes, c.distNo, c.distNa) <= leftWindow);

	// Prefer an exact nearby hit at the expected Yes/No/N/A columns if available
	const nearYes = candidates.find(c => c.distYes <= leftWindow);
	const nearNo = candidates.find(c => c.distNo <= leftWindow);
	const nearNa = candidates.find(c => c.distNa <= leftWindow);
	if (nearYes || nearNo || nearNa) {
		let choice = null;
		let best = null;
		if (nearYes) best = { which: 'Yes', dist: nearYes.distYes };
		if (nearNo && (!best || nearNo.distNo < best.dist)) best = { which: 'No', dist: nearNo.distNo };
		if (nearNa && (!best || nearNa.distNa < best.dist)) best = { which: 'N/A', dist: nearNa.distNa };
		if (best) return best.which;
	}

	if (candidates.length === 0) {
		if (!allowWordFallback) return null;
		// Word fallback: sometimes "Yes"/"No" is typed inside the box instead of an "X"
		const isYesWord = (t) => /^yes$/i.test(String(t).trim()) || /^y$/i.test(String(t).trim());
		const isNoWord = (t) => /^no$/i.test(String(t).trim()) || /^n$/i.test(String(t).trim());
		const isNaWord = (t) => /^n\/?a$/i.test(String(t).trim()) || /^na$/i.test(String(t).trim());
		const sameRow = (s) => s.page === labelSpan.page && Math.abs(s.top - labelSpan.top) < topThreshold;

		const yesWords = spans
			.filter(s => sameRow(s) && isYesWord(s.text))
			.map(s => ({ s, dist: Math.abs(s.left - yesLeft) }))
			.filter(w => w.dist <= leftWindow)
			.sort((a, b) => a.dist - b.dist);
		const noWords = spans
			.filter(s => sameRow(s) && isNoWord(s.text))
			.map(s => ({ s, dist: Math.abs(s.left - noLeft) }))
			.filter(w => w.dist <= leftWindow)
			.sort((a, b) => a.dist - b.dist);
		const naWords = typeof naLeft === 'number'
			? spans
				.filter(s => sameRow(s) && isNaWord(s.text))
				.map(s => ({ s, dist: Math.abs(s.left - naLeft) }))
				.filter(w => w.dist <= leftWindow)
				.sort((a, b) => a.dist - b.dist)
			: [];

		const bestYes = yesWords[0];
		const bestNo = noWords[0];
		const bestNa = naWords[0];

		const trio = [
			bestYes ? { which: 'Yes', dist: bestYes.dist } : null,
			bestNo ? { which: 'No', dist: bestNo.dist } : null,
			bestNa ? { which: 'N/A', dist: bestNa.dist } : null,
		].filter(Boolean).sort((a, b) => a.dist - b.dist);
		if (trio.length > 0) return trio[0].which;
		return null;
	}

	const best = candidates.reduce((a, b) => {
		const aMin = Math.min(a.distYes, a.distNo, a.distNa);
		const bMin = Math.min(b.distYes, b.distNo, b.distNa);
		return aMin <= bMin ? a : b;
	});

	let choice = 'Yes';
	if (best.distNo <= best.distYes && best.distNo <= best.distNa) choice = 'No';
	if (best.distNa <= best.distYes && best.distNa <= best.distNo) choice = 'N/A';
	return choice;
}


