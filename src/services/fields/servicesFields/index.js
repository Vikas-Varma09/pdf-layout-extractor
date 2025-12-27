import { REPORTS_FIELDS as SERVICES_CONFIG } from './config.js';

export function buildServicesGroup({ checkbox }) {
	const out = {};
	for (const item of SERVICES_CONFIG) {
		const outputKey = item.outputKey || item.key;
		const labelKey = item.key;
		// Prefer values keyed by outputKey (set by servicesSingleConfigs), otherwise fall back to label or yes/no extraction
		const value =
			checkbox?.[outputKey] ??
			checkbox?.[labelKey] ??
			null;
		out[outputKey] = value ?? null;
	}
	return out;
}

export { SERVICES_CONFIG };


