import { CONDITION_OF_PROPERTY_FIELDS } from './config.js';
import { extractTextareaFields } from '../../textareaFields/index.js';

export function buildConditionOfPropertyGroup({ spans, checkbox, valueCols }) {
	const out = {};
	let textareaMap = null;
	for (const item of CONDITION_OF_PROPERTY_FIELDS) {
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

export { CONDITION_OF_PROPERTY_FIELDS };

