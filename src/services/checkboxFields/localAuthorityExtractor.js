/**
 * Extracts "Property built or owned by the Local Authority?" as Yes/No
 * using X detection and hardcoded option coordinates.
 *
 * Options:
 *  - Yes: left 40.33
 *  - No:  left 46.36
 *
 * Matching:
 *  - Find the label span to anchor page and row (top)
 *  - Consider X marks on the same page with |top diff| < 0.6
 *  - Pick the X closest horizontally to either Yes or No coordinate
 *  - Return "Yes" or "No", or null if no match found
 *
 * @param {Array<{ text: string, left: number, top: number, page: number }>} spans
 * @returns {string|null}
 */
export function extractLocalAuthority(spans) {
	if (!Array.isArray(spans) || spans.length === 0) return null;

	const QUESTION = 'Property built or owned by the Local Authority?';
	const YES_LEFT = 40.33;
	const NO_LEFT = 46.36;

	const labelSpan = spans.find(s => s.text === QUESTION);
	if (!labelSpan) {
		return null;
	}

	const xMarks = spans.filter(s => String(s.text).trim() === 'X');
	if (xMarks.length === 0) return null;

	// Candidates near the label row
	const rowXs = xMarks
		.filter(x => x.page === labelSpan.page && Math.abs(x.top - labelSpan.top) < 0.6)
		.map(x => ({
			x,
			distYes: Math.abs(x.left - YES_LEFT),
			distNo: Math.abs(x.left - NO_LEFT),
		}));

	if (rowXs.length === 0) return null;

	// Pick the X that is closest to either option
	const best = rowXs.reduce((a, b) => {
		const aMin = Math.min(a.distYes, a.distNo);
		const bMin = Math.min(b.distYes, b.distNo);
		return aMin <= bMin ? a : b;
	});

	const choice = best.distYes <= best.distNo ? 'Yes' : 'No';
	console.log(
		`[checkbox] Local Authority? X at page=${best.x.page}, left=${best.x.left}, top=${best.x.top} -> ${choice}`
	);
	return choice;
}


