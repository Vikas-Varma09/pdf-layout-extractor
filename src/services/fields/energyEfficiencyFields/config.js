export const ENERGY_EFFICIENCY_FIELDS = [
	{ key: 'EPC Score', source: 'valueCols', outputKey: 'epcScore', targetLeft: 16.44, combineAdjacentDigits: true, adjacentLeftWindow: 1.0, adjacentRightWindow: 3.5, topThreshold: 1.2 },
	{
		key: 'EPC Rating:',
		source: 'singleChoiceRow',
		outputKey: 'epcRating',
		requireMarker: true,
		debug: false,
		topThreshold: 1.2,
		leftThreshold: 2.0,
		options: [
			{ value: 'A', left: 19.65 },
			{ value: 'B', left: 26.54 },
			{ value: 'C', left: 33.93 },
			{ value: 'D', left: 40.82 },
			{ value: 'E', left: 10.08 },
			{ value: 'F', left: 17.13 },
			{ value: 'G', left: 24.19 },
			{ value: 'Exempt', left: 34.94 },
			{ value: 'None', left: 44.85 },
		],
	},
];