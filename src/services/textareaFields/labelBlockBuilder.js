/**
 * Merge consecutive label lines into a single label block when:
 *  - Same page
 *  - |leftA - leftB| < 0.5
 *  - topB > topA and (topB - topA) < 1.5
 *
 * Output block:
 * {
 *   labelText: string,
 *   left: number,
 *   topStart: number,
 *   topEnd: number,
 *   page: number
 * }
 *
 * Deterministic, coordinate-based only.
 *
 * @param {Array<{ text: string, left: number, top: number, page: number }>} spans
 * @returns {Array<{ labelText: string, left: number, topStart: number, topEnd: number, page: number }>}
 */
export function buildLabelBlocks(spans) {
	const blocks = [];
	if (!Array.isArray(spans) || spans.length === 0) return blocks;

	const items = spans
		.filter(s => typeof s.text === 'string' && s.text.trim().length > 0)
		.map(s => ({ ...s, text: s.text.trim() }));

	// Sort by page, then by left, then by top
	items.sort((a, b) => {
		if (a.page !== b.page) return a.page - b.page;
		if (a.left !== b.left) return a.left - b.left;
		return a.top - b.top;
	});

	const LEFT_EPS = 0.5;
	const TOP_DELTA_MAX = 1.5;

	let i = 0;
	while (i < items.length) {
		const start = items[i];
		let labelText = start.text;
		let left = start.left;
		let topStart = start.top;
		let topEnd = start.top;
		const page = start.page;

		let j = i + 1;
		while (j < items.length) {
			const next = items[j];
			if (next.page !== page) break;

			const sameLeft = Math.abs(next.left - left) < LEFT_EPS;
			const below = next.top > topEnd;
			const verticalClose = (next.top - topEnd) < TOP_DELTA_MAX;

			if (sameLeft && below && verticalClose) {
				labelText = `${labelText} ${next.text}`.trim();
				topEnd = next.top;
				j++;
				continue;
			}
			break;
		}

		blocks.push({ labelText, left, topStart, topEnd, page });
		i = j;
	}

	return blocks;
}


