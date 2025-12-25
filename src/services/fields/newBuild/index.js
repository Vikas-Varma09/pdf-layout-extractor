import { NEW_BUILD_FIELDS } from './config.js';
import { extractTextareaFields } from '../../textareaFields/index.js';

export function buildNewBuildGroup({ spans, checkbox, valueCols }) {
	const out = {};
	let textareaMap = null;
	for (const item of NEW_BUILD_FIELDS) {
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

export { NEW_BUILD_FIELDS };


