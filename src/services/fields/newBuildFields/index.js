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
			const textareaKey = item.textareaMapKey || sourceKey;
			value = textareaMap?.[textareaKey] ?? null;
			// Guard: if extraction accidentally returns the label text, treat as null
			if (item.outputKey === 'incentivesDetails' && typeof value === 'string') {
				const v = value.trim().toLowerCase();
				if (
					v === 'including total value of incentives & if part exchange' ||
					v.startsWith('including total value of incentives & if part exchange') ||
					v === 'if yes, please provide details including total value of incentives & if part exchange' ||
					v.startsWith('if yes, please provide details including total value of incentives & if part exchange')
				) {
					value = null;
				}
			}
		}
		out[outputKey] = value ?? null;
	}
	return out;
}

export { NEW_BUILD_FIELDS };


