import { PROPERTY_TYPE_FIELDS } from './config.js';
import { extractTextareaFields } from '../../textareaFields/index.js';

export function buildPropertyTypeGroup({ mapped, checkbox, valueCols, spans }) {
	const out = {};
	// Precompute textarea values once
	let textareaMap = null;
	for (const item of PROPERTY_TYPE_FIELDS) {
		const outputKey = item.outputKey || item.key;
		const sourceKey = item.key;
		let value = null;
		if (item.source === 'checkbox') {
			value = checkbox?.[sourceKey] ?? null;
		} else if (item.source === 'valueCols') {
			value = valueCols?.[sourceKey] ?? null;
		} else if (item.source === 'mapped') {
			value = mapped?.[sourceKey] ?? null;
		} else if (item.source === 'textarea') {
			if (!textareaMap) textareaMap = extractTextareaFields(spans);
			value = textareaMap?.[sourceKey] ?? null;
		}
		out[outputKey] = value ?? null;
	}
	return out;
}

export { PROPERTY_TYPE_FIELDS };


