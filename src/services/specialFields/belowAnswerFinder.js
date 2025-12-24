import { isNumericText } from '../../../fieldMapper.js';

/**
 * For a given label block, find the nearest span below it on the same page
 * and near the same left coordinate. Prefer non-numeric and larger font.
 *
 * @param {{ labelText: string, left: number, topStart: number, topEnd: number, page: number }} labelBlock
 * @param {Array<{ text: string, left: number, top: number, page: number, fontSize?: number }>} spans
 * @returns {string|null}
 */
export function findAnswerBelow(labelBlock, spans) {
	if (!labelBlock) return null;
	const LEFT_EPS = 2.0;

	// Candidates below the block, same page, near left.
	const candidates = spans.filter(s =>
		s.page === labelBlock.page &&
		s.top > labelBlock.topEnd &&
		Math.abs(s.left - labelBlock.left) < LEFT_EPS &&
		typeof s.text === 'string' &&
		s.text.trim().length > 0
	);

	if (candidates.length === 0) {
		console.log(`[special] No candidates found below label "${labelBlock.labelText}"`);
		return null;
	}

	// Sort by: vertical distance asc, non-numeric first, fontSize desc, left distance asc
	const chosen = candidates
		.map(c => ({
			span: c,
			verticalDistance: c.top - labelBlock.topEnd,
			isNumeric: isNumericText(c.text),
			fontSize: typeof c.fontSize === 'number' ? c.fontSize : 0,
			leftDistance: Math.abs(c.left - labelBlock.left),
		}))
		.sort((a, b) => {
			if (a.verticalDistance !== b.verticalDistance) return a.verticalDistance - b.verticalDistance;
			if (a.isNumeric !== b.isNumeric) return a.isNumeric ? 1 : -1; // prefer non-numeric
			if (a.fontSize !== b.fontSize) return b.fontSize - a.fontSize; // larger font first
			return a.leftDistance - b.leftDistance;
		})[0]?.span;

	if (!chosen) {
		console.log(`[special] No suitable answer chosen for label "${labelBlock.labelText}"`);
		return null;
	}

	console.log(
		`[special] Answer for "${labelBlock.labelText}": "${chosen.text}" at page=${chosen.page}, left=${chosen.left}, top=${chosen.top}`
	);

	return String(chosen.text).trim();
}


