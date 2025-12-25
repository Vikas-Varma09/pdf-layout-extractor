import { extractPropertyType, extractPropertyTypeStatuses } from './propertyTypeExtractor.js';
import { extractYesNo } from './yesNoExtractor.js';
import { PROPERTY_TYPE_FIELDS } from '../fields/propertyTypeFields/config.js';
import { CURRENT_OCCUPANCY_FIELDS } from '../fields/currentOccupancyFields/config.js';
import { NEW_BUILD_FIELDS } from '../fields/newBuild/config.js';
import { REPORTS_FIELDS } from '../fields/reportsFields/config.js';

function extractSingleCheckbox(spans, { label, left, topThreshold = 0.6, leftThreshold = 2.0 }) {
	if (!Array.isArray(spans)) return null;
	const labelSpan = spans.find(s => s.text === label);
	if (!labelSpan) return null;
	const markers = new Set(['X', 'x', '✓', '✔', '☑', '☒', '■', '●']);
	const candidates = spans.filter(s =>
		s.page === labelSpan.page &&
		Math.abs(s.top - labelSpan.top) < topThreshold &&
		Math.abs(s.left - left) <= leftThreshold &&
		typeof s.text === 'string' &&
		s.text.trim().length > 0
	);
	const hit = candidates.find(c => markers.has(String(c.text).trim()));
	return hit ? 'X' : null;
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
	]
		.filter(f => f.source === 'checkbox' && typeof f.left === 'number' && (typeof f.yesLeft !== 'number' || typeof f.noLeft !== 'number'))
		.map(f => ({ label: f.key, left: f.left }));
	for (const cfg of singleCheckboxConfigs) {
		singleCheckboxResults[cfg.label] = extractSingleCheckbox(spans, cfg);
	}
	return {
		'Property Type': propertyType,
		...statuses,
		...yesNoResults,
		...singleCheckboxResults,
	};
}


