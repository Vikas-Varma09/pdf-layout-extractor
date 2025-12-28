export const VALUATION_FOR_FINANCE_PURPOSES_BTL_FIELDS = [
    { key: 'Is the property suitable security for finance purposes?', source: 'checkbox', outputKey: 'isSuitableForFinance', yesLeft: 86.51, noLeft: 92.9 },
    { key: 'If No, please provide details', source: 'textarea', outputKey: 'financeSuitabilityDetails', nextLabel: 'Market Value in present condition', textareaMapKey: 'valuationBTL_financeSuitabilityDetails' },
    { key: 'Market Value in present condition', source: 'valueCols', outputKey: 'marketValuePresentCondition', targetLeft: 82.65 },
    { key: 'Market Value after essential repairs/completion', source: 'valueCols', outputKey: 'marketValueAfterRepairs', targetLeft: 82.65 },
    { key: 'Borrowers Estimated Value', source: 'valueCols', outputKey: 'purchasePriceOrBorrowerEstimate', targetLeft: 82.65 },
    { key: 'Building Insurance Reinstatement Cost', source: 'valueCols', outputKey: 'buildingInsuranceReinstatementCost', targetLeft: 82.65 },
    { key: 'premium?', source: 'checkbox', outputKey: 'isInsurancePremiumLoadingRisk', yesLeft: 86.51, noLeft: 92.9 },
    { key: 'If No, please provide details', source: 'textarea', outputKey: 'insurancePremiumLoadingDetails', textareaMapKey: 'valuationBTL_insurancePremiumLoadingDetails' },
]