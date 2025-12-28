import { extractSpansFromPdfBuffer } from './pdfService.js';
import { extractCheckboxFields } from './src/services/checkboxFields/index.js';
import { extractValueColumns } from './src/services/valueColumns/index.js';
import { buildPropertyTypeGroup } from './src/services/fields/propertyTypeFields/index.js';
import { buildAccommodationGroup } from './src/services/fields/accommodationFields/index.js';
import { buildGeneralRemarkGroup } from './src/services/fields/generalRemark/index.js';
import { buildCurrentOccupancyGroup } from './src/services/fields/currentOccupancyFields/index.js';
import { buildNewBuildGroup } from './src/services/fields/newBuild/index.js';
import { buildReportsGroup } from './src/services/fields/reportsFields/index.js';
import { buildEnergyEfficiencyGroup } from './src/services/fields/energyEfficiencyFields/index.js';
import { buildEssentialRepairsGroup } from './src/services/fields/essentialRepairsFields/index.js';
import { buildLocalityAndDemandGroup } from './src/services/fields/localityAndDemandFields/index.js';
import { buildServicesGroup } from './src/services/fields/servicesFields/index.js';
import { buildConstructionGroup } from './src/services/fields/constructionFields/index.js';
import { buildConditionOfPropertyGroup } from './src/services/fields/conditionOfPropertyFields/index.js';
import { extractRawTextFromOCR } from './src/services/ocrService.js';
import { mapValuersDeclaration } from './src/services/fields/valuersDeclarationFields/mapper.js';
import { parseHeader } from './src/services/fields/valuationReportDetailsFields/mapper.js';

/**
 * POST /api/extract-fields
 * Accepts: multipart/form-data with "file" (PDF)
 */
export async function extractFieldsController(req, res) {
	try {
		if (!req.file || !req.file.buffer) {
			return res.status(400).json({ error: 'Missing PDF file in "file" field.' });
		}

		// Create a copy of the buffer for OCR (in case the original gets consumed/detached)
		const pdfBuffer = Buffer.isBuffer(req.file.buffer) 
			? Buffer.from(req.file.buffer) 
			: Buffer.from(req.file.buffer);

		// Extract structured fields
		const spans = await extractSpansFromPdfBuffer(req.file.buffer);
		const checkbox = extractCheckboxFields(spans);
		const valueCols = extractValueColumns(spans);

		// Extract raw text using OCR service (use the copy we created)
		const rawText = await extractRawTextFromOCR(pdfBuffer);

		const propertyType = buildPropertyTypeGroup({ mapped: {}, checkbox, valueCols, spans, rawText });
		const accommodation = buildAccommodationGroup({ spans, checkbox, valueCols });
		const currentOccupancy = buildCurrentOccupancyGroup({ spans, checkbox, valueCols });
		const newBuild = buildNewBuildGroup({ spans, checkbox, valueCols });
		const reports = buildReportsGroup({ spans, checkbox, valueCols });
		const energyEfficiency = buildEnergyEfficiencyGroup({ spans, valueCols });
		const essentialRepairs = buildEssentialRepairsGroup({ spans, checkbox, valueCols });
		const localityAndDemand = buildLocalityAndDemandGroup({ spans, checkbox, valueCols });
		const services = buildServicesGroup({ spans, checkbox, valueCols });
		const construction = buildConstructionGroup({ spans, checkbox, valueCols });
		const conditionOfProperty = buildConditionOfPropertyGroup({ spans, checkbox, valueCols });
		const generalRemark = buildGeneralRemarkGroup({ spans });

		// Extract valuers declaration fields from rawText
		const valuersDeclaration = rawText ? mapValuersDeclaration(rawText) : null;

		// Extract valuation report details from rawText
		const valuationReportDetails = rawText ? parseHeader(rawText, null) : null;

		return res.json({ 
			propertyType, 
			accommodation, 
			currentOccupancy, 
			newBuild, 
			reports, 
			energyEfficiency, 
			essentialRepairs, 
			localityAndDemand, 
			services, 
			construction, 
			conditionOfProperty,
			generalRemark,
			valuersDeclaration,
			valuationReportDetails,
			rawText: rawText || null
		});
	} catch (err) {
		console.error('Extraction error:', err);
		return res.status(500).json({ error: 'Failed to extract fields' });
	}
}


