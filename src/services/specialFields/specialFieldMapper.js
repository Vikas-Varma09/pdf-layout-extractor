import { buildLabelBlocks } from './labelBlockBuilder.js';
import { findAnswerBelow } from './belowAnswerFinder.js';

// Hardcoded special labels with multi-line blocks
export const SPECIAL_FIELDS = [
	'If Yes, please state if this would affect the residential nature of the property e.g. Noise, Odour',
	'If non-standard construction specify name of system or type:',
	'Including total value of incentives & if part exchange',
	'If property is New Build, please provide the name of Developer:',
	'Any other information which in your opinion Gatehouse Bank plc should note:',
	'(please provide details)',
];

/**
 * Map special labels to answers below them using spatial logic only.
 * Adds logs for detected label blocks and chosen answers.
 *
 * @param {Array<{ text: string, left: number, top: number, page: number, fontSize?: number }>} spans
 * @returns {Array<{ label: string, value: string|null }>}
 */
export function mapSpecialFields(spans) {
	const blocks = buildLabelBlocks(spans);
	const results = [];

	for (const label of SPECIAL_FIELDS) {
		// Locate block that exactly matches the label text
		const block = blocks.find(b => b.labelText === label);
		if (!block) {
			console.log(`[special] Label block not found for "${label}" -> null`);
			results.push({ label, value: null });
			continue;
		}

		const value = findAnswerBelow(block, spans);
		results.push({ label, value: value ?? null });
	}

	return results;
}


