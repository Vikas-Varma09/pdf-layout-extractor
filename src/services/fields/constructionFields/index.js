import { CONSTRUCTION_FIELDS } from './config.js';
import { extractTextareaFields } from '../../textareaFields/index.js';

export function buildConstructionGroup({ spans, checkbox, valueCols }) {
	const out = {};
	// Precompute textarea values once
	let textareaMap = null;
	for (const item of CONSTRUCTION_FIELDS) {
		const outputKey = item.outputKey || item.key;
		const sourceKey = item.key;
		let value = null;
		if (item.source === 'checkbox') {
			value = checkbox?.[sourceKey] ?? null;
		} else if (item.source === 'valueCols') {
			value = valueCols?.[sourceKey] ?? null;
		} else if (item.source === 'textarea') {
			if (!textareaMap) textareaMap = extractTextareaFields(spans);
			const textareaKey = item.textareaMapKey || sourceKey;
			value = textareaMap?.[textareaKey] ?? null;
		}
		out[outputKey] = value ?? null;
	}
	return out;
}

