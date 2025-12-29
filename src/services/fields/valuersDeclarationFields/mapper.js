function normalize(text) {
	// Preserve multiple spaces for column-based extraction
	return String(text || "").replace(/\r/g, "").replace(/\t/g, " ").replace(/\u00A0/g, " ");
}

function cleanValue(v) {
	if (v == null) return null;
	const s = String(v).replace(/\s+/g, " ").trim();
	return s.length ? s : null;
}

function extractValuersDeclarationSection(text) {
	const startIdx = text.search(/\bVALUERS\s+DECLARATION\b/i);
	if (startIdx === -1) return null;
	const after = text.slice(startIdx);
	// Stop at common section terminators
	const endMatchers = [
		/\*\s*See\s+Continuation\s+Page\s*\*/i,
		/\*\s*End\s+of\s+Report\s*\*/i,
		/\bBUY\s+TO\s+LET\s+MORTGAGE\s+VALUATION\s+REPORT\s*-\s*Continuation\s+Page\b/i,
		/\bLender's\s+Copy\b/i,
	];
	let endIdx = after.length;
	for (const re of endMatchers) {
		const m = after.search(re);
		if (m !== -1) endIdx = Math.min(endIdx, m);
	}
	return after.slice(0, endIdx);
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
	return cleanValue(parts.length ? parts[0] : tail);
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

function parseCompanyAndTail(tail) {
	const s = cleanValue(tail);
	if (!s) return { head: null, tail: null };
	const tokens = s.split(/\s+/);
	const suffixes = new Set(['LTD', 'LIMITED', 'LLP', 'PLC', 'INC', 'GMBH']);
	let cutIdx = -1;
	for (let i = 0; i < tokens.length; i++) {
		const tk = String(tokens[i]).replace(/[.,]/g, '').toUpperCase();
		if (suffixes.has(tk)) {
			cutIdx = i;
			break;
		}
	}
	if (cutIdx === -1) return { head: s, tail: null };
	const head = tokens.slice(0, cutIdx + 1).join(' ');
	const rest = tokens.slice(cutIdx + 1).join(' ');
	return { head: cleanValue(head), tail: cleanValue(rest) };
}

function parseNameAndTail(tail) {
	const s = cleanValue(tail);
	if (!s) return { name: null, tail: null };
	// Heuristic: "E Bedford Valuation Management Centre, Cumbria Hous"
	// -> name: first two tokens when the first token is an initial (1-2 chars)
	const tokens = s.split(/\s+/);
	if (tokens.length >= 2 && /^[A-Za-z]{1,2}$/.test(tokens[0])) {
		const name = tokens.slice(0, 2).join(' ');
		const rest = tokens.slice(2).join(' ');
		return { name: cleanValue(name), tail: cleanValue(rest) };
	}
	// Fallback: take first 2 tokens as name
	const name = tokens.slice(0, Math.min(2, tokens.length)).join(' ');
	const rest = tokens.slice(Math.min(2, tokens.length)).join(' ');
	return { name: cleanValue(name), tail: cleanValue(rest) };
}

function extractAddress(sectionText) {
	if (!sectionText) return { address: null, postcode: null, name: null, org: null, signature: null };
	const lines = sectionText.split("\n").map(s => s.trim()).filter(Boolean);

	// Signature: capture until "Address of Valuer" if it appears on the same line
	let signature = null;
	const sigIdx = lines.findIndex(ln => /Signature\s+of\s+Valuer/i.test(ln));
	if (sigIdx !== -1) {
		const sigLine = lines[sigIdx];
		const m = sigLine.match(/Signature\s+of\s+Valuer\s*\/\s*Electronic\s+Signature\s*(.*)$/i);
		if (m) {
			let tail = m[1] || '';
			tail = tail.replace(/\bAddress\s+of\s+Valuer\b.*$/i, '');
			signature = cleanValue(tail);
		}
		// Some PDFs place the signature value on the line ABOVE the signature label:
		// e.g. "450288 = 6347" then "Signature of Valuer / Electronic Signature Address of Valuer"
		if (!signature && sigIdx > 0) {
			const prev = cleanValue(lines[sigIdx - 1]);
			// Accept common signature formats: "digits = digits" or alphanum token with digits
			if (prev && !/Address\s+of\s+Valuer/i.test(prev) && /(\d+\s*=\s*\d+)/.test(prev)) {
				signature = cleanValue(prev);
			}
		}
	}

	// Name: capture line, then split out address tail
	let name = null;
	let addrParts = [];
	const nameLine = lines.find(ln => /^Name\s+of\s+Valuer\b/i.test(ln));
	if (nameLine) {
		const m = nameLine.match(/^Name\s+of\s+Valuer\s+(.*)$/i);
		const { name: nm, tail: nmTail } = parseNameAndTail(m ? m[1] : null);
		name = nm;
		if (nmTail) addrParts.push(nmTail);
	}

	// For and on behalf of: split company name from trailing address continuation
	let org = null;
	const behalfLine = lines.find(ln => /^For\s+and\s+on\s+behalf\s+of\b/i.test(ln));
	if (behalfLine) {
		const m = behalfLine.match(/^For\s+and\s+on\s+behalf\s+of\s+(.*)$/i);
		const { head, tail } = parseCompanyAndTail(m ? m[1] : null);
		org = head;
		if (tail) addrParts.push(tail);
	}

	// Postcode: typically appears on the Telephone line
	let postcode = null;
	for (const ln of lines) {
		const pm = ln.match(/\bPostcode\b\s*([A-Z0-9\s]+)$/i);
		if (pm) {
			postcode = cleanValue(pm[1]);
			break;
		}
	}

	const address = cleanValue(addrParts.join(' '));
	return { address, postcode, name, org, signature };
}

function extractQualifications(text) {
	// Search near the qualifications line
	const seg = windowAfter(text, /(Professional\s+)?Qualifications\s+of\s+the\s+Valuer/i, 220);
	if (!seg) return { mrics: null, frics: null, assocRics: null };
	// Return true only when explicitly marked with X; otherwise null (empty/not selected)
	const mrics = /\bMRICS\b\s+X\b/i.test(seg) ? true : null;
	const frics = /\bFRICS\b\s+X\b/i.test(seg) ? true : null;
	const assoc = /\bAssocRICS\b\s+X\b/i.test(seg) ? true : null;
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
	const section = extractValuersDeclarationSection(text) || text;

	const { address: valuerAddress, postcode: valuerPostcode, name: nameFromAddr, org: orgFromAddr, signature: sigFromAddr } = extractAddress(section);
	let valuerSignature = sigFromAddr ?? pickAfterLabel(section, /Signature\s+of\s+Valuer\s*\/\s*Electronic\s+Signature\s*/i);
	// Guard: when signature is empty, the next label "Address of Valuer" can leak into the capture.
	// Treat that as missing.
	if (typeof valuerSignature === 'string' && /\baddress\s+of\s+valuer\b/i.test(valuerSignature)) {
		valuerSignature = null;
	}
	const valuerName = nameFromAddr ?? pickAfterLabel(section, /Name\s+of\s+Valuer\s+/i);
	const onBehalfOf = orgFromAddr ?? pickAfterLabel(section, /For\s+and\s+on\s+behalf\s+of\s+/i);
	const telephone = pickDigits(section, /Telephone\s*\(inc\.\s*STD\s*code\)\s*/i);
	const fax = pickDigits(section, /Fax\s*\(inc\.\s*STD\s*code\)\s*/i);
	const email = pickEmail(section, /E-?mail\s*/i);
	const valuerQualifications = extractQualifications(section);
	const ricsNumber = pickFirstIntOnLine(section, /\bRICS\s+Number\b/i);
	const reportDate = pickReportDate(section);

	return {
		valuerSignature: cleanValue(valuerSignature),
		valuerName: cleanValue(valuerName),
		onBehalfOf: cleanValue(onBehalfOf),
		telephone,
		fax,
		email,
		valuerQualifications,
		ricsNumber,
		valuerAddress: cleanValue(valuerAddress),
		valuerPostcode: cleanValue(valuerPostcode),
		reportDate
	};
}

export { mapValuersDeclaration };


