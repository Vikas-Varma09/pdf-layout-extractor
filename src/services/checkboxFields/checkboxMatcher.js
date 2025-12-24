/**
 * Match a detected X mark to the closest checkbox option by horizontal distance,
 * constrained by a vertical proximity threshold.
 *
 * @param {{ text: string, left: number, top: number, page: number }} xSpan
 * @param {Array<{ label: string, left: number, top: number, page: number }>} options
 * @param {number} topThreshold
 * @returns {{ label: string, left: number, top: number, page: number } | null}
 */
export function matchXToOption(xSpan, options, topThreshold = 0.6) {
	if (!xSpan || !Array.isArray(options) || options.length === 0) return null;

	const samePageCandidates = options.filter(
		o => o.page === xSpan.page && Math.abs(xSpan.top - o.top) < topThreshold
	);
	if (samePageCandidates.length === 0) return null;

	let best = null;
	let bestHoriz = Number.POSITIVE_INFINITY;
	for (const opt of samePageCandidates) {
		const horiz = Math.abs(xSpan.left - opt.left);
		if (horiz < bestHoriz) {
			bestHoriz = horiz;
			best = opt;
		}
	}
	return best;
}


