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
		const currentOccupancy = buildCurrentOccupancyGroup({ spans, checkbox, valueCols });
		const newBuild = buildNewBuildGroup({ spans, checkbox, valueCols });
		const reports = buildReportsGroup({ spans, checkbox, valueCols });
		const energyEfficiency = buildEnergyEfficiencyGroup({ spans, valueCols });
		const essentialRepairs = buildEssentialRepairsGroup({ spans, checkbox, valueCols });
		const localityAndDemand = buildLocalityAndDemandGroup({ spans, checkbox, valueCols });
		const services = buildServicesGroup({ spans, checkbox, valueCols });
		const construction = buildConstructionGroup({ spans, checkbox, valueCols });
		const generalRemark = buildGeneralRemarkGroup({ spans });
		return res.json({ propertyType, accommodation, currentOccupancy, newBuild, reports, energyEfficiency, essentialRepairs, localityAndDemand, services, construction, generalRemark });
	} catch (err) {
		console.error('Extraction error:', err);
		return res.status(500).json({ error: 'Failed to extract fields' });
	}
}


