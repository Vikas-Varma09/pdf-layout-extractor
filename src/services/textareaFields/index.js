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
	// Services: easements/rights details (Yes path)
	{
		label: 'If Yes, please provide details',
		labelIncludes: 'If Yes, please provide details',
		nextLabel: 'If house split in to flats, are services separate for each unit?',
		nextLabelIncludes: 'services separate for each unit?',
		mapKey: 'easementsOrRightsDetails',
		anchorBeforeIncludes: 'Any easements or rights of way',
		// Scope to SERVICES to avoid collisions with other sections
		belowLabelIncludes: 'SERVICES',
		// Prefer text to the right of the label within a modest window
		leftBand: 14.0,
		includeSameRowRight: false,
		onlyRightOfA: true,
		rightSlack: 0.5,
		rowEps: 2.0,
		clusterThreshold: 8.0,
		expandRightWithin: 40.0,
		maxBelowA: 10.0,
		requireSamePageWithB: true,
		stripLabelPrefixes: true,
		stripTokens: ['If Yes, please provide details'],
	},
	// Services: services separate details (No path)
	{
		label: 'If No, please provide details',
		labelIncludes: 'If No, please provide details',
		nextLabel: 'ENERGY EFFICIENCY',
		nextLabelIncludes: 'ENERGY EFFICIENCY',
		mapKey: 'servicesSeparateDetails',
		// Scope to SERVICES
		belowLabelIncludes: 'SERVICES',
		anchorBeforeIncludes: 'services separate for each unit?',
		leftBand: 14.0,
		includeSameRowRight: false,
		onlyRightOfA: true,
		rightSlack: 0.5,
		rowEps: 2.0,
		clusterThreshold: 8.0,
		expandRightWithin: 40.0,
		maxBelowA: 12.0,
		requireSamePageWithB: true,
		stripLabelPrefixes: true,
		stripTokens: ['If No, please provide details'],
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
	// Construction: non-standard construction type
	{
		label: 'If non-standard construction specify name of system or type:',
		nextLabel: 'External finish:',
		nextLabelIncludes: 'External finish',
		mapKey: 'nonStandardConstructionType',
		leftBand: 10.0,
		clusterThreshold: 6.0,
		expandRightWithin: 20.0,
		maxBelowA: 6.0,
	},
	// Construction: Main Walls (side-by-side layout)
	{
		label: 'Main Walls:',
		nextLabel: 'Main Roof:',
		nextLabelIncludes: 'Main Roof',
		mapKey: 'mainWalls',
		// Answer is on the same row to the right of the label
		includeSameRowRight: true,
		onlyRightOfA: true,
		rightSlack: 0.5,
		rowEps: 1.2,
		// Don't restrict by leftBand to allow capturing text further right
		leftBand: null,
		clusterThreshold: 6.0,
		expandRightWithin: 40.0,
		// Very tight vertical window - only same row, no below
		maxBelowA: 0.5,
		// Strip common checkbox tokens that might leak in
		stripTokens: ['X', 'Yes', 'No', 'N/A'],
	},
	// Construction: Main Roof (side-by-side layout)
	{
		label: 'Main Roof:',
		nextLabel: 'Garage:',
		nextLabelIncludes: 'Garage',
		mapKey: 'mainRoof',
		// Answer is on the same row to the right of the label
		includeSameRowRight: true,
		onlyRightOfA: true,
		rightSlack: 0.5,
		rowEps: 1.2,
		// Don't restrict by leftBand to allow capturing text further right
		leftBand: null,
		clusterThreshold: 6.0,
		expandRightWithin: 40.0,
		// Very tight vertical window - only same row, no below
		maxBelowA: 0.5,
		// Strip common checkbox tokens that might leak in
		stripTokens: ['X', 'Yes', 'No', 'N/A'],
	},
	// Construction: Garage (side-by-side layout)
	{
		label: 'Garage:',
		nextLabel: 'Outbuildings:',
		nextLabelIncludes: 'Outbuildings',
		mapKey: 'garageConstruction',
		// Answer is on the same row to the right of the label
		includeSameRowRight: true,
		onlyRightOfA: true,
		rightSlack: 0.5,
		rowEps: 1.2,
		// Don't restrict by leftBand to allow capturing text further right
		leftBand: null,
		clusterThreshold: 6.0,
		expandRightWithin: 40.0,
		// Very tight vertical window - only same row, no below
		maxBelowA: 0.5,
		// Strip common checkbox tokens that might leak in
		stripTokens: ['X', 'Yes', 'No', 'N/A'],
	},
	// Construction: Outbuildings (side-by-side layout)
	{
		label: 'Outbuildings:',
		nextLabel: 'Are there any alterations or extensions?',
		nextLabelIncludes: 'Are there any alterations or extensions?',
		mapKey: 'outbuildingsConstruction',
		// Answer is on the same row to the right of the label
		includeSameRowRight: true,
		onlyRightOfA: true,
		rightSlack: 0.5,
		rowEps: 1.2,
		// Don't restrict by leftBand to allow capturing text further right
		leftBand: null,
		clusterThreshold: 6.0,
		expandRightWithin: 40.0,
		// Very tight vertical window - only same row, no below
		maxBelowA: 0.5,
		// Strip common checkbox tokens that might leak in
		stripTokens: ['X', 'Yes', 'No', 'N/A'],
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
	// Reports: Other details (bounded to ESSENTIAL REPAIRS)
	{
		label: 'If Other, please provide details',
		labelIncludes: 'If Other, please provide details',
		nextLabel: 'ESSENTIAL REPAIRS',
		nextLabelIncludes: 'ESSENTIAL REPAIRS',
		mapKey: 'reports_otherDetails',
		// Scope strictly to the REPORTS section to avoid collisions
		belowLabelIncludes: 'REPORTS',
		// Use clustering rather than a hard left band
		leftBand: null,
		includeSameRowRight: false,
		onlyRightOfA: true,
		rowEps: 2.0,
		clusterThreshold: 8.0,
		expandRightWithin: 60.0,
		maxBelowA: 25.0,
		debug: false,
		// If next label is on next page, allow capturing to end of page
		allowCrossPage: false,
		requireSamePageWithB: true,
	},
	// Essential Repairs: details (bounded to 'Is re-inspection required?')
	{
		label: 'If Yes, please provide details',
		labelIncludes: 'If Yes, please provide details',
		nextLabel: 'Is re-inspection required?',
		nextLabelIncludes: 'Is re-inspection required?',
		nextLabelLeftMax: 20.0,
		mapKey: 'essentialRepairs_essentialRepairsDetails',
		// Scope to the ESSENTIAL REPAIRS section
		belowLabelIncludes: 'ESSENTIAL REPAIRS',
		anchorBeforeIncludes: 'Are there any essential repairs required?',
		leftBand: 16.0,
		includeSameRowRight: false,
		onlyRightOfA: true,
		rightSlack: 0.5,
		rowEps: 2.0,
		clusterThreshold: 8.0,
		expandRightWithin: 35.0,
		maxBelowA: 12.0,
		allowCrossPage: false,
		requireSamePageWithB: true,
		stripLabelPrefixes: true,
		stripTokens: ['If Yes, please provide details'],
		debug: false,
	},
	// Locality & Demand: compulsory purchase details
	{
		label: 'If Yes, please provide details',
		labelIncludes: 'If Yes, please provide details',
		nextLabel: 'Are there any vacant or boarded up',
		nextLabelIncludes: 'Are there any vacant or boarded up',
		nextLabelAltIncludes: 'properties in close proximity?',
		nextLabelLeftMax: 20.0,
		mapKey: 'locality_compulsoryPurchaseDetails',
		belowLabelIncludes: 'LOCALITY & DEMAND',
		anchorBeforeIncludes: 'compulsory purchase or clearance?',
		leftBand: 16.0,
		includeSameRowRight: false,
		onlyRightOfA: true,
		rowEps: 2.0,
		clusterThreshold: 8.0,
		expandRightWithin: 35.0,
		maxBelowA: 12.0,
		requireSamePageWithB: true,
		stripLabelPrefixes: true,
		stripTokens: ['If Yes, please provide details'],
		debug: false,
	},
	// Locality & Demand: vacant/boarded details
	{
		label: 'If Yes, please provide details',
		labelIncludes: 'If Yes, please provide details',
		nextLabel: 'Is there a possibility of occupancy restriction?',
		nextLabelIncludes: 'Is there a possibility of occupancy restriction?',
		nextLabelAltIncludes: 'possibility of occupancy restriction?',
		nextLabelLeftMax: 20.0,
		mapKey: 'locality_vacantOrBoardedDetails',
		belowLabelIncludes: 'LOCALITY & DEMAND',
		anchorBeforeIncludes: 'properties in close proximity?',
		leftBand: 16.0,
		includeSameRowRight: false,
		onlyRightOfA: true,
		rowEps: 2.0,
		clusterThreshold: 8.0,
		expandRightWithin: 35.0,
		maxBelowA: 12.0,
		requireSamePageWithB: true,
		stripLabelPrefixes: true,
		stripTokens: ['If Yes, please provide details'],
		debug: false,
	},
	// Locality & Demand: occupancy restriction details
	{
		label: 'If Yes, please provide details',
		labelIncludes: 'If Yes, please provide details',
		nextLabel: 'Is the property close to any high voltage',
		nextLabelIncludes: 'Is the property close to any high voltage',
		nextLabelAltIncludes: 'electrical supply equipment?',
		nextLabelLeftMax: 20.0,
		mapKey: 'locality_occupancyRestrictionDetails',
		belowLabelIncludes: 'LOCALITY & DEMAND',
		anchorBeforeIncludes: 'Is there a possibility of occupancy restriction?',
		leftBand: 16.0,
		includeSameRowRight: false,
		onlyRightOfA: true,
		rowEps: 2.0,
		clusterThreshold: 8.0,
		expandRightWithin: 35.0,
		maxBelowA: 12.0,
		requireSamePageWithB: true,
		stripLabelPrefixes: true,
		stripTokens: ['If Yes, please provide details'],
		debug: false,
	},
	// Locality & Demand: high voltage equipment details
	{
		label: 'If Yes, please provide details',
		labelIncludes: 'If Yes, please provide details',
		nextLabel: 'SERVICES',
		nextLabelIncludes: 'SERVICES',
		nextLabelAltIncludes: null,
		nextLabelLeftMax: 20.0,
		mapKey: 'locality_highVoltageEquipmentDetails',
		belowLabelIncludes: 'LOCALITY & DEMAND',
		anchorBeforeIncludes: 'electrical supply equipment?',
		leftBand: 16.0,
		includeSameRowRight: false,
		onlyRightOfA: true,
		rowEps: 2.0,
		clusterThreshold: 8.0,
		expandRightWithin: 35.0,
		maxBelowA: 12.0,
		requireSamePageWithB: true,
		stripLabelPrefixes: true,
		stripTokens: ['If Yes, please provide details'],
		debug: false,
	},
	// Services: central heating type
	{
		label: 'If Yes, please state the type of central heating',
		nextLabel: 'Mains drainage',
		nextLabelIncludes: 'Mains drainage',
		belowLabelIncludes: 'SERVICES',
		anchorBeforeIncludes: 'Central Heating',
		leftBand: 14.0,
		includeSameRowRight: false,
		onlyRightOfA: true,
		rightSlack: 0.5,
		rowEps: 2.0,
		clusterThreshold: 8.0,
		expandRightWithin: 30.0,
		maxBelowA: 6.0,
		requireSamePageWithB: true,
		stripLabelPrefixes: true,
		stripTokens: ['If Yes, please state the type of central heating'],
		debug: false,
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
		const findBlock = ({ exact, includes, altIncludes, belowTop, samePageAs }) => {
			// 1) exact match
			if (exact) {
				const exactBlock = blocks.find(b =>
					b.labelText === exact &&
					(typeof belowTop !== 'number' || b.topStart > belowTop) &&
					(samePageAs === undefined || b.page === samePageAs)
				);
				if (exactBlock) return exactBlock;
			}
			// 2) includes match (primary)
			if (includes) {
				const needle = String(includes).toLowerCase();
				const inc = blocks.find(b =>
					String(b.labelText).toLowerCase().includes(needle) &&
					(typeof belowTop !== 'number' || b.topStart > belowTop) &&
					(samePageAs === undefined || b.page === samePageAs)
				);
				if (inc) return inc;
			}
			// 3) includes match (alternate)
			if (altIncludes) {
				const needleAlt = String(altIncludes).toLowerCase();
				const incAlt = blocks.find(b =>
					String(b.labelText).toLowerCase().includes(needleAlt) &&
					(typeof belowTop !== 'number' || b.topStart > belowTop) &&
					(samePageAs === undefined || b.page === samePageAs)
				);
				if (incAlt) return incAlt;
			}
			return null;
		};

		// Optional anchor to force matching below a specific section label
		let belowTop = undefined;
		if (f.belowLabel || f.belowLabelIncludes) {
			const anchor = findBlock({ exact: f.belowLabel, includes: f.belowLabelIncludes });
			if (anchor) {
				belowTop = anchor.topEnd;
			} else {
				// If a section anchor was requested but not found, avoid global fallback
				out[f.label] = null;
				continue;
			}
		}

		let a = null;
		let b = null;

		// If a specific preceding anchor is provided, choose A as the first matching label below it on the same page
		if (f.anchorBeforeIncludes) {
			const before = findBlock({ includes: f.anchorBeforeIncludes, belowTop });
			if (before) {
				a = findBlock({
					exact: f.label,
					includes: f.labelIncludes,
					altIncludes: f.labelAltIncludes,
					belowTop: before.topEnd,
					samePageAs: before.page,
				});
			} else {
				// If we cannot find the preceding question, do not guess globally
				out[f.label] = null;
				continue;
			}
		}

		if (f.requireSamePageWithB) {
			// Prefer finding B relative to A (same page, below A, with optional left constraints)
			if (a) {
				b = findBlockBelowA(a, {
					exact: f.nextLabel,
					includes: f.nextLabelIncludes,
					altIncludes: f.nextLabelAltIncludes,
					leftMax: f.nextLabelLeftMax,
					leftMin: f.nextLabelLeftMin,
				});
			}
			// Fallback: generic B finder constrained by any section anchor
			if (!b) {
				b = findBlock({ exact: f.nextLabel, includes: f.nextLabelIncludes, altIncludes: f.nextLabelAltIncludes, belowTop });
			}
			// Do not continue if either A or B could not be reliably located
			if (!b || !a) {
				out[f.label] = null;
				continue;
			}
		} else {
			if (!a) {
				a = findBlock({ exact: f.label, includes: f.labelIncludes, altIncludes: f.labelAltIncludes, belowTop });
			}
		}

		// Prefer picking B below A when using includes/altIncludes to disambiguate duplicates
		function findBlockBelowA(aBlock, { exact, includes, altIncludes, leftMax, leftMin }) {
			const samePage = (b) => b.page === aBlock.page;
			const isBelow = (b) => b.topStart > aBlock.topEnd;
			const leftOk = (b) =>
				(typeof leftMax !== 'number' || b.left <= leftMax) &&
				(typeof leftMin !== 'number' || b.left >= leftMin);

			let candidates = [];

			if (exact) {
				candidates = blocks.filter(b => b.labelText === exact && samePage(b) && isBelow(b) && leftOk(b));
			} else {
				const needles = [includes, altIncludes]
					.filter(Boolean)
					.map(s => String(s).toLowerCase());
				if (needles.length > 0) {
					candidates = blocks.filter(b => samePage(b) && isBelow(b) && leftOk(b) && needles.some(n => String(b.labelText).toLowerCase().includes(n)));
				}
			}

			if (candidates.length > 0) {
				return candidates.sort((b1, b2) => (b1.topStart - aBlock.topEnd) - (b2.topStart - aBlock.topEnd))[0];
			}

			// Fallback to generic finder if nothing found below
			return findBlock({ exact, includes, altIncludes, belowTop });
		}

		if (!b) {
			b = a
				? findBlockBelowA(a, {
					exact: f.nextLabel,
					includes: f.nextLabelIncludes,
					altIncludes: f.nextLabelAltIncludes,
					leftMax: f.nextLabelLeftMax,
					leftMin: f.nextLabelLeftMin,
				  })
				: findBlock({ exact: f.nextLabel, includes: f.nextLabelIncludes, altIncludes: f.nextLabelAltIncludes, belowTop });
		}
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
			{
				leftBand: f.leftBand,
				clusterThreshold: f.clusterThreshold,
				expandRightWithin: f.expandRightWithin,
				includeSameRowRight: f.includeSameRowRight,
				rowEps: f.rowEps,
				onlyRightOfA: f.onlyRightOfA,
				rightSlack: f.rightSlack,
				allowCrossPage: f.allowCrossPage,
				maxBelowA: f.maxBelowA,
				debug: f.debug,
				stripLabelPrefixes: f.stripLabelPrefixes,
				stripTokens: f.stripTokens,
				labelAText: a?.labelText
			}
		);
		if (f.debug) {
			console.log('[textarea] value for', f.label, '=>', value);
		}
		const keyName = f.mapKey || f.label;
		out[keyName] = value ?? null;
	}

	return out;
}


