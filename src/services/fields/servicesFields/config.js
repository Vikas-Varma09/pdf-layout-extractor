export const REPORTS_FIELDS = [
    { key: 'Mains', source: 'checkbox', outputKey: 'isMainsWater', left: 20.66 },
    { key: 'Private', source: 'checkbox', outputKey: 'isPrivateWater', left: 33.08 },
    { key: 'Unknown', source: 'checkbox', outputKey: 'isUnknownWater', left: 46.2 },
    { key: 'Gas', source: 'checkbox', outputKey: 'isGasSupply', left: 9.07 },
    { key: 'Electricity', source: 'checkbox', outputKey: 'isElectricitySupply', left: 32.25 },

    { key: 'Central Heating', source: 'checkbox', outputKey: 'isCentralHeating', left: 19.99 },
    { key: 'If Yes, please state the type of central heating', source: 'textarea', outputKey: 'centralHeatingType', nextLabel: 'Mains drainage' },
    { key: 'Mains drainage', source: 'checkbox', outputKey: 'isMainDrainage', left: 15.79 },
    { key: 'Septic tank/Cesspit/Treatment Plant', source: 'checkbox', outputKey: 'isSepticTankPlant', left: 46.2 },
    { key: 'Unknown', source: 'checkbox', outputKey: 'isUnknownDrainage', left: 16.01 },
    { key: 'Solar panels', source: 'checkbox', outputKey: 'isSolarPanels', left: 15.72 },
    { key: 'Shared access', source: 'checkbox', outputKey: 'isSharedAccess', left: 32.37 },
    { key: 'Road Adopted', source: 'checkbox', outputKey: 'isRoadAdopted', left: 46.2 },
    { key: 'Any easements or rights of way', source: 'checkbox', outputKey: 'isHasEasementsOrRightsOfWay', yesLeft: 40.33, noLeft: 46.2 },
    { key: 'If Yes, please provide details', source: 'textarea', outputKey: 'easementsOrRightsDetails', nextLabel: 'If house split in to flats, are services separate for each unit?' },
    // NOTE: disable word fallback here because the template prints "Yes / No / N/A" headers on the row,
    // which can be incorrectly interpreted as an answer when all boxes are empty.
    { key: 'If house split in to flats, are services separate for each unit?', source: 'checkbox', outputKey: 'servicesSeparateForFlats', yesLeft: 30.74, noLeft: 39.98, noNA : 46.36, topThreshold: 2.0, leftWindow: 12.0, allowWordFallback: false, allowNaWordFallback: false, debug: false },
    { key: 'If No, please provide details', source: 'textarea', outputKey: 'servicesSeparateDetails', nextLabel: 'ENERGY EFFICIENCY' },
]