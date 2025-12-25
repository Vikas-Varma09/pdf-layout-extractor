import { extractPropertyType, extractPropertyTypeStatuses } from './propertyTypeExtractor.js';
import { extractYesNo } from './yesNoExtractor.js';
import { PROPERTY_TYPE_FIELDS } from '../fields/propertyTypeFields/config.js';
import { CURRENT_OCCUPANCY_FIELDS } from '../fields/currentOccupancyFields/config.js';

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
	]
		.filter(f => f.source === 'checkbox' && typeof f.yesLeft === 'number' && typeof f.noLeft === 'number')
		.map(f => ({ label: f.key, yesLeft: f.yesLeft, noLeft: f.noLeft }));
	for (const cfg of yesNoConfigs) {
		yesNoResults[cfg.label] = extractYesNo(spans, cfg);
	}
	return {
		'Property Type': propertyType,
		...statuses,
		...yesNoResults,
	};
}


