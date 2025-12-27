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
		topThreshold = 0.6,
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
			if (debug) {
				console.log('[yesno] anchor', belowAnchorIncludes, '=>', anchor ? { page: anchor.page, top: anchor.top } : null);
				console.log('[yesno] label candidates', candidates.map(c => ({ page: c.page, top: c.top, text: c.text })).slice(0, 3));
			}
		}
	}

	// Fallback to direct/contains match
	if (!labelSpan) {
		labelSpan = spans.find(s => s.text === label) ||
			spans.find(s => rowLabelIncludes && typeof s.text === 'string' && s.text.toLowerCase().includes(String(rowLabelIncludes).toLowerCase()));
	}
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

	if (candidates.length === 0) {
		if (!allowWordFallback) return null;
		// Word fallback: sometimes "Yes"/"No" is typed inside the box instead of an "X"
		const isYesWord = (t) => /^yes$/i.test(String(t).trim()) || /^y$/i.test(String(t).trim());
		const isNoWord = (t) => /^no$/i.test(String(t).trim()) || /^n$/i.test(String(t).trim());
		const sameRow = (s) => s.page === labelSpan.page && Math.abs(s.top - labelSpan.top) < topThreshold;

		const yesWords = spans
			.filter(s => sameRow(s) && isYesWord(s.text))
			.map(s => ({ s, dist: Math.abs(s.left - yesLeft) }))
			.sort((a, b) => a.dist - b.dist);
		const noWords = spans
			.filter(s => sameRow(s) && isNoWord(s.text))
			.map(s => ({ s, dist: Math.abs(s.left - noLeft) }))
			.sort((a, b) => a.dist - b.dist);

		const bestYes = yesWords[0];
		const bestNo = noWords[0];

		if (debug) {
			console.log('[yesno] no X markers on row; word fallback enabled?', allowWordFallback);
			console.log('[yesno] yesWords[0]:', bestYes ? { left: bestYes.s.left, top: bestYes.s.top, dist: bestYes.dist, text: bestYes.s.text } : null);
			console.log('[yesno] noWords[0]:', bestNo ? { left: bestNo.s.left, top: bestNo.s.top, dist: bestNo.dist, text: bestNo.s.text } : null);
		}

		if (bestYes && (!bestNo || bestYes.dist <= bestNo.dist)) return 'Yes';
		if (bestNo && (!bestYes || bestNo.dist < bestYes.dist)) return 'No';
		return null;
	}

	const best = candidates.reduce((a, b) => {
		const aMin = Math.min(a.distYes, a.distNo);
		const bMin = Math.min(b.distYes, b.distNo);
		return aMin <= bMin ? a : b;
	});

	const choice = best.distYes <= best.distNo ? 'Yes' : 'No';
	if (debug) {
		console.log('[yesno] label:', label, 'rowLabelIncludes:', rowLabelIncludes);
		console.log('[yesno] labelSpan:', { page: labelSpan.page, top: labelSpan.top });
		console.log('[yesno] thresholds:', { topThreshold, yesLeft, noLeft });
		console.log('[yesno] best candidate:', { left: best.x.left, top: best.x.top, distYes: best.distYes, distNo: best.distNo });
		console.log('[yesno] choice:', choice);
	}
	return choice;
}


