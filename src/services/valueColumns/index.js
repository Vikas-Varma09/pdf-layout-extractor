import { extractValueAtLeft } from './valueAtLeftExtractor.js';
import { PROPERTY_TYPE_FIELDS } from '../fields/propertyTypeFields/config.js';
import { ACCOMMODATION_FIELDS } from '../fields/accommodationFields/config.js';
import { CURRENT_OCCUPANCY_FIELDS } from '../fields/currentOccupancyFields/config.js';
import { NEW_BUILD_FIELDS } from '../fields/newBuild/config.js';
import { ENERGY_EFFICIENCY_FIELDS } from '../fields/energyEfficiencyFields/config.js';

export function extractValueColumns(spans) {
	const out = {};

	function buildCfg(f) {
		const cfg = { label: f.key, targetLeft: f.targetLeft };
		const passthrough = [
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
	return out;
}


