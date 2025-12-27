import { PROPERTY_TYPE_FIELDS, extractChargesFromRawText } from './config.js';
import { extractTextareaFields } from '../../textareaFields/index.js';

export function buildPropertyTypeGroup({ mapped, checkbox, valueCols, spans, rawText }) {
	const out = {};
	// Precompute textarea values once
	let textareaMap = null;
	
	// Extract charges from rawText for mapped fields
	const chargesFromRawText = rawText ? extractChargesFromRawText(rawText) : null;
	
	for (const item of PROPERTY_TYPE_FIELDS) {
		const outputKey = item.outputKey || item.key;
		const sourceKey = item.key;
		let value = null;
		if (item.source === 'checkbox') {
			value = checkbox?.[sourceKey] ?? null;
		} else if (item.source === 'valueCols') {
			value = valueCols?.[sourceKey] ?? null;
		} else if (item.source === 'mapped') {
			// For mapped source, check if it's one of the charge fields and extract from rawText
			if (chargesFromRawText) {
				if (outputKey === 'maintenanceCharge') {
					value = chargesFromRawText.maintenanceCharge;
				} else if (outputKey === 'roadCharges') {
					value = chargesFromRawText.roadCharges;
				} else if (outputKey === 'groundRent') {
					value = chargesFromRawText.groundRent;
				} else {
					// For other mapped fields, use the mapped object
					value = mapped?.[sourceKey] ?? null;
				}
			} else {
				value = mapped?.[sourceKey] ?? null;
			}
		} else if (item.source === 'textarea') {
			if (!textareaMap) textareaMap = extractTextareaFields(spans);
			const textareaKey = item.textareaMapKey || sourceKey;
			value = textareaMap?.[textareaKey] ?? null;
		}
		out[outputKey] = value ?? null;
	}
	return out;
}

export { PROPERTY_TYPE_FIELDS };


