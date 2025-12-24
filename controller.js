import { extractSpansFromPdfBuffer } from './pdfService.js';
import { extractCheckboxFields } from './src/services/checkboxFields/index.js';
import { extractValueColumns } from './src/services/valueColumns/index.js';
import { buildPropertyTypeGroup } from './src/services/fields/propertyTypeFields/index.js';
import { buildAccommodationGroup } from './src/services/fields/accommodationFields/index.js';

/**
 * POST /api/extract-fields
 * Accepts: multipart/form-data with "file" (PDF)
 */
export async function extractFieldsController(req, res) {
	try {
		if (!req.file || !req.file.buffer) {
			return res.status(400).json({ error: 'Missing PDF file in "file" field.' });
		}

		const spans = await extractSpansFromPdfBuffer(req.file.buffer);
		const checkbox = extractCheckboxFields(spans);
		const valueCols = extractValueColumns(spans);

		const propertyType = buildPropertyTypeGroup({ mapped: {}, checkbox, valueCols, spans });
		const accommodation = buildAccommodationGroup({ spans, checkbox, valueCols });
		return res.json({ propertyType, accommodation });
	} catch (err) {
		console.error('Extraction error:', err);
		return res.status(500).json({ error: 'Failed to extract fields' });
	}
}


