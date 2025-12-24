/**
 * Group spans into rows per page based on vertical proximity.
 * Two spans are in the same row if |topA - topB| < threshold (default 0.6).
 *
 * @param {Array<{ text: string, left: number, top: number, page: number }>} spans
 * @param {number} threshold
 * @returns {Array<{ page: number, top: number, spans: Array<{ text: string, left: number, top: number, page: number }> }>}
 */
export function groupSpansIntoRows(spans, threshold = 0.6) {
	if (!Array.isArray(spans) || spans.length === 0) {
		return [];
	}

	// Group spans by page
	const spansByPage = new Map();
	for (const span of spans) {
		if (!spansByPage.has(span.page)) {
			spansByPage.set(span.page, []);
		}
		spansByPage.get(span.page).push(span);
	}

	const rows = [];

	for (const [page, pageSpans] of spansByPage.entries()) {
		// Sort by vertical then horizontal to stabilize grouping
		pageSpans.sort((a, b) => {
			if (a.top !== b.top) return a.top - b.top;
			return a.left - b.left;
		});

		const pageRows = [];

		for (const span of pageSpans) {
			// Find an existing row within threshold (choose the closest by top distance)
			let bestRowIndex = -1;
			let smallestDelta = Number.POSITIVE_INFINITY;
			for (let i = 0; i < pageRows.length; i++) {
				const row = pageRows[i];
				const delta = Math.abs(row.top - span.top);
				if (delta < threshold && delta < smallestDelta) {
					smallestDelta = delta;
					bestRowIndex = i;
				}
			}

			if (bestRowIndex === -1) {
				// Create new row
				pageRows.push({
					page,
					top: span.top,
					spans: [span],
				});
			} else {
				// Insert into best row and update row's representative top (simple running average)
				const row = pageRows[bestRowIndex];
				row.spans.push(span);
				row.top = (row.top * (row.spans.length - 1) + span.top) / row.spans.length;
			}
		}

		// Sort spans in each row by left and push to combined rows
		for (const row of pageRows) {
			row.spans.sort((a, b) => a.left - b.left);
			rows.push(row);
		}
	}

	// Global sort: by page, then by row top
	rows.sort((a, b) => {
		if (a.page !== b.page) return a.page - b.page;
		return a.top - b.top;
	});

	return rows;
}


