import { mapSpecialFields, SPECIAL_FIELDS } from './specialFieldMapper.js';

/**
 * Extract special fields from flat spans.
 * Returns an object mapping label -> value (or null).
 *
 * @param {Array<{ text: string, left: number, top: number, page: number, fontSize?: number }>} spans
 * @returns {Record<string, string|null>}
 */
export function extractSpecialFields(spans) {
	const mapped = mapSpecialFields(spans);
	const out = {};
	for (const { label, value } of mapped) {
		out[label] = value ?? null;
	}
	return out;
}

export { SPECIAL_FIELDS };


