/**
 * Extract text between Label A and Label B on the same page.
 * By default, includes ALL spans between (no left restriction).
 * If options.leftBand is provided (in %), restrict to |left - labelA.left| < leftBand.
 *
 * @param {{ labelA: { left: number, topStart: number, topEnd: number, page: number }, labelB: { left: number, topStart: number, topEnd: number, page: number } }} bounds
 * @param {Array<{ text: string, left: number, top: number, page: number }>} spans
 * @param {{ leftBand?: number }} [options]
 * @returns {string|null}
 */
export function extractBoundedAnswer(bounds, spans, options = {}) {
	const { labelA, labelB } = bounds;
	if (!labelA || !labelB) return null;
	if (labelA.page !== labelB.page) return null;

	let filtered = spans
		.filter(s => {
			if (s.page !== labelA.page) return false;
			const betweenRows = s.top > labelA.topEnd && s.top < labelB.topStart;
			// Optionally include same-row tokens to the right of label A
			const rowEps = typeof options.rowEps === 'number' ? options.rowEps : 0.6;
			const sameRowRight = !!options.includeSameRowRight &&
				Math.abs(s.top - labelA.topStart) < rowEps &&
				s.left > labelA.left;
			if (!(betweenRows || sameRowRight)) return false;
			if (typeof s.text !== 'string' || s.text.trim().length === 0) return false;
			// Optionally require tokens to be on or to the right of label A
			if (options.onlyRightOfA === true) {
				const rightSlack = typeof options.rightSlack === 'number' ? options.rightSlack : 0.0;
				if (s.left < (labelA.left - rightSlack)) return false;
			}
			if (typeof options.leftBand === 'number') {
				return Math.abs(s.left - labelA.left) < options.leftBand;
			}
			return true;
		})
		.sort((a, b) => a.left - b.left || a.top - b.top);

	if (options.debug) {
		console.log('[textarea] filtered spans count:', filtered.length);
		if (filtered.length > 0) {
			const sample = filtered.slice(0, 5).map(s => ({ text: s.text, left: s.left, top: s.top }));
			console.log('[textarea] first spans:', sample);
		}
	}

	// If no explicit leftBand provided, optionally cluster by left and take the column
	// whose mean left is nearest to labelA.left to avoid side-by-side fields.
	if (typeof options.leftBand !== 'number') {
		const threshold = typeof options.clusterThreshold === 'number' ? options.clusterThreshold : 3.0;
		const clusters = [];
		for (const s of filtered) {
			const last = clusters[clusters.length - 1];
			if (!last) {
				clusters.push([s]);
				continue;
			}
			const lastLeft = last[last.length - 1].left;
			if (Math.abs(s.left - lastLeft) <= threshold) {
				last.push(s);
			} else {
				clusters.push([s]);
			}
		}
		if (clusters.length > 0) {
			let best = clusters[0];
			let bestDist = Math.abs(avgLeft(best) - labelA.left);
			for (let i = 1; i < clusters.length; i++) {
				const dist = Math.abs(avgLeft(clusters[i]) - labelA.left);
				if (dist < bestDist) {
					best = clusters[i];
					bestDist = dist;
				}
			}
			// Optionally expand to include slightly more right-indented lines of the same column
			if (typeof options.expandRightWithin === 'number') {
				const mean = avgLeft(best);
				const leftMin = mean - threshold;
				const leftMax = mean + options.expandRightWithin;
				const expanded = filtered.filter(s => s.left >= leftMin && s.left <= leftMax);
				filtered = expanded;
			} else {
				filtered = best;
			}
		}
	}

	// Resort by reading order for concatenation
	filtered = filtered
		.sort((a, b) => {
			if (a.top !== b.top) return a.top - b.top;
			return a.left - b.left;
		});

	if (filtered.length === 0) return null;

	const joined = filtered.map(s => s.text.trim()).join(' ').replace(/\s+/g, ' ').trim();
	if (options.debug) {
		console.log('[textarea] joined:', joined);
	}
	return joined.length > 0 ? joined : null;
}

function avgLeft(arr) {
	if (!arr || arr.length === 0) return 0;
	let sum = 0;
	for (const s of arr) sum += s.left;
	return sum / arr.length;
}

