export const LOCALITY_AND_DEMAND_FIELDS = [
    { key: 'Urban', source: 'checkbox', outputKey: 'isUrban', left: 20.49 },
    { key: 'Suburban', source: 'checkbox', outputKey: 'isSuburban', left: 33.26 },
    { key: 'Rural', source: 'checkbox', outputKey: 'isRural', left: 46.44 },
    { key: 'Good', source: 'checkbox', outputKey: 'isGoodMarketAppeal', left: 20.49 },
    { key: 'Average', source: 'checkbox', outputKey: 'isAverageMarketAppeal', left: 33.26 },
    { key: 'Poor', source: 'checkbox', outputKey: 'isPoorMarketAppeal', left: 46.44 },
    { key: 'Residential', source: 'checkbox', outputKey: 'isOwnerResidential', left: 13.44 },
    // Sometimes the "Let" marker is slightly offset; allow a safe row fallback so the X is still picked
    { key: 'Let', source: 'checkbox', outputKey: 'isResidentialLet', left: 32.93, leftThreshold: 3.5, topThreshold: 1.2, allowRowFallback: true, fallbackMaxLeft: 4.5 },
    { key: 'Commercial', source: 'checkbox', outputKey: 'isCommercial', left: 46.63, leftThreshold: 2.5, topThreshold: 1.0 },
//Are property prices in the area: 
    { key: 'Rising', source: 'checkbox', outputKey: 'isPricesRising', left: 20.49, checkboxMapKey: 'prices_Rising', belowAnchorIncludes: 'Are property prices in the area', leftThreshold: 3.5, topThreshold: 1.5, allowRowFallback: false },
    { key: 'Static', source: 'checkbox', outputKey: 'isPricesStatic', left: 32.93, checkboxMapKey: 'prices_Static', belowAnchorIncludes: 'Are property prices in the area', leftThreshold: 3.5, topThreshold: 1.5, allowRowFallback: false },
    { key: 'Falling', source: 'checkbox', outputKey: 'isPricesFalling', left: 46.63, checkboxMapKey: 'prices_Falling', belowAnchorIncludes: 'Are property prices in the area', leftThreshold: 3.5, topThreshold: 1.5, allowRowFallback: false },
//Is demand for this type of property:
    { key: 'Rising', source: 'checkbox', outputKey: 'isDemandRising', left: 20.49, checkboxMapKey: 'demand_Rising', belowAnchorIncludes: 'Is demand for this type of property', leftThreshold: 2.5, topThreshold: 1.2, allowRowFallback: true, fallbackMaxLeft: 3.0 },
    { key: 'Static', source: 'checkbox', outputKey: 'isDemandStatic', left: 32.93, checkboxMapKey: 'demand_Static', belowAnchorIncludes: 'Is demand for this type of property', leftThreshold: 2.5, topThreshold: 1.2, allowRowFallback: true, fallbackMaxLeft: 3.0 },
    { key: 'Falling', source: 'checkbox', outputKey: 'isDemandFalling', left: 46.37, checkboxMapKey: 'demand_Falling', belowAnchorIncludes: 'Is demand for this type of property', leftThreshold: 2.5, topThreshold: 1.2, allowRowFallback: true, fallbackMaxLeft: 3.0 },

    { key: 'compulsory purchase or clearance?', source: 'checkbox', outputKey: 'isAffectedByCompulsoryPurchase', yesLeft: 40.15, noLeft: 46.2  },
    { key: 'If Yes, please provide details', source: 'textarea', outputKey: 'compulsoryPurchaseDetails', nextLabel: 'Are there any vacant or boarded up', textareaMapKey: 'locality_compulsoryPurchaseDetails' },
    { key: 'properties in close proximity?', source: 'checkbox', outputKey: 'isVacantOrBoardedPropertiesNearby', yesLeft: 40.15, noLeft: 46.2  },
    { key: 'If Yes, please provide details', source: 'textarea', outputKey: 'vacantOrBoardedDetails', nextLabel: 'Is there a possibility of occupancy restriction?', textareaMapKey: 'locality_vacantOrBoardedDetails' },
    { key: 'Is there a possibility of occupancy restriction?', source: 'checkbox', outputKey: 'isOccupancyRestrictionPossible', yesLeft: 40.15, noLeft: 46.2  },
    { key: 'If Yes, please provide details', source: 'textarea', outputKey: 'occupancyRestrictionDetails', nextLabel: 'Is the property close to any high voltage', textareaMapKey: 'locality_occupancyRestrictionDetails' },
    { key: 'electrical supply equipment?', source: 'checkbox', outputKey: 'isCloseToHighVoltageEquipment', yesLeft: 40.15, noLeft: 46.2  },
    { key: 'If Yes, please provide details', source: 'textarea', outputKey: 'highVoltageEquipmentDetails', nextLabel: 'SERVICES', textareaMapKey: 'locality_highVoltageEquipmentDetails' },
]