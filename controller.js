import { extractSpansFromPdfBuffer } from './pdfService.js';
import { extractCheckboxFields } from './src/services/checkboxFields/index.js';
import { extractValueColumns } from './src/services/valueColumns/index.js';
import { buildPropertyTypeGroup } from './src/services/fields/propertyTypeFields/index.js';
import { buildAccommodationGroup } from './src/services/fields/accommodationFields/index.js';
import { buildCurrentOccupancyGroup } from './src/services/fields/currentOccupancyFields/index.js';
import { buildNewBuildGroup } from './src/services/fields/newBuild/index.js';
import { buildReportsGroup } from './src/services/fields/reportsFields/index.js';
import { buildEnergyEfficiencyGroup } from './src/services/fields/energyEfficiencyFields/index.js';
import { buildEssentialRepairsGroup } from './src/services/fields/essentialRepairsFields/index.js';
import { buildLocalityAndDemandGroup } from './src/services/fields/localityAndDemandFields/index.js';
import { buildServicesGroup } from './src/services/fields/servicesFields/index.js';
import { buildConstructionGroup } from './src/services/fields/constructionFields/index.js';
import { buildConditionOfPropertyGroup } from './src/services/fields/conditionOfPropertyFields/index.js';
import { buildRentalInformationGroup } from './src/services/fields/rentalInformationFields/index.js';
import { buildValuationForFinancePurposesBTLGroup } from './src/services/fields/valuationForFinancePurposesBTLFields/index.js';
import { buildValuationForFinancePurposesHPPGroup } from './src/services/fields/valuationForFinancePurposesHPPFields/index.js';
import { extractRawTextFromOCR } from './src/services/ocrService.js';
import { mapValuersDeclaration } from './src/services/fields/valuersDeclarationFields/mapper.js';
import { parseHeader } from './src/services/fields/valuationReportDetailsFields/mapper.js';
import { mapGeneralRemarks } from './src/services/fields/generalRemark/mapper.js';

/**
 * POST /api/extract-fields
 * Accepts: multipart/form-data with "file" (PDF)
 */
export async function extractFieldsController(req, res) {
	try {
		if (!req.file || !req.file.buffer) {
			return res.status(400).json({ error: 'Missing PDF file in "file" field.' });
		}

		// Helper: read form field values robustly (handles accidental spaces in keys like "applicationType ")
		const getBodyField = (body, wantedKey) => {
			if (!body || typeof body !== 'object') return null;
			// direct hit first
			if (body[wantedKey] != null) return body[wantedKey];
			const wanted = String(wantedKey).trim().toLowerCase();
			for (const [k, v] of Object.entries(body)) {
				if (String(k).trim().toLowerCase() === wanted) return v;
			}
			return null;
		};
		const normalizeApplicationType = (val) => {
			if (val == null) return null;
			let s = String(val).trim();
			// strip surrounding quotes if present
			s = s.replace(/^["']+/, '').replace(/["']+$/, '').trim();
			if (!s) return null;
			return s.toUpperCase();
		};

		// Create a copy of the buffer for OCR (in case the original gets consumed/detached)
		const pdfBuffer = Buffer.isBuffer(req.file.buffer) 
			? Buffer.from(req.file.buffer) 
			: Buffer.from(req.file.buffer);

		// Extract structured fields
		const spans = await extractSpansFromPdfBuffer(req.file.buffer);
		const applicationType = normalizeApplicationType(getBodyField(req.body, 'applicationType'));
		const checkbox = extractCheckboxFields(spans, { applicationType });
		const valueCols = extractValueColumns(spans, { applicationType });

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
		const rentalInformation = applicationType === 'BTL' ? buildRentalInformationGroup({ spans, checkbox, valueCols }) : null;
		const valuationForFinancePurposesBTL = applicationType === 'BTL' ? buildValuationForFinancePurposesBTLGroup({ spans, checkbox, valueCols }) : null;
		const valuationForFinancePurposesHPP = applicationType === 'HPP' ? buildValuationForFinancePurposesHPPGroup({ spans, checkbox, valueCols }) : null;
		const generalRemark = { generalRemark: rawText ? mapGeneralRemarks(rawText) : null };

		// Extract valuers declaration fields from rawText
		const valuersDeclaration = rawText ? mapValuersDeclaration(rawText) : null;

		// Extract valuation report details from rawText
		const valuationReportDetails = rawText ? parseHeader(rawText, null) : null;

		return res.json({ 
			applicationType,
			valuationReportDetails,
			propertyType,
			newBuild, 
			accommodation, 
			currentOccupancy,  
			construction, 
			localityAndDemand, 
			services, 
			energyEfficiency, 
			conditionOfProperty,
			reports, 
			essentialRepairs, 
			rentalInformation,
			valuationForFinancePurposesBTL,
			valuationForFinancePurposesHPP,
			generalRemark,
			valuersDeclaration,
			rawText: rawText || null
		});
	} catch (err) {
		console.error('Extraction error:', err);
		return res.status(500).json({ error: 'Failed to extract fields' });
	}
}


