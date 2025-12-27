function parseHeader(pdfText, applicationId) {
	const raw = String(pdfText || "");
	const lines = raw.split(/\r?\n/);

	// Application Number: return only value
	let applicationNumber = "";
	{
		const m = raw.match(/Application Number:\s*([^\r\n]+)/i);
		if (m) applicationNumber = (m[1] || "").trim();
	}

	// Applicant name: line after the "Applicant(s) Surname(s) & Initials:" label
	let applicantName = "";
	{
		const idx = lines.findIndex(l => /Applicant\(s\)\s*Surname\(s\)\s*&\s*Initials:/i.test(l));
		if (idx !== -1 && idx + 1 < lines.length) {
			let next = String(lines[idx + 1] || "");
			const split = next.split(/Date of Inspection:/i);
			applicantName = (split[0] || next).trim();
		}
	}

	// Property Address: two lines after the label, joined into one line
	let propertyAddress = "";
	{
		const idx = lines.findIndex(l => /Property\s*Address:/i.test(l));
		if (idx !== -1) {
			const addr1 = (lines[idx + 1] || "").trim();
			const addr2 = (lines[idx + 2] || "").trim();
			if (addr1) {
				const parts = [addr1];
				if (addr2 && !/^Postcode\s*:/i.test(addr2)) parts.push(addr2);
				propertyAddress = parts.join(" ").replace(/\s{2,}/g, " ").trim();
			}
		}
	}

	// Postcode: return only value
	let postCode = "";
	{
		const m = raw.match(/Postcode:\s*([^\r\n]+)/i);
		if (m) postCode = (m[1] || "").trim();
	}

	return {
		applicationId,
		applicationNumber,
		applicantName,
		propertyAddress,
		postCode
	};
}

export { parseHeader };