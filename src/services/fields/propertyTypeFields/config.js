// Central list of fields that belong to the propertyType group.
// Each item specifies which source provides its value:
// - 'checkbox'  -> from extractCheckboxFields()
// - 'valueCols' -> from extractValueColumns()
// - 'mapped'    -> from mapFieldsToValues()
//
// Keys must match the exact label text used elsewhere.
export const PROPERTY_TYPE_FIELDS = [
	{ key: 'Detached House', source: 'checkbox', outputKey: 'isDetachedHouse', left: 16.29 },
	{ key: 'Semi-Detached House', source: 'checkbox', outputKey: 'isSemiDetachedHouse', left: 32.59 },
	{ key: 'Terraced House', source: 'checkbox', outputKey: 'isTerracedHouse', left: 46.36 },
	{ key: 'Bungalow', source: 'checkbox', outputKey: 'isBungalow', left: 16.29 },
	{ key: 'Flat', source: 'checkbox', outputKey: 'isFlat', left: 32.76 },
	{ key: 'Maisonette', source: 'checkbox', outputKey: 'isMaisonette', left: 46.2 },

	{ key: 'If flat / maisonette on what floor?', source: 'valueCols', outputKey: 'flatMaisonetteFloor', targetLeft: 26.37 },
	{ key: 'No. of floors in block', source: 'valueCols', outputKey: 'numberOfFloorsInBlock', targetLeft: 45.02 },
	{ key: 'Property built or owned by the Local Authority?', source: 'checkbox', outputKey: 'isBuiltOrOwnedByLocalAuthority', yesLeft: 40.33, noLeft: 46.36 },
	{ key: 'If Yes, what is the approximate % of owner occupation', source: 'valueCols', outputKey: 'ownerOccupationPercentage', targetLeft: 39.98 },
	{ key: 'Converted', source: 'checkbox', outputKey: 'isFlatMaisonetteConverted', left: 16.29 },
	{ key: 'please state year of conversion', source: 'valueCols', outputKey: 'conversionYear', targetLeft: 43.17 },
	{ key: 'Purpose Built', source: 'checkbox', outputKey: 'isPurposeBuilt', left: 16.4 },
	{ key: 'No of units in block', source: 'valueCols', outputKey: 'numberOfUnitsInBlock', targetLeft: 32.09 },
	{ key: 'Above commercial', source: 'checkbox', outputKey: 'isAboveCommercial', yesLeft: 40.33, noLeft: 46.36 },
	// Textarea fields (bounded between labels)
	{ key: 'If Yes, please state if this would affect the residential nature of the property e.g. Noise, Odour', source: 'textarea', outputKey: 'residentialNatureImpact', nextLabel: 'Tenure:' },
	
	{ key: 'Freehold', source: 'checkbox', outputKey: 'isFreehold', left: 19.75 },
	{ key: 'Leasehold', source: 'checkbox', outputKey: 'isLeasehold', left: 32.42 },
	{ key: 'Flying freehold', source: 'checkbox', outputKey: 'isFlyingFreehold', yesLeft: 19.6, noLeft: 26.88 },
	{ key: 'If Yes, what %', source: 'valueCols', outputKey: 'flyingFreeholdPercentage', targetLeft: 43.51 },
	{ key: 'Maintenance Charge', source: 'mapped', outputKey: 'maintenanceCharge' },
	{ key: 'Ground Rent', source: 'mapped', outputKey: 'groundRent' },
	{ key: 'Road Charges', source: 'mapped', outputKey: 'roadCharges' },

	{ key: 'Remaining term of Lease (if unknown as per RICS red book)', source: 'valueCols', outputKey: 'remainingLeaseTermYears', targetLeft: 39.71 },
	{ key: 'Is any part of the property in commercial use?', source: 'checkbox', outputKey: 'isPartCommercialUse', yesLeft: 40.15, noLeft: 46.36 },
	{ key: 'If Yes please state % in commercial use', source: 'valueCols', outputKey: 'commercialUsePercentage', targetLeft: 39.65 },
	{ key: 'under a shared ownership scheme?', source: 'checkbox', outputKey: 'isPurchasedUnderSharedOwnership', yesLeft: 40.15, noLeft: 46.36 },
	{ key: 'Year property built', source: 'valueCols', outputKey: 'yearPropertyBuilt', targetLeft: 19.65 },

];

// Helper functions for extracting values from rawText
function windowAfter(text, labelRegex, span = 240) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const after = text.slice(idx);
	// Look for number within span characters, but allow across newlines
	const end = Math.min(after.length, span);
	return after.slice(0, end);
}

function numberAfterOrNull(text, labelRegex) {
	// First try to find the label pattern
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	
	// Get text after the match, allowing for multi-line
	const after = text.slice(idx);
	// Look for a number within 120 characters (allowing newlines)
	const window = after.slice(0, Math.min(after.length, 120));
	
	// Try to find a number - could be with currency symbols, commas, decimals
	// Match patterns like: £100, 100, £1,000, 1,000.50, etc.
	// Also handle cases where label and number are on different lines
	const m = window.match(/[£$]?\s*([\d,]+(?:\.\d+)?)/);
	if (!m) return null;
	// Remove commas and parse
	const numStr = m[1].replace(/,/g, '');
	const n = parseFloat(numStr);
	return Number.isFinite(n) ? n : null;
}

/**
 * Extract maintenance charge, road charges, and ground rent from rawText
 * @param {string} rawText - Raw text from OCR
 * @returns {Object} Object with maintenanceCharge, roadCharges, and groundRent
 */
export function extractChargesFromRawText(rawText) {
	if (!rawText) {
		return {
			maintenanceCharge: null,
			roadCharges: null,
			groundRent: null
		};
	}

	const text = String(rawText);
	
	// Handle the case where labels and values are on separate lines
	// Pattern: "Maintenance Road Ground\nCharge 2582 Charges 1711 Rent 1717"
	
	// Maintenance Charge - handle split across lines
	let maintenanceCharge = null;
	// Try "Maintenance Charge" on same line
	maintenanceCharge = numberAfterOrNull(text, /\bMaintenance\s+Charge\b/i);
	// Try "Maintenance" on one line, "Charge" on next line
	if (!maintenanceCharge) {
		const maintenanceIdx = text.search(/\bMaintenance\b/i);
		if (maintenanceIdx !== -1) {
			const afterMaintenance = text.slice(maintenanceIdx);
			// Look for "Charge" followed by number within next 50 chars (allowing newlines)
			const chargeMatch = afterMaintenance.match(/Charge\s+(\d+)/i);
			if (chargeMatch) {
				maintenanceCharge = parseInt(chargeMatch[1], 10);
			}
		}
	}
	
	// Road Charges - handle split across lines
	let roadCharges = null;
	// Try "Road Charges" on same line
	roadCharges = numberAfterOrNull(text, /\bRoad\s+Charges\b/i);
	// Try "Road" on one line, "Charges" on next line
	if (!roadCharges) {
		const roadIdx = text.search(/\bRoad\b/i);
		if (roadIdx !== -1) {
			const afterRoad = text.slice(roadIdx);
			// Look for "Charges" followed by number within next 50 chars (allowing newlines)
			const chargesMatch = afterRoad.match(/Charges\s+(\d+)/i);
			if (chargesMatch) {
				roadCharges = parseInt(chargesMatch[1], 10);
			}
		}
	}
	
	// Ground Rent - handle split across lines
	let groundRent = null;
	// Try "Ground Rent" on same line
	groundRent = numberAfterOrNull(text, /\bGround\s+Rent\b/i);
	// Try "Ground" on one line, "Rent" on next line
	if (!groundRent) {
		const groundIdx = text.search(/\bGround\b/i);
		if (groundIdx !== -1) {
			const afterGround = text.slice(groundIdx);
			// Look for "Rent" followed by number within next 50 chars (allowing newlines)
			const rentMatch = afterGround.match(/Rent\s+(\d+)/i);
			if (rentMatch) {
				groundRent = parseInt(rentMatch[1], 10);
			}
		}
	}

	return {
		maintenanceCharge,
		roadCharges,
		groundRent
	};
}
