import { GENERAL_REMARK_FIELDS } from './config.js';
import { extractTextareaFields } from '../../textareaFields/index.js';
import { extractSpecialFields } from '../../specialFields/index.js';

function stripLeadingLabels(text) {
	if (typeof text !== 'string') return text;
	let out = text.trim();
	const patterns = [
		/^GENERAL REMARKS:\s*/i,
		/^Any other information which in your opinion Gatehouse Bank plc should note:\s*/i,
	];
	for (const re of patterns) {
		out = out.replace(re, '').trim();
	}
	return out;
}

export function buildGeneralRemarkGroup({ spans }) {
	const out = {};
	let textareaMap = null;
	let specialMap = null;

	for (const item of GENERAL_REMARK_FIELDS) {
		const outputKey = item.outputKey || item.key;
		const sourceKey = item.key;
		let value = null;

		if (item.source === 'textarea') {
			if (!textareaMap) textareaMap = extractTextareaFields(spans);
			// Fallback to special field mapper if textarea registry doesn't include this label
			value = textareaMap?.[sourceKey] ?? null;
			// Additional fallback: take GENERAL REMARKS block if present
			if (value == null && textareaMap) {
				value = textareaMap['GENERAL REMARKS:'] ?? null;
				if (value == null) {
					// try fuzzy key scan
					const k = Object.keys(textareaMap).find(k => String(k).toLowerCase().includes('general remarks'));
					if (k) value = textareaMap[k];
				}
			}
			if (value == null) {
				if (!specialMap) specialMap = extractSpecialFields(spans);
				value = specialMap?.[sourceKey] ?? null;
			}
		}
		if (typeof value === 'string') {
			value = stripLeadingLabels(value);
		}

		out[outputKey] = value ?? null;
	}

	return out;
}

export { GENERAL_REMARK_FIELDS };


