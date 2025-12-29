import { extractPropertyType, extractPropertyTypeStatuses } from './propertyTypeExtractor.js';
import { extractYesNo } from './yesNoExtractor.js';
import { PROPERTY_TYPE_FIELDS } from '../fields/propertyTypeFields/config.js';
import { CURRENT_OCCUPANCY_FIELDS } from '../fields/currentOccupancyFields/config.js';
import { NEW_BUILD_FIELDS } from '../fields/newBuildFields/config.js';
import { REPORTS_FIELDS } from '../fields/reportsFields/config.js';
import { ESSENTIAL_REPAIRS_FIELDS } from '../fields/essentialRepairsFields/config.js';
import { LOCALITY_AND_DEMAND_FIELDS } from '../fields/localityAndDemandFields/config.js';
import { REPORTS_FIELDS as SERVICES_REPORTS_FIELDS } from '../fields/servicesFields/config.js';
import { CONSTRUCTION_FIELDS } from '../fields/constructionFields/config.js';
import { CONDITION_OF_PROPERTY_FIELDS } from '../fields/conditionOfPropertyFields/config.js';
import { ACCOMMODATION_FIELDS } from '../fields/accommodationFields/config.js';
import { RENTAL_INFORMATION_FIELDS } from '../fields/rentalInformationFields/config.js';
import { VALUATION_FOR_FINANCE_PURPOSES_BTL_FIELDS } from '../fields/valuationForFinancePurposesBTLFields/config.js';
import { VALUATION_FOR_FINANCE_PURPOSES_HPP_FIELDS } from '../fields/valuationForFinancePurposesHPPFields/config.js';

function extractSingleCheckbox(
	spans,
	{
		label,
		left,
		topThreshold = 0.6,
		leftThreshold = 2.0,
		belowAnchorLabel,
		belowAnchorIncludes,
		rowTop,
		fallbackMaxLeft = 6.0,
		allowRowFallback = false,
		debug = false,
	}
) {
	if (!Array.isArray(spans)) return null;
	let labelSpan = null;
	let pageForRow = undefined;
	if (belowAnchorLabel || belowAnchorIncludes) {
		let anchor = null;
		if (belowAnchorLabel) {
			anchor = spans.find(s => s.text === belowAnchorLabel);
		}
		if (!anchor && belowAnchorIncludes) {
			const needle = String(belowAnchorIncludes).toLowerCase();
			anchor = spans.find(s => typeof s.text === 'string' && s.text.toLowerCase().includes(needle));
		}
		if (anchor) {
			pageForRow = anchor.page;
			// Gather all occurrences of the label below the anchor on the same page
			const candidates = spans
				.filter(s => s.text === label && s.page === anchor.page && s.top > anchor.top)
				.sort((a, b) => (a.top - anchor.top) - (b.top - anchor.top));
			// Prefer the candidate whose row has a marker near the desired left coordinate
			const markers = new Set(['X', 'x', '✓', '✔', '☑', '☒', '■', '●']);
			const pickWithLeftMatch = candidates.find(c =>
				spans.some(s =>
					s.page === c.page &&
					Math.abs(s.top - c.top) < (topThreshold ?? 0.6) &&
					Math.abs(s.left - left) <= (leftThreshold ?? 2.0) &&
					typeof s.text === 'string' &&
					markers.has(String(s.text).trim())
				)
			);
			labelSpan = pickWithLeftMatch || candidates[0] || null;
		}
	}
	if (!labelSpan) {
		labelSpan = spans.find(s => s.text === label);
		pageForRow = labelSpan?.page;
	}
	if (!labelSpan) return null;
	const markers = new Set(['X', 'x', '✓', '✔', '☑', '☒', '■', '●']);

	// Determine the row top to test against
	const rowTopVal = (typeof rowTop === 'number') ? rowTop : labelSpan.top;
	const rowPage = pageForRow ?? labelSpan.page;

	const candidates = spans.filter(s =>
		s.page === rowPage &&
		Math.abs(s.top - rowTopVal) < topThreshold &&
		Math.abs(s.left - left) <= leftThreshold &&
		typeof s.text === 'string' &&
		s.text.trim().length > 0
	);
	const hit = candidates.find(c => markers.has(String(c.text).trim()));
	if (hit) return 'X';

	// Inline word detection for services-style rows: prefer explicit Yes/No typed in the box
	const isYesWord = (t) => /^yes$/i.test(String(t).trim()) || /^y$/i.test(String(t).trim());
	const isNoWord = (t) => /^no$/i.test(String(t).trim()) || /^n$/i.test(String(t).trim());
	const yesWord = candidates.find(c => isYesWord(c.text));
	const noWord = candidates.find(c => isNoWord(c.text));
	if (yesWord && !noWord) return 'Yes';
	if (noWord && !yesWord) return 'No';
	// If both appear (rare), choose the closer to the expected left
	if (yesWord && noWord) {
		const dYes = Math.abs(yesWord.left - left);
		const dNo = Math.abs(noWord.left - left);
		return dYes <= dNo ? 'Yes' : 'No';
	}

	// Fallback: choose nearest marker on this row within a wider horizontal window
	const rowMarkers = spans
		.filter(s =>
			s.page === rowPage &&
			Math.abs(s.top - rowTopVal) < topThreshold &&
			markers.has(String(s.text).trim())
		)
		.map(s => ({ s, horiz: Math.abs(s.left - left) }))
		.sort((a, b) => a.horiz - b.horiz);
	if (allowRowFallback && rowMarkers.length > 0 && rowMarkers[0].horiz <= fallbackMaxLeft) {
		return 'X';
	}

	// As a last resort, look across the row for Yes/No words within a wider left window
	const rowWords = spans
		.filter(s =>
			s.page === rowPage &&
			Math.abs(s.top - rowTopVal) < topThreshold &&
			typeof s.text === 'string' &&
			(isYesWord(s.text) || isNoWord(s.text))
		)
		.map(s => ({ s, horiz: Math.abs(s.left - left), val: isYesWord(s.text) ? 'Yes' : 'No' }))
		.sort((a, b) => a.horiz - b.horiz);
	if (rowWords.length > 0 && rowWords[0].horiz <= (leftThreshold * 2)) {
		return rowWords[0].val;
	}
	return null;
}

/**
 * Extract checkbox-related fields from spans.
 *
 * @param {Array<{ text: string, left: number, top: number, page: number }>} spans
 * @returns {Record<string, string|null>}
 */
export function extractCheckboxFields(spans, { applicationType } = {}) {
	const propertyType = extractPropertyType(spans);
	const statuses = extractPropertyTypeStatuses(spans);

	// Normalize checkbox outputs to boolean/null (per requirements):
	// 1) X-style fields: true if X exists, otherwise null
	// 2) Yes/No fields: Yes->true, No->false, N/A/null->null
	// 3) servicesSeparateForFlats: keep as string "Yes"/"No"/"N/A"/null
	const SERVICES_SEPARATE_LABEL = 'If house split in to flats, are services separate for each unit?';
	const normToken = (v) => String(v ?? '').trim();
	const toYesNoBool = (v) => {
		const s = normToken(v);
		if (!s) return null;
		const up = s.toUpperCase();
		if (up === 'YES' || up === 'Y' || up === 'TRUE') return true;
		if (up === 'NO' || up === 'N' || up === 'FALSE') return false;
		if (up === 'N/A' || up === 'NA') return null;
		return null;
	};
	const toXBool = (v) => {
		const up = normToken(v).toUpperCase();
		return up === 'X' ? true : null;
	};
	const toSingleBool = (v) => {
		// Some single-checkbox boxes contain words (Yes/No) instead of an X
		const s = normToken(v);
		if (!s) return null;
		const up = s.toUpperCase();
		if (up === 'X') return true;
		if (up === 'YES' || up === 'Y' || up === 'TRUE') return true;
		if (up === 'NO' || up === 'N' || up === 'FALSE') return false;
		if (up === 'N/A' || up === 'NA') return null;
		return null;
	};

	const yesNoResults = {};
	// NOTE: BTL vs HPP share label text but have different yes/no left coords.
	// We must include only the relevant set based on applicationType.
	const app = String(applicationType || '').trim().toUpperCase();
	const valuationYesNoFields =
		app === 'BTL'
			? [...RENTAL_INFORMATION_FIELDS, ...VALUATION_FOR_FINANCE_PURPOSES_BTL_FIELDS]
			: app === 'HPP'
				? [...VALUATION_FOR_FINANCE_PURPOSES_HPP_FIELDS]
				: [];

	const yesNoConfigs = [
		...PROPERTY_TYPE_FIELDS,
		...CURRENT_OCCUPANCY_FIELDS,
		...NEW_BUILD_FIELDS,
		...REPORTS_FIELDS,
		...SERVICES_REPORTS_FIELDS,
		...LOCALITY_AND_DEMAND_FIELDS,
		...ESSENTIAL_REPAIRS_FIELDS,
		...CONSTRUCTION_FIELDS,
		...CONDITION_OF_PROPERTY_FIELDS,
		...valuationYesNoFields,
	]
		.filter(f => f.source === 'checkbox' && typeof f.yesLeft === 'number' && typeof f.noLeft === 'number')
		.map(f => ({
			label: f.key,
			yesLeft: f.yesLeft,
			noLeft: f.noLeft,
			naLeft: typeof f.naLeft === 'number' ? f.naLeft : (typeof f.noNA === 'number' ? f.noNA : undefined),
			topThreshold: f.topThreshold,
			belowAnchorIncludes: f.belowAnchorIncludes || (typeof f.key === 'string' && f.key.toLowerCase().includes('services separate for each unit') ? 'SERVICES' : undefined),
			rowLabelIncludes: f.rowLabelIncludes || f.key,
			leftWindow: f.leftWindow,
			allowWordFallback: f.allowWordFallback,
			allowNaWordFallback: f.allowNaWordFallback,
			rowFallbackMaxLeft: f.rowFallbackMaxLeft,
			debug: f.debug,
		}));

	// Do NOT add synthetic Yes/No rows for SERVICES here.
	// Services rows are typed next to the label; we handle them via single-checkbox logic with word detection.
	for (const cfg of yesNoConfigs) {
		yesNoResults[cfg.label] = extractYesNo(spans, cfg);
	}

	// Single checkboxes at a specific left position (no Yes/No pair)
	const singleCheckboxResults = {};
	const singleCheckboxConfigs = [
		...PROPERTY_TYPE_FIELDS,
		...CURRENT_OCCUPANCY_FIELDS,
		...NEW_BUILD_FIELDS,
		...REPORTS_FIELDS,
		...ESSENTIAL_REPAIRS_FIELDS,
		...LOCALITY_AND_DEMAND_FIELDS,
		...CONSTRUCTION_FIELDS,
		...CONDITION_OF_PROPERTY_FIELDS,
	]
		.filter(f => f.source === 'checkbox' && typeof f.left === 'number' && (typeof f.yesLeft !== 'number' || typeof f.noLeft !== 'number'))
		.map(f => ({
			label: f.key,
			mapKey: f.checkboxMapKey,
			left: f.left,
			topThreshold: f.topThreshold,
			leftThreshold: f.leftThreshold,
			belowAnchorLabel: f.belowAnchorLabel,
			belowAnchorIncludes: f.belowAnchorIncludes,
			rowTop: f.rowTop,
			fallbackMaxLeft: f.fallbackMaxLeft,
			allowRowFallback: f.allowRowFallback,
			debug: f.debug,
		}));

	// Services section: treat entries with a left value as single checkboxes and key results by outputKey to avoid collisions (e.g., 'Unknown')
	const servicesSingleConfigs = SERVICES_REPORTS_FIELDS
		.filter(f => typeof f.left === 'number' && (typeof f.yesLeft !== 'number' || typeof f.noLeft !== 'number'))
		.map(f => ({
			label: f.key,
			mapKey: f.outputKey || f.key,
			left: f.left,
			topThreshold: f.topThreshold ?? 1.5,
			leftThreshold: f.leftThreshold ?? 4.0,
			belowAnchorIncludes: f.belowAnchorIncludes ?? 'SERVICES',
			allowRowFallback: f.allowRowFallback,
			fallbackMaxLeft: f.fallbackMaxLeft,
			debug: false,
		}));

	// Accommodation: some labels like "Private" / "Communal" also occur in SERVICES, so anchor them under "Gardens"
	const accommodationSingleConfigs = ACCOMMODATION_FIELDS
		.filter(f => f.source === 'checkbox' && typeof f.left === 'number')
		.map(f => ({
			label: f.key,
			// Use outputKey so the field maps directly (e.g. privateGarden/sharedGarden)
			mapKey: f.outputKey || f.key,
			left: f.left,
			topThreshold: f.topThreshold ?? 0.8,
			leftThreshold: f.leftThreshold ?? 3.0,
			belowAnchorLabel: (f.key === 'Private' || f.key === 'Communal') ? 'Gardens' : f.belowAnchorLabel,
			allowRowFallback: f.allowRowFallback,
			fallbackMaxLeft: f.fallbackMaxLeft,
			debug: false,
		}));

	const allSingles = [...singleCheckboxConfigs, ...servicesSingleConfigs, ...accommodationSingleConfigs];
	for (const cfg of allSingles) {
		const val = extractSingleCheckbox(spans, cfg);
		const key = cfg.mapKey || cfg.label;
		singleCheckboxResults[key] = val;
	}

	// Apply boolean normalization to checkbox values (but keep "Property Type" as a string label)
	const normalized = {};
	// X-style: property type option statuses are X/null -> boolean
	for (const [k, v] of Object.entries(statuses)) {
		normalized[k] = toXBool(v);
	}
	// Yes/No(/N/A): boolean/null, except servicesSeparateForFlats remains string
	for (const [k, v] of Object.entries(yesNoResults)) {
		normalized[k] = (k === SERVICES_SEPARATE_LABEL) ? (v ?? null) : toYesNoBool(v);
	}
	// Single checkboxes: default false when empty; map words when present
	for (const [k, v] of Object.entries(singleCheckboxResults)) {
		normalized[k] = toSingleBool(v);
	}

	return { 'Property Type': propertyType, ...normalized };
}


