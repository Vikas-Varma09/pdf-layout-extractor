import { CURRENT_OCCUPANCY_FIELDS } from './config.js';
import { extractTextareaFields } from '../../textareaFields/index.js';

export function buildCurrentOccupancyGroup({ spans, checkbox, valueCols }) {
	const out = {};
	let textareaMap = null;
	for (const item of CURRENT_OCCUPANCY_FIELDS) {
		const outputKey = item.outputKey || item.key;
		const sourceKey = item.key;
		let value = null;
		if (item.source === 'checkbox') {
			value = checkbox?.[sourceKey] ?? null;
		} else if (item.source === 'valueCols') {
			value = valueCols?.[sourceKey] ?? null;
		} else if (item.source === 'textarea') {
			if (!textareaMap) textareaMap = extractTextareaFields(spans);
			value = textareaMap?.[sourceKey] ?? null;
		}
		out[outputKey] = value ?? null;
	}
	return out;
}

export { CURRENT_OCCUPANCY_FIELDS };


