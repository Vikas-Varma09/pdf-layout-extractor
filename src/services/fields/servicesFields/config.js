export const REPORTS_FIELDS = [
    { key: 'Mains', source: 'checkbox', outputKey: 'isMainsWater', left: 20.66 },
    { key: 'Private', source: 'checkbox', outputKey: 'isPrivateWater', left: 33.08 },
    { key: 'Unknown', source: 'checkbox', outputKey: 'isUnknownWater', left: 46.2 },
    { key: 'Gas', source: 'checkbox', outputKey: 'isGasSupply', left: 9.07 },
    { key: 'Electricity', source: 'checkbox', outputKey: 'isElectricitySupply', left: 32.25 },

    { key: 'Central Heating', source: 'checkbox', outputKey: 'isCentralHeating', left: 19.99 },

    { key: 'Mains drainage', source: 'checkbox', outputKey: 'isMainDrainage', left: 15.79 },
    { key: 'Septic tank/Cesspit/Treatment Plant', source: 'isSepticTankPlant', outputKey: 'isUnknownWater', left: 46.2 },
    { key: 'Unknown', source: 'checkbox', outputKey: 'isUnknownDrainage', left: 16.01 },
    { key: 'Solar panels', source: 'checkbox', outputKey: 'isSolarPanels', left: 15.72 },
    { key: 'Shared access', source: 'checkbox', outputKey: 'isSharedAccess', left: 32.37 },
    { key: 'Road Adopted', source: 'checkbox', outputKey: 'isRoadAdopted', left: 46.2 },
    { key: 'Any easements or rights of way', source: 'checkbox', outputKey: 'isHasEasementsOrRightsOfWay', yesLeft: 40.33, noLeft: 46.2 },
]