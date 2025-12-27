export const CONSTRUCTION_FIELDS = [
    { key: 'Is the property of standard construction:', source: 'checkbox', outputKey: 'isStandardConstruction', yesLeft: 86.51, noLeft: 92.9 },
    { key: 'If non-standard construction specify name of system or type:', source: 'textarea', outputKey: 'nonStandardConstructionType', nextLabel: 'External finish:', textareaMapKey: 'nonStandardConstructionType' },
    { key: 'Main Walls:', source: 'textarea', outputKey: 'mainWalls', nextLabel: 'Main Roof:', textareaMapKey: 'mainWalls' },
    { key: 'Main Roof:', source: 'textarea', outputKey: 'mainRoof', nextLabel: 'Garage:', textareaMapKey: 'mainRoof' },
    { key: 'Garage:', source: 'textarea', outputKey: 'garageConstruction', nextLabel: 'Outbuildings:', textareaMapKey: 'garageConstruction' },
    { key: 'Outbuildings:', source: 'textarea', outputKey: 'outbuildingsConstruction', nextLabel: 'Are there any alterations or extensions?', textareaMapKey: 'outbuildingsConstruction' },
    { key: 'Are there any alterations or extensions?', source: 'checkbox', outputKey: 'isHasAlterationsOrExtensions', yesLeft: 86.51, noLeft: 92.9 },
    { key: 'or Planning Consents?', source: 'checkbox', outputKey: 'isAlterationsRequireConsents', yesLeft: 86.51 , noLeft: 92.9 },
    { key: 'Age of any alterations or extensions?', source: 'valueCols', outputKey: 'alterationsAge', targetLeft: 86.68 },
    
]