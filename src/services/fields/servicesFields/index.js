import { REPORTS_FIELDS as SERVICES_CONFIG } from './config.js';
import { extractTextareaFields } from '../../textareaFields/index.js';

export function buildServicesGroup({ spans, checkbox, valueCols }) {
	const out = {};
	let textareaMap = null;
	for (const item of SERVICES_CONFIG) {
		const outputKey = item.outputKey || item.key;
		const labelKey = item.key;
		// Prefer values keyed by outputKey (set by servicesSingleConfigs), otherwise fall back to label or yes/no extraction
		let value = null;
		if (item.source === 'checkbox') {
			value = checkbox?.[outputKey] ?? checkbox?.[labelKey] ?? null;
		} else if (item.source === 'textarea') {
			if (!textareaMap) textareaMap = extractTextareaFields(spans);
			// The service textarea is registered by its exact label in textarea registry
			// Try multiple keys to avoid collisions on generic labels
			value =
				textareaMap?.[item.textareaMapKey] ??
				textareaMap?.[outputKey] ??
				textareaMap?.[labelKey] ??
				null;
		}
		out[outputKey] = value ?? null;
	}
	return out;
}

export { SERVICES_CONFIG };


