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
	{ key: 'Property built or owned by the Local Authority?', source: 'checkbox', outputKey: 'isBuiltOrOwnedByLocalAuthority' },
	{ key: 'If Yes, what is the approximate % of owner occupation', source: 'valueCols', outputKey: 'ownerOccupationPercentage', targetLeft: 39.98 },
	{ key: 'Converted', source: 'checkbox', outputKey: 'isFlatMaisonetteConverted', left: 16.29 },
	{ key: 'please state year of conversion', source: 'valueCols', outputKey: 'conversionYear', targetLeft: 43.17 },
	{ key: 'Purpose Built', source: 'checkbox', outputKey: 'isPurposeBuilt', left: 16.4 },
	{ key: 'No of units in block', source: 'valueCols', outputKey: 'numberOfUnitsInBlock', targetLeft: 32.09 },
	{ key: 'Above commercial', source: 'checkbox', outputKey: 'isAboveCommercial' },
	{ key: 'Freehold', source: 'checkbox', outputKey: 'isFreehold', left: 46.36 },
	{ key: 'Leasehold', source: 'checkbox', outputKey: 'isLeasehold', left: 32.42 },
	{ key: 'Flying freehold', source: 'checkbox', outputKey: 'isFlyingFreehold' },
	{ key: 'If Yes, what %', source: 'valueCols', outputKey: 'flyingFreeholdPercentage', targetLeft: 43.51 },
	{ key: 'Maintenance Charge', source: 'valueCols', outputKey: 'maintenanceCharge', targetLeft: 12.17 },
	{ key: 'Ground Rent', source: 'valueCols', outputKey: 'groundRent', targetLeft: 26.71 },
	{ key: 'Road Charges', source: 'valueCols', outputKey: 'roadCharges', targetLeft: 40.32 },

	{ key: 'Remaining term of Lease (if unknown as per RICS red book)', source: 'valueCols', outputKey: 'remainingLeaseTermYears', targetLeft: 39.71 },
	{ key: 'Is any part of the property in commercial use?', source: 'checkbox', outputKey: 'isPartCommercialUse' },
	{ key: 'If Yes please state % in commercial use', source: 'valueCols', outputKey: 'commercialUsePercentage', targetLeft: 39.65 },
	{ key: 'under a shared ownership scheme?', source: 'checkbox', outputKey: 'isPurchasedUnderSharedOwnership' },
	{ key: 'Year property built', source: 'valueCols', outputKey: 'yearPropertyBuilt', targetLeft: 19.65 },
	// Textarea fields (bounded between labels)
	{ key: 'If Yes, please state if this would affect the residential nature of the property e.g. Noise, Odour', source: 'textarea', outputKey: 'residentialNatureImpact', nextLabel: 'Tenure:' },
];


