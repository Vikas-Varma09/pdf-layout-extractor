export const CURRENT_OCCUPANCY_FIELDS = [
    { key: 'Has the property ever been occupied?', source: 'checkbox', outputKey: 'isEverOccupied', yesLeft: 86.68, noLeft: 92.9 },
{ key: 'How many adults appear to live in the property?', source: 'valueCols', outputKey: 'numberOfAdultsInProperty', targetLeft: 90.38 },
{ key: 'Freehold Block?', source: 'checkbox', outputKey: 'isHmoOrMultiUnitFreeholdBlock', yesLeft: 86.68, noLeft: 92.9  },
{ key: 'If Yes, please provide details', source: 'textarea', outputKey: 'isCurrentlyTenanted', nextLabel: 'Does the property appear to' },
{ key: 'be tenanted at present?', source: 'checkbox', outputKey: 'hmoOrMultiUnitDetails', yesLeft: 86.68, noLeft: 92.9  },

];