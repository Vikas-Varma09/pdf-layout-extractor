import { buildLabelBlocks } from './labelBlockBuilder.js';
import { extractBoundedAnswer } from './boundedAnswerExtractor.js';

// Define textarea fields and their next label (Label B)
const TEXTAREA_FIELDS = [
	{
		label: 'If Yes, please state if this would affect the residential nature of the property e.g. Noise, Odour',
		nextLabel: 'Tenure:',
		// Keep extraction near the left column of the label to avoid side labels
		leftBand: 10.0,
		// Use left clustering to avoid side-by-side fields while allowing wrapped lines
		clusterThreshold: 6.0,
		// Allow including slightly more right-indented lines from the same column
		expandRightWithin: 20.0,
	},
	{
		label: '(please provide details)',
		nextLabel: 'Converted',
		// Restrict to the right column near this label to avoid left-column labels
		leftBand: 10.0,
		clusterThreshold: 6.0,
		expandRightWithin: 20.0,
	},
	{
		label: 'Any other information which in your opinion Gatehouse Bank plc should note:',
		labelIncludes: 'Any other information which in your opinion Gatehouse Bank plc should note',
		labelAltIncludes: 'GENERAL REMARKS:',
		nextLabel: 'IMPORTANT NOTICE TO THE APPLICANT:',
		nextLabelIncludes: 'IMPORTANT NOTICE',
		nextLabelAltIncludes: 'IMPORTANT NOTICE TO THE APPLICANT',
		clusterThreshold: 6.0,
		expandRightWithin: 30.0,
	},
	{
		label: 'GENERAL REMARKS:',
		labelIncludes: 'GENERAL REMARKS',
		nextLabel: 'IMPORTANT NOTICE TO THE APPLICANT:',
		nextLabelIncludes: 'IMPORTANT NOTICE',
		clusterThreshold: 6.0,
		// This section often wraps and is wide; allow more right drift
		expandRightWithin: 50.0,
	},
];

/**
 * Returns an object mapping label -> extracted text (or null).
 *
 * @param {Array<{ text: string, left: number, top: number, page: number }>} spans
 * @returns {Record<string, string|null>}
 */
export function extractTextareaFields(spans) {
	const out = {};
	if (!Array.isArray(spans) || spans.length === 0) {
		for (const f of TEXTAREA_FIELDS) out[f.label] = null;
		return out;
	}

	const blocks = buildLabelBlocks(spans);

	for (const f of TEXTAREA_FIELDS) {
		const findBlock = ({ exact, includes, altIncludes }) => {
			// 1) exact match
			if (exact) {
				const exactBlock = blocks.find(b => b.labelText === exact);
				if (exactBlock) return exactBlock;
			}
			// 2) includes match (primary)
			if (includes) {
				const needle = String(includes).toLowerCase();
				const inc = blocks.find(b => String(b.labelText).toLowerCase().includes(needle));
				if (inc) return inc;
			}
			// 3) includes match (alternate)
			if (altIncludes) {
				const needleAlt = String(altIncludes).toLowerCase();
				const incAlt = blocks.find(b => String(b.labelText).toLowerCase().includes(needleAlt));
				if (incAlt) return incAlt;
			}
			return null;
		};

		const a = findBlock({ exact: f.label, includes: f.labelIncludes, altIncludes: f.labelAltIncludes });
		const b = findBlock({ exact: f.nextLabel, includes: f.nextLabelIncludes, altIncludes: f.nextLabelAltIncludes });

		if (!a || !b) {
			out[f.label] = null;
			continue;
		}

		const value = extractBoundedAnswer(
			{ labelA: a, labelB: b },
			spans,
			{ leftBand: f.leftBand, clusterThreshold: f.clusterThreshold, expandRightWithin: f.expandRightWithin }
		);
		out[f.label] = value ?? null;
	}

	return out;
}


