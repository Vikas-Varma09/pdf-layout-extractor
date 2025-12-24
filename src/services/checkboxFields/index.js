import { extractPropertyType, extractPropertyTypeStatuses } from './propertyTypeExtractor.js';
import { extractYesNo } from './yesNoExtractor.js';

/**
 * Extract checkbox-related fields from spans.
 *
 * @param {Array<{ text: string, left: number, top: number, page: number }>} spans
 * @returns {Record<string, string|null>}
 */
export function extractCheckboxFields(spans) {
	const propertyType = extractPropertyType(spans);
	const statuses = extractPropertyTypeStatuses(spans);

	// Generic Yes/No questions configured by label and coordinates
	const yesNoConfigs = [
		{ label: 'Property built or owned by the Local Authority?', yesLeft: 40.33, noLeft: 46.36 },
		{ label: 'Above commercial', yesLeft: 40.33, noLeft: 46.36 },
		{ label: 'Flying freehold', yesLeft: 19.6, noLeft: 26.88 },
		{ label: 'Is any part of the property in commercial use?', yesLeft: 40.15, noLeft: 46.36 },
		{ label: 'under a shared ownership scheme?', yesLeft: 40.15, noLeft: 46.36 },
	];
	const yesNoResults = {};
	for (const cfg of yesNoConfigs) {
		yesNoResults[cfg.label] = extractYesNo(spans, cfg);
	}
	return {
		'Property Type': propertyType,
		...statuses,
		...yesNoResults,
	};
}


