function normalize(text) {
	return String(text || '')
		.replace(/\r/g, '')
		.replace(/\t/g, ' ')
		.replace(/\u00A0/g, ' ');
}

function extractBlock(text, startRegex, stopRegex) {
	const startIdx = text.search(startRegex);
	if (startIdx === -1) return null;
	const slice = text.slice(startIdx);
	const stopIdx = slice.search(stopRegex);
	const block = stopIdx !== -1 ? slice.slice(0, stopIdx) : slice;
	return block;
}

export function mapGeneralRemarks(rawText) {
	const text = normalize(rawText);
	const block = extractBlock(
		text,
		/Any\s+other\s+information\s+which\s+in\s+your\s+opinion\s+Gatehouse\s+Bank\s+plc\s+should\s+note\s*:/i,
		/IMPORTANT\s+NOTICE\s+TO\s+THE\s+APPLICANT\s*:/i
	);
	if (!block) return null;

	const lines = block
		.split('\n')
		.map((s) => s.trim())
		.filter(Boolean)
		// drop the start label line
		.filter(
			(l) =>
				!/Any\s+other\s+information\s+which\s+in\s+your\s+opinion\s+Gatehouse\s+Bank\s+plc\s+should\s+note\s*:/i.test(
					l
				)
		);

	// Join everything into a single refined string (remove all line breaks)
	const joined = lines.join(' ').replace(/\s{2,}/g, ' ').trim();
	return joined || null;
}



