import { matchXToOption } from './checkboxMatcher.js';
import { PROPERTY_TYPE_FIELDS } from '../fields/propertyTypeFields/config.js';

function getCheckboxOptionsFromConfig() {
	// Use only checkbox fields that have a left coordinate defined in config
	return PROPERTY_TYPE_FIELDS
		.filter(f => f.source === 'checkbox' && typeof f.left === 'number')
		.map(f => ({ label: f.key, left: f.left }));
}

/**
 * Extract "Property Type" from three checkbox options by detecting the X mark
 * and matching it to the closest option on the same row using spatial logic.
 *
 * @param {Array<{ text: string, left: number, top: number, page: number }>} spans
 * @returns {string|null}
 */
export function extractPropertyType(spans) {
	if (!Array.isArray(spans) || spans.length === 0) return null;

	// Find label spans to derive the row (top and page) for each option
	const optionAnchors = [];
	for (const opt of getCheckboxOptionsFromConfig()) {
		const labelSpan = spans.find(s => s.text === opt.label);
		if (!labelSpan) continue;
		optionAnchors.push({
			label: opt.label,
			left: opt.left, // use hardcoded left to be robust across PDFs
			top: labelSpan.top,
			page: labelSpan.page,
		});
	}

	if (optionAnchors.length === 0) {
		return null;
	}

	// Detect "X" marks
	const xMarks = spans.filter(s => String(s.text).trim() === 'X');
	if (xMarks.length === 0) {
		return null;
	}

	// Match each X to nearest option on the same row (|top difference| < 0.6)
	for (const x of xMarks) {
		const match = matchXToOption(x, optionAnchors, 0.6);
		if (match) {
			return match.label;
		}
	}

	return null;
}

/**
 * Compute per-option statuses for property type checkboxes.
 * Returns an object with each option label -> "X" or null, based on spatial proximity.
 *
 * @param {Array<{ text: string, left: number, top: number, page: number }>} spans
 * @returns {Record<string, string|null>}
 */
export function extractPropertyTypeStatuses(spans) {
	const result = {};
	for (const opt of getCheckboxOptionsFromConfig()) {
		result[opt.label] = null;
	}
	if (!Array.isArray(spans) || spans.length === 0) return result;

	// Derive anchors (row top + page) from actual label spans
	const anchors = [];
	for (const opt of getCheckboxOptionsFromConfig()) {
		const labelSpan = spans.find(s => s.text === opt.label);
		if (!labelSpan) continue;
		anchors.push({
			label: opt.label,
			left: opt.left,
			top: labelSpan.top,
			page: labelSpan.page,
		});
	}
	if (anchors.length === 0) return result;

	// All X marks
	const xMarks = spans.filter(s => String(s.text).trim() === 'X');
	if (xMarks.length === 0) return result;

	// For each option, find closest X on same row (|top diff| < 0.6)
	for (const anchor of anchors) {
		const rowXs = xMarks
			.filter(x => x.page === anchor.page && Math.abs(x.top - anchor.top) < 0.6)
			.map(x => ({ x, horiz: Math.abs(x.left - anchor.left) }))
			.filter(({ horiz }) => horiz <= 2.0); // constrain to nearby X only

		if (rowXs.length === 0) {
			result[anchor.label] = null;
			continue;
		}

		const best = rowXs.reduce((a, b) => (a.horiz < b.horiz ? a : b)).x;
		result[anchor.label] = 'X';
	}

	return result;
}


