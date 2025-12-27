function normalize(text) {
	// Preserve multiple spaces for column-based extraction
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/\u00A0/g, " ");
}

function windowAfter(text, labelRegex, span = 240) {
	const idx = text.search(labelRegex);
	if (idx === -1) return null;
	const after = text.slice(idx);
	const lineEnd = after.indexOf("\n");
	const end = lineEnd !== -1 ? Math.min(lineEnd, span) : Math.min(after.length, span);
	return after.slice(0, end);
}

function pickFirstIntOnLine(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 200);
	if (!seg) return null;
	const m = seg.match(/-?\d+/);
	return m ? parseInt(m[0], 10) : null;
}

function pickAfterLabel(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 300);
	if (!seg) return null;
	const line = seg.split("\n")[0] || "";
	// remove the label portion
	const m = labelRegex.exec(line);
	if (!m) return null;
	let tail = line.slice(m.index + m[0].length);
	// Keep only the left column value (before large whitespace gap)
	const parts = tail.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
	return parts.length ? parts[0] : tail.trim();
}

function pickDigits(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 200);
	if (!seg) return null;
	const m = seg.match(/(\+?\d[\d\s()-]+)/);
	if (!m) return null;
	const digits = m[1].replace(/[^\d]/g, "");
	return digits ? parseInt(digits, 10) : null;
}

function pickEmail(text, labelRegex) {
	const seg = windowAfter(text, labelRegex, 200);
	if (!seg) return null;
	const m = seg.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
	return m ? m[0] : null;
}

function extractAddress(text) {
	const idx = text.search(/Address\s+of\s+Valuer/i);
	if (idx === -1) return { address: null, postcode: null };
	const slice = text.slice(idx);
	const lines = slice.split("\n").map(s => s.trim());
	let collected = [];
	let postcode = null;
	for (let i = 1; i < Math.min(lines.length, 6); i++) {
		const ln = lines[i];
		if (!ln) continue;
		// capture postcode and stop
		const pm = ln.match(/\bPostcode\b\s*([A-Z0-9\s]+)$/i);
		if (pm) {
			postcode = pm[1].trim();
			break;
		}
		// If this is a dual-column line, capture the right column tail
		if (/^Name\s+of\s+Valuer\b/i.test(ln) || /^For\s+and\s+on\s+behalf\s+of\b/i.test(ln)) {
			const parts = ln.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
			if (parts.length > 1) {
				collected.push(parts[parts.length - 1]);
			}
			continue;
		}
		// skip other label lines
		if (/^\s*(Telephone|Fax|E-?mail|RICS\s+Number|Report\s+Date)\b/i.test(ln)) continue;
		// otherwise treat as address continuation
		collected.push(ln);
	}
	const address = collected.length ? collected.join(" ") : null;
	return { address, postcode };
}

function extractQualifications(text) {
	// Search near the qualifications line
	const seg = windowAfter(text, /(Professional\s+)?Qualifications\s+of\s+the\s+Valuer/i, 220);
	if (!seg) return { mrics: null, frics: null, assocRics: null };
	const mrics = /\bMRICS\b\s+X\b/i.test(seg) ? true : false;
	const frics = /\bFRICS\b\s+X\b/i.test(seg) ? true : false;
	const assoc = /\bAssocRICS\b\s+X\b/i.test(seg) ? true : false;
	return { mrics, frics, assocRics: assoc };
}

function pickReportDate(text) {
	const seg = windowAfter(text, /Report\s+Date/i, 80);
	if (!seg) return null;
	const m = seg.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
	return m ? m[1] : null;
}

function mapValuersDeclaration(rawText) {
	const text = normalize(rawText);

	const valuerSignature = pickAfterLabel(text, /Signature\s+of\s+Valuer\s*\/\s*Electronic\s+Signature\s*/i);
	const valuerName = pickAfterLabel(text, /Name\s+of\s+Valuer\s+/i);
	const onBehalfOf = pickAfterLabel(text, /For\s+and\s+on\s+behalf\s+of\s+/i);
	const telephone = pickDigits(text, /Telephone\s*\(inc\.\s*STD\s*code\)\s*/i);
	const fax = pickDigits(text, /Fax\s*\(inc\.\s*STD\s*code\)\s*/i);
	const email = pickEmail(text, /E-?mail\s*/i);
	const valuerQualifications = extractQualifications(text);
	const ricsNumber = pickFirstIntOnLine(text, /\bRICS\s+Number\b/i);
	const { address: valuerAddress, postcode: valuerPostcode } = extractAddress(text);
	const reportDate = pickReportDate(text);

	return {
		valuerSignature,
		valuerName,
		onBehalfOf,
		telephone,
		fax,
		email,
		valuerQualifications,
		ricsNumber,
		valuerAddress,
		valuerPostcode,
		reportDate
	};
}

export { mapValuersDeclaration };


