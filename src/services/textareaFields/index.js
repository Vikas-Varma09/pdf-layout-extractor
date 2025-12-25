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
	// Current Occupancy: details for HMO/MUFB question
	{
		label: 'If Yes, please provide details',
		labelIncludes: 'If Yes, please provide details',
		// Use exact text to disambiguate from the HMO question above
		nextLabel: 'Does the property appear to be tenanted at present?',
		nextLabelIncludes: 'Does the property appear to',
		// Keep to the right column where CURRENT OCCUPANCY sits
		leftBand: 12.0,
		// In some layouts, the answer sits on the same row to the right
		includeSameRowRight: true,
		// Ensure we only take tokens to the right of the label (exclude left column values like 171)
		onlyRightOfA: true,
		rightSlack: 0.5,
		// Slightly widen same-row tolerance
		rowEps: 2.0,
		// Enable debug logs for this field
		debug: false,
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
	// New Build: "Other" certificate details
	{
		label: 'If Other, please provide details',
		labelIncludes: 'If Other, please provide details',
		nextLabel: 'Is this a Self-build project?',
		nextLabelIncludes: 'Is this a Self-build project?',
		mapKey: 'newbuild_otherCertDetails',
		leftBand: 12.0,
		includeSameRowRight: true,
		onlyRightOfA: true,
		rightSlack: 0.5,
		rowEps: 2.0,
		maxBelowA: 3.0,
	},
	// New Build: incentives details (bounded to developer label)
	{
		label: 'Including total value of incentives & if part exchange',
		labelIncludes: 'incentives',
		nextLabel: 'If property is New Build, please provide the name of Developer:',
		mapKey: 'newbuild_incentivesDetails',
		leftBand: 14.0,
		includeSameRowRight: false,
		clusterThreshold: 6.0,
		expandRightWithin: 30.0,
		onlyRightOfA: true,
		rowEps: 2.0,
		maxBelowA: 12.0,
		// Ensure we anchor in the New Build section, not earlier occurrences
		belowLabelIncludes: 'NEW BUILD',
		// Remove label text if it appears; if nothing else remains -> null
		stripLabelPrefixes: true,
		stripTokens: ['If Yes, please provide details', 'Including total value of incentives & if part exchange'],
		rejectIfLabel: true,
	},
	// New Build: developer name (bounded to long 'Gatehouse Bank plc is authorised...' notice)
	{
		label: 'If property is New Build, please provide the name of Developer:',
		nextLabel: 'Gatehouse Bank plc is authorised',
		nextLabelIncludes: 'Gatehouse Bank plc is authorised',
		mapKey: 'newbuild_developerName',
		leftBand: 10.0,
		clusterThreshold: 6.0,
		expandRightWithin: 20.0,
		onlyRightOfA: true,
		maxBelowA: 6.0,
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
		const findBlock = ({ exact, includes, altIncludes, belowTop }) => {
			// 1) exact match
			if (exact) {
				const exactBlock = blocks.find(b => b.labelText === exact && (typeof belowTop !== 'number' || b.topStart > belowTop));
				if (exactBlock) return exactBlock;
			}
			// 2) includes match (primary)
			if (includes) {
				const needle = String(includes).toLowerCase();
				const inc = blocks.find(b => String(b.labelText).toLowerCase().includes(needle) && (typeof belowTop !== 'number' || b.topStart > belowTop));
				if (inc) return inc;
			}
			// 3) includes match (alternate)
			if (altIncludes) {
				const needleAlt = String(altIncludes).toLowerCase();
				const incAlt = blocks.find(b => String(b.labelText).toLowerCase().includes(needleAlt) && (typeof belowTop !== 'number' || b.topStart > belowTop));
				if (incAlt) return incAlt;
			}
			return null;
		};

		// Optional anchor to force matching below a specific section label
		let belowTop = undefined;
		if (f.belowLabel || f.belowLabelIncludes) {
			const anchor = findBlock({ exact: f.belowLabel, includes: f.belowLabelIncludes });
			if (anchor) belowTop = anchor.topEnd;
		}

		const a = findBlock({ exact: f.label, includes: f.labelIncludes, altIncludes: f.labelAltIncludes, belowTop });

		// Prefer picking B below A when using includes/altIncludes to disambiguate duplicates
		const findBlockBelowA = (aBlock, { exact, includes, altIncludes }) => {
			const samePage = (b) => b.page === aBlock.page;
			const isBelow = (b) => b.topStart > aBlock.topEnd;

			let candidates = [];

			if (exact) {
				candidates = blocks.filter(b => b.labelText === exact && samePage(b) && isBelow(b));
			} else {
				const needles = [includes, altIncludes]
					.filter(Boolean)
					.map(s => String(s).toLowerCase());
				if (needles.length > 0) {
					candidates = blocks.filter(b => samePage(b) && isBelow(b) && needles.some(n => String(b.labelText).toLowerCase().includes(n)));
				}
			}

			if (candidates.length > 0) {
				return candidates.sort((b1, b2) => (b1.topStart - aBlock.topEnd) - (b2.topStart - aBlock.topEnd))[0];
			}

			// Fallback to generic finder if nothing found below
			return findBlock({ exact, includes, altIncludes, belowTop });
		};

		const b = a
			? findBlockBelowA(a, { exact: f.nextLabel, includes: f.nextLabelIncludes, altIncludes: f.nextLabelAltIncludes })
			: findBlock({ exact: f.nextLabel, includes: f.nextLabelIncludes, altIncludes: f.nextLabelAltIncludes, belowTop });
		if (f.debug) {
			console.log('[textarea] A block for', f.label, a ? { page: a.page, left: a.left, topStart: a.topStart, topEnd: a.topEnd } : null);
			console.log('[textarea] B block for', f.nextLabel || f.nextLabelIncludes, b ? { page: b.page, left: b.left, topStart: b.topStart, topEnd: b.topEnd } : null);
			console.log('[textarea] options', { leftBand: f.leftBand, clusterThreshold: f.clusterThreshold, expandRightWithin: f.expandRightWithin, includeSameRowRight: f.includeSameRowRight, rowEps: f.rowEps, onlyRightOfA: f.onlyRightOfA, rightSlack: f.rightSlack });
		}

		if (!a || !b) {
			out[f.label] = null;
			continue;
		}

		const value = extractBoundedAnswer(
			{ labelA: a, labelB: b },
			spans,
			{ leftBand: f.leftBand, clusterThreshold: f.clusterThreshold, expandRightWithin: f.expandRightWithin, includeSameRowRight: f.includeSameRowRight, rowEps: f.rowEps, onlyRightOfA: f.onlyRightOfA, rightSlack: f.rightSlack, debug: f.debug, stripLabelPrefixes: f.stripLabelPrefixes, stripTokens: f.stripTokens, labelAText: a?.labelText }
		);
		if (f.debug) {
			console.log('[textarea] value for', f.label, '=>', value);
		}
		const keyName = f.mapKey || f.label;
		out[keyName] = value ?? null;
	}

	return out;
}


