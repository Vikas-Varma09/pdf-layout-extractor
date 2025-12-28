export const VALUATION_FOR_FINANCE_PURPOSES_HPP_FIELDS = [
    {
        key: 'Is the property suitable security for finance purposes?',
        // HPP labels often wrap; use a shorter includes for row anchoring
        rowLabelIncludes: 'suitable security for finance',
        source: 'checkbox',
        outputKey: 'isSuitableForFinance',
        // HPP template uses the same Yes/No columns as other mid-page sections
        yesLeft: 40.23,
        noLeft: 46.2,
        topThreshold: 1.2,
        leftWindow: 6.0,
        rowFallbackMaxLeft: 25.0,
        allowWordFallback: true,
        debug: false,
    },
    { key: 'If No, please provide details', source: 'textarea', outputKey: 'financeSuitabilityDetails', nextLabel: 'Market Value in present condition', textareaMapKey: 'valuationHPP_financeSuitabilityDetails' },
    { key: 'Market Value in present condition', labelIncludes: 'Market Value in present', source: 'valueCols', outputKey: 'marketValuePresentCondition', targetLeft: 20.7, leftThreshold: 3.0, rowRightFallback: true, rowRightWithin: 90.0, debug: false },
    { key: 'Market Value after essential repairs/completion', labelIncludes: 'after essential repairs', source: 'valueCols', outputKey: 'marketValueAfterRepairs', targetLeft: 20.7, leftThreshold: 3.0, rowRightFallback: true, rowRightWithin: 90.0, debug: false },
    { key: 'Borrowers Estimated Value', labelIncludes: 'Borrowers Estimated', source: 'valueCols', outputKey: 'purchasePriceOrBorrowerEstimate', targetLeft: 20.7, leftThreshold: 3.0, rowRightFallback: true, rowRightWithin: 90.0, debug: false },
    { key: 'Building Insurance Reinstatement Cost', labelIncludes: 'Building Insurance', source: 'valueCols', outputKey: 'buildingInsuranceReinstatementCost', targetLeft: 20.7, leftThreshold: 3.0, rowRightFallback: true, rowRightWithin: 90.0, debug: false },
    { key: 'premium?', rowLabelIncludes: 'premium', source: 'checkbox', outputKey: 'isInsurancePremiumLoadingRisk', yesLeft: 40.23, noLeft: 46.2, topThreshold: 1.2, leftWindow: 6.0, rowFallbackMaxLeft: 25.0, allowWordFallback: true, debug: false },
    { key: 'If No, please provide details', source: 'textarea', outputKey: 'insurancePremiumLoadingDetails', textareaMapKey: 'valuationHPP_insurancePremiumLoadingDetails' },
]