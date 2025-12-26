import { LOCALITY_AND_DEMAND_FIELDS } from './config.js';

export function buildLocalityAndDemandGroup({ checkbox }) {
	const out = {};
	for (const item of LOCALITY_AND_DEMAND_FIELDS) {
		const outputKey = item.outputKey || item.key;
		const sourceKey = item.key;
		const checkboxKey = item.checkboxMapKey || sourceKey;
		let value = null;
		if (item.source === 'checkbox') {
			value = checkbox?.[checkboxKey] ?? null;
		}
		out[outputKey] = value ?? null;
	}
	return out;
}

export { LOCALITY_AND_DEMAND_FIELDS };


