function parseHeader(pdfText, applicationId) {
	const raw = String(pdfText || "");
	// IMPORTANT: Only parse the top "cover" header block.
	// If it's blank, we should return nulls even if later pages contain the data.
	const headerEnd = raw.search(/\bPROPERTY TYPE\b/i);
	const headerText = headerEnd > 0 ? raw.slice(0, headerEnd) : raw.slice(0, 1200);
	const lines = headerText.split(/\r?\n/);

	const cleanValue = (v) => {
		if (v == null) return null;
		const s = String(v).replace(/\s+/g, " ").trim();
		return s.length ? s : null;
	};

	const looksLikeHeaderLabel = (s) => {
		if (!s) return true;
		const t = String(s).trim();
		return (
			/^Date of Inspection:/i.test(t) ||
			/^Property Address:/i.test(t) ||
			/^Postcode:/i.test(t) ||
			/^PROPERTY TYPE\b/i.test(t) ||
			/^ACCOMMODATION\b/i.test(t)
		);
	};

	// Application Number: return only value
	let applicationNumber = null;
	{
		// Capture the token after "Application Number:".
		// IMPORTANT: require at least one digit; otherwise blank fields can accidentally pick up the next label (e.g. "Date of Inspection:").
		const m = headerText.match(/Application Number:\s*([^\r\n]*)/i);
		if (m) {
			let v = cleanValue(m[1]);
			// Sometimes the applicant line continues with "Date of Inspection:" on the same line; strip that tail.
			if (v) v = cleanValue(v.split(/Date of Inspection:/i)[0]);
			if (!v || looksLikeHeaderLabel(v) || !/\d/.test(v)) {
				applicationNumber = null;
			} else {
				applicationNumber = v;
			}
		}
	}

	// Date of Inspection: return only value (dd/mm/yyyy)
	let dateOfInspection = null;
	{
		const m = headerText.match(/Date of Inspection:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
		if (m) dateOfInspection = cleanValue(m[1]);
	}

	// Applicant name: line after the "Applicant(s) Surname(s) & Initials:" label
	let applicantName = null;
	{
		const idx = lines.findIndex(l => /Applicant\(s\)\s*Surname\(s\)\s*&\s*Initials:/i.test(l));
		if (idx !== -1 && idx + 1 < lines.length) {
			let next = String(lines[idx + 1] || "");
			const split = next.split(/Date of Inspection:/i);
			const v = cleanValue((split[0] || next));
			applicantName = looksLikeHeaderLabel(v) ? null : v;
		}
	}

	// Property Address: lines after the label until Postcode/next section
	let propertyAddress = null;
	{
		const idx = lines.findIndex(l => /Property\s*Address:/i.test(l));
		if (idx !== -1) {
			const parts = [];
			for (let i = idx + 1; i < Math.min(lines.length, idx + 8); i++) {
				const ln = cleanValue(lines[i]);
				if (!ln) continue;
				if (/^Postcode\s*:/i.test(ln)) break;
				if (/^PROPERTY TYPE\b/i.test(ln) || /^ACCOMMODATION\b/i.test(ln)) break;
				parts.push(ln);
			}
			const v = cleanValue(parts.join(" "));
			propertyAddress = looksLikeHeaderLabel(v) ? null : v;
		}
	}

	// Postcode: return only value
	let postCode = null;
	{
		// Prefer UK-ish postcode shapes; avoid capturing next header when blank.
		const m = headerText.match(/Postcode:\s*([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i);
		if (m) {
			const v = cleanValue(m[1]);
			postCode = looksLikeHeaderLabel(v) ? null : v;
		}
	}

	return {
		applicationId,
		applicationNumber: applicationNumber || null,
		applicantName: applicantName || null,
		dateOfInspection: dateOfInspection || null,
		propertyAddress: propertyAddress || null,
		postCode: postCode || null
	};
}

export { parseHeader };