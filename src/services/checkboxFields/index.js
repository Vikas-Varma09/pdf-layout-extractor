import { extractPropertyType, extractPropertyTypeStatuses } from './propertyTypeExtractor.js';
import { extractYesNo } from './yesNoExtractor.js';
import { PROPERTY_TYPE_FIELDS } from '../fields/propertyTypeFields/config.js';
import { CURRENT_OCCUPANCY_FIELDS } from '../fields/currentOccupancyFields/config.js';
import { NEW_BUILD_FIELDS } from '../fields/newBuild/config.js';
import { REPORTS_FIELDS } from '../fields/reportsFields/config.js';
import { ESSENTIAL_REPAIRS_FIELDS } from '../fields/essentialRepairsFields/config.js';
import { LOCALITY_AND_DEMAND_FIELDS } from '../fields/localityAndDemandFields/config.js';

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
			// pick the nearest occurrence of label below the anchor on the same page
			const candidates = spans
				.filter(s => s.text === label && s.page === anchor.page && s.top > anchor.top)
				.sort((a, b) => (a.top - anchor.top) - (b.top - anchor.top));
			labelSpan = candidates[0] || null;
			if (debug) {
				console.log('[chk] anchor', belowAnchorLabel || belowAnchorIncludes, '=>', anchor ? { page: anchor.page, top: anchor.top } : null);
				console.log('[chk] labelSpan (below anchor)', label, '=>', labelSpan ? { page: labelSpan.page, top: labelSpan.top } : null);
			}
		}
	}
	if (!labelSpan) {
		labelSpan = spans.find(s => s.text === label);
		pageForRow = labelSpan?.page;
		if (debug) {
			console.log('[chk] labelSpan (direct)', label, '=>', labelSpan ? { page: labelSpan.page, top: labelSpan.top } : null);
		}
	}
	if (!labelSpan) return null;
	const markers = new Set(['X', 'x', '✓', '✔', '☑', '☒', '■', '●']);

	// Determine the row top to test against
	const rowTopVal = (typeof rowTop === 'number') ? rowTop : labelSpan.top;
	const rowPage = pageForRow ?? labelSpan.page;
	if (debug) {
		console.log('[chk] row context', { rowPage, rowTopVal, left, topThreshold, leftThreshold });
	}

	const candidates = spans.filter(s =>
		s.page === rowPage &&
		Math.abs(s.top - rowTopVal) < topThreshold &&
		Math.abs(s.left - left) <= leftThreshold &&
		typeof s.text === 'string' &&
		s.text.trim().length > 0
	);
	const hit = candidates.find(c => markers.has(String(c.text).trim()));
	if (debug) {
		console.log('[chk] near candidates', candidates.map(c => ({ text: c.text, left: c.left, top: c.top })));
		console.log('[chk] near hit', !!hit);
	}
	if (hit) return 'X';

	// Fallback: choose nearest marker on this row within a wider horizontal window
	const rowMarkers = spans
		.filter(s =>
			s.page === rowPage &&
			Math.abs(s.top - rowTopVal) < topThreshold &&
			markers.has(String(s.text).trim())
		)
		.map(s => ({ s, horiz: Math.abs(s.left - left) }))
		.sort((a, b) => a.horiz - b.horiz);
	if (debug) {
		console.log('[chk] row markers', rowMarkers.slice(0, 3).map(m => ({ text: m.s.text, left: m.s.left, top: m.s.top, horiz: m.horiz })));
		console.log('[chk] allowRowFallback?', allowRowFallback, 'fallbackMaxLeft', fallbackMaxLeft);
	}
	if (allowRowFallback && rowMarkers.length > 0 && rowMarkers[0].horiz <= fallbackMaxLeft) {
		return 'X';
	}
	return null;
}

/**
 * Extract checkbox-related fields from spans.
 *
 * @param {Array<{ text: string, left: number, top: number, page: number }>} spans
 * @returns {Record<string, string|null>}
 */
export function extractCheckboxFields(spans) {
	const propertyType = extractPropertyType(spans);
	const statuses = extractPropertyTypeStatuses(spans);

	const yesNoResults = {};
	const yesNoConfigs = [
		...PROPERTY_TYPE_FIELDS,
		...CURRENT_OCCUPANCY_FIELDS,
		...NEW_BUILD_FIELDS,
		...REPORTS_FIELDS,
		...LOCALITY_AND_DEMAND_FIELDS,
		...ESSENTIAL_REPAIRS_FIELDS,
	]
		.filter(f => f.source === 'checkbox' && typeof f.yesLeft === 'number' && typeof f.noLeft === 'number')
		.map(f => ({ label: f.key, yesLeft: f.yesLeft, noLeft: f.noLeft }));
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
	for (const cfg of singleCheckboxConfigs) {
		const val = extractSingleCheckbox(spans, cfg);
		const key = cfg.mapKey || cfg.label;
		singleCheckboxResults[key] = val;
	}
	return {
		'Property Type': propertyType,
		...statuses,
		...yesNoResults,
		...singleCheckboxResults,
	};
}


