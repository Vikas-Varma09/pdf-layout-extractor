export const RENTAL_INFORMATION_FIELDS = [
    { key: 'in the locality?', source: 'checkbox', outputKey: 'isRentalDemandInLocality', yesLeft: 40.23, noLeft: 46.2 },
    { key: 'let on a 6/12 month AST basis, with the', source: 'valueCols', outputKey: 'monthlyMarketRentPresentCondition', targetLeft: 39.79 },
    { key: 'property in an improved condition and', labelIncludes: 'after any essential repairs', source: 'valueCols', outputKey: 'monthlyMarketRentImprovedCondition', targetLeft: 39.79},
    { key: 'on the ongoing demand for residential letting', source: 'checkbox', outputKey: 'isOtherLettingDemandFactors', yesLeft: 40.23, noLeft: 46.2},
    { key: 'on an investor to investor basis?', source: 'checkbox', outputKey: 'investorOnlyDemand', yesLeft: 40.23, noLeft: 46.2 },
]