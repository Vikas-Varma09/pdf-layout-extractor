import { VALUATION_FOR_FINANCE_PURPOSES_BTL_FIELDS } from './config.js';

export function buildValuationForFinancePurposesBTLGroup({ spans, checkbox, valueCols }) {
	const out = {};
	for (const item of VALUATION_FOR_FINANCE_PURPOSES_BTL_FIELDS) {
		const outputKey = item.outputKey || item.key;
		const sourceKey = item.key;
		let value = null;
		if (item.source === 'checkbox') {
			value = checkbox?.[sourceKey] ?? null;
		} else if (item.source === 'valueCols') {
			value = valueCols?.[sourceKey] ?? null;
		}
		out[outputKey] = value ?? null;
	}
	return out;
}

export { VALUATION_FOR_FINANCE_PURPOSES_BTL_FIELDS };


