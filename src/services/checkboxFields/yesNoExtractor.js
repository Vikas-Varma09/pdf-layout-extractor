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
		rowFallbackMaxLeft = 12.0,
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

	if (debug) {
		console.log('[yesNo] label:', label);
		console.log('[yesNo] rowLabelIncludes:', rowLabelIncludes ?? null);
		console.log('[yesNo] belowAnchorIncludes:', belowAnchorIncludes ?? null);
		console.log('[yesNo] matched labelSpan:', labelSpan ? { text: labelSpan.text, page: labelSpan.page, top: labelSpan.top, left: labelSpan.left } : null);
		console.log('[yesNo] yesLeft/noLeft/naLeft:', { yesLeft, noLeft, naLeft: typeof naLeft === 'number' ? naLeft : null });
		console.log('[yesNo] topThreshold/leftWindow:', { topThreshold, leftWindow, allowWordFallback });
	}
	if (!labelSpan) return null;

	const markers = new Set(['X', 'x', '✓', '✔', '☑', '☒', '■', '●']);
	const markSpans = spans.filter(s => markers.has(String(s.text).trim()));

	let candidates = markSpans.length > 0
		? markSpans
			.filter(m => m.page === labelSpan.page && Math.abs(m.top - labelSpan.top) < topThreshold)
			.map(m => ({
				x: m,
				distYes: Math.abs(m.left - yesLeft),
				distNo: Math.abs(m.left - noLeft),
				distNa: typeof naLeft === 'number' ? Math.abs(m.left - naLeft) : Number.POSITIVE_INFINITY,
			}))
		: [];
	// keep only markers close to at least one expected column
	candidates = candidates.filter(c => Math.min(c.distYes, c.distNo, c.distNa) <= leftWindow);

	if (debug) {
		console.log('[yesNo] marker candidates near columns (sample):', candidates.slice(0, 5).map(c => ({ text: c.x.text, left: c.x.left, top: c.x.top, distYes: c.distYes, distNo: c.distNo, distNa: c.distNa })));
	}

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

	// Row fallback: if there are markers on the same row but none within leftWindow,
	// choose the closest marker to the expected Yes/No/N/A columns (bounded by rowFallbackMaxLeft).
	if (candidates.length === 0) {
		const rowMarkers = markSpans
			.filter(m => m.page === labelSpan.page && Math.abs(m.top - labelSpan.top) < topThreshold)
			.map(m => ({
				m,
				distYes: Math.abs(m.left - yesLeft),
				distNo: Math.abs(m.left - noLeft),
				distNa: typeof naLeft === 'number' ? Math.abs(m.left - naLeft) : Number.POSITIVE_INFINITY,
			}))
			.sort((a, b) => Math.min(a.distYes, a.distNo, a.distNa) - Math.min(b.distYes, b.distNo, b.distNa));

		if (debug) {
			console.log('[yesNo] row markers (sample):', rowMarkers.slice(0, 8).map(r => ({ text: r.m.text, left: r.m.left, top: r.m.top, distYes: r.distYes, distNo: r.distNo, distNa: r.distNa })));
		}

		const bestRow = rowMarkers[0];
		if (bestRow && Math.min(bestRow.distYes, bestRow.distNo, bestRow.distNa) <= rowFallbackMaxLeft) {
			if (bestRow.distNo <= bestRow.distYes && bestRow.distNo <= bestRow.distNa) return 'No';
			if (bestRow.distNa <= bestRow.distYes && bestRow.distNa <= bestRow.distNo) return 'N/A';
			return 'Yes';
		}
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


