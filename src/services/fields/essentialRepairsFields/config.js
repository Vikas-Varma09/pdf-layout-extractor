export const ESSENTIAL_REPAIRS_FIELDS = [
    { key: 'Are there any essential repairs required?', source: 'checkbox', outputKey: 'isEssentialRepairsRequired', yesLeft: 86.85, noLeft: 92.9 },
    { key: 'If Yes, please provide details', source: 'textarea', outputKey: 'essentialRepairsDetails', nextLabel: 'Is re-inspection required?', textareaMapKey: 'essentialRepairs_essentialRepairsDetails' },
    { key: 'Is re-inspection required?', source: 'checkbox', outputKey: 'isReinspectionRequired', yesLeft: 86.85, noLeft: 92.9 },
]