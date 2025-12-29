import { extractValueAtLeft } from './valueAtLeftExtractor.js';
import { PROPERTY_TYPE_FIELDS } from '../fields/propertyTypeFields/config.js';
import { ACCOMMODATION_FIELDS } from '../fields/accommodationFields/config.js';
import { CURRENT_OCCUPANCY_FIELDS } from '../fields/currentOccupancyFields/config.js';
import { NEW_BUILD_FIELDS } from '../fields/newBuildFields/config.js';
import { ENERGY_EFFICIENCY_FIELDS } from '../fields/energyEfficiencyFields/config.js';
import { CONSTRUCTION_FIELDS } from '../fields/constructionFields/config.js';
import { RENTAL_INFORMATION_FIELDS } from '../fields/rentalInformationFields/config.js';
import { VALUATION_FOR_FINANCE_PURPOSES_BTL_FIELDS } from '../fields/valuationForFinancePurposesBTLFields/config.js';
import { VALUATION_FOR_FINANCE_PURPOSES_HPP_FIELDS } from '../fields/valuationForFinancePurposesHPPFields/config.js';

export function extractValueColumns(spans, { applicationType } = {}) {
	const out = {};

	function buildCfg(f) {
		const cfg = { label: f.key, targetLeft: f.targetLeft };
		const passthrough = [
			'labelIncludes',
			'labelAltIncludes',
			'debug',
			'rowRightFallback',
			'rowRightWithin',
			'topThreshold',
			'leftThreshold',
			'combineAdjacentDigits',
			'adjacentLeftWindow',
			'adjacentRightWindow',
			'additionalLefts',
			'combineVerticalWindow',
		];
		for (const k of passthrough) {
			if (f[k] !== undefined) cfg[k] = f[k];
		}
		return cfg;
	}

	// Build configs from central PROPERTY_TYPE_FIELDS with targetLeft defined
	for (const f of PROPERTY_TYPE_FIELDS) {
		if (f.source === 'valueCols' && typeof f.targetLeft === 'number') {
			out[f.key] = extractValueAtLeft(spans, buildCfg(f));
		}
	}
	// Also include ACCOMMODATION value columns
	for (const f of ACCOMMODATION_FIELDS) {
		if (f.source === 'valueCols' && typeof f.targetLeft === 'number') {
			out[f.key] = extractValueAtLeft(spans, buildCfg(f));
		}
	}
	// Include CURRENT OCCUPANCY value columns
	for (const f of CURRENT_OCCUPANCY_FIELDS) {
		if (f.source === 'valueCols' && typeof f.targetLeft === 'number') {
			out[f.key] = extractValueAtLeft(spans, buildCfg(f));
		}
	}
	// Include NEW BUILD value columns (future-proofing)
	for (const f of NEW_BUILD_FIELDS) {
		if (f.source === 'valueCols' && typeof f.targetLeft === 'number') {
			out[f.key] = extractValueAtLeft(spans, buildCfg(f));
		}
	}
	// Include ENERGY EFFICIENCY value columns
	for (const f of ENERGY_EFFICIENCY_FIELDS) {
		if (f.source === 'valueCols' && typeof f.targetLeft === 'number') {
			out[f.key] = extractValueAtLeft(spans, buildCfg(f));
		}
	}
	// Include CONSTRUCTION value columns
	for (const f of CONSTRUCTION_FIELDS) {
		if (f.source === 'valueCols' && typeof f.targetLeft === 'number') {
			out[f.key] = extractValueAtLeft(spans, buildCfg(f));
		}
	}
	// Application-type specific blocks (BTL vs HPP have same labels but different coordinates)
	const app = String(applicationType || '').trim().toUpperCase();
	if (app === 'BTL') {
		// Include RENTAL INFORMATION value columns
		for (const f of RENTAL_INFORMATION_FIELDS) {
			if (f.source === 'valueCols' && typeof f.targetLeft === 'number') {
				out[f.key] = extractValueAtLeft(spans, buildCfg(f));
			}
		}
		// Include VALUATION FOR FINANCE PURPOSES (BTL) value columns
		for (const f of VALUATION_FOR_FINANCE_PURPOSES_BTL_FIELDS) {
			if (f.source === 'valueCols' && typeof f.targetLeft === 'number') {
				out[f.key] = extractValueAtLeft(spans, buildCfg(f));
			}
		}
	} else if (app === 'HPP') {
		// Include VALUATION FOR FINANCE PURPOSES (HPP) value columns
		for (const f of VALUATION_FOR_FINANCE_PURPOSES_HPP_FIELDS) {
			if (f.source === 'valueCols' && typeof f.targetLeft === 'number') {
				out[f.key] = extractValueAtLeft(spans, buildCfg(f));
			}
		}
	}
	return out;
}


