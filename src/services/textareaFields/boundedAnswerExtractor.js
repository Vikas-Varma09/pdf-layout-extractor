/**
 * Extract text between Label A and Label B on the same page.
 * By default, includes ALL spans between (no left restriction).
 * If options.leftBand is provided (in %), restrict to |left - labelA.left| < leftBand.
 *
 * @param {{ labelA: { left: number, topStart: number, topEnd: number, page: number }, labelB: { left: number, topStart: number, topEnd: number, page: number } }} bounds
 * @param {Array<{ text: string, left: number, top: number, page: number }>} spans
 * @param {{ leftBand?: number }} [options]
 * @returns {string|null}
 */
export function extractBoundedAnswer(bounds, spans, options = {}) {
	const { labelA } = bounds;
	let { labelB } = bounds;
	if (!labelA || !labelB) return null;
	// Allow capturing until end of A's page when B is on a later page
	if (labelA.page !== labelB.page) {
		if (options.allowCrossPage) {
			labelB = { ...labelA, topStart: Number.POSITIVE_INFINITY, topEnd: Number.POSITIVE_INFINITY };
		} else {
			return null;
		}
	}

	// Optionally stop extraction when encountering section headers or specific markers
	const stopMarkers = Array.isArray(options.stopAtMarkers) ? options.stopAtMarkers : [];
	let stopAtTop = null;
	if (stopMarkers.length > 0) {
		for (const marker of stopMarkers) {
			const markerSpan = spans.find(s => 
				s.page === labelA.page && 
				typeof s.text === 'string' && 
				s.text.toLowerCase().includes(String(marker).toLowerCase()) &&
				s.top > labelA.topEnd
			);
			if (markerSpan && (stopAtTop === null || markerSpan.top < stopAtTop)) {
				stopAtTop = markerSpan.top;
			}
		}
	}

	let filtered = spans
		.filter(s => {
			if (s.page !== labelA.page) return false;
			const betweenRows = s.top > labelA.topEnd && s.top < labelB.topStart;
			// Optionally include same-row tokens to the right of label A
			const rowEps = typeof options.rowEps === 'number' ? options.rowEps : 0.6;
			const sameRowRight = !!options.includeSameRowRight &&
				Math.abs(s.top - labelA.topStart) < rowEps &&
				s.left > labelA.left;
			if (!(betweenRows || sameRowRight)) return false;
			// Stop extraction if we've hit a stop marker
			if (stopAtTop !== null && s.top >= stopAtTop) return false;
			// For side-by-side fields (includeSameRowRight), exclude spans on label B's row to avoid checkbox values
			// Only apply this when using same-row extraction mode
			if (options.includeSameRowRight) {
				const sameRowAsB = Math.abs(s.top - labelB.topStart) < rowEps;
				// Exclude spans on label B's row that are to the left of or at label B's position
				if (sameRowAsB && s.left <= labelB.left) return false;
			}
			// Optional short window below A to avoid capturing far-off labels
			if (betweenRows && typeof options.maxBelowA === 'number') {
				if ((s.top - labelA.topEnd) > options.maxBelowA) return false;
			}
			if (typeof s.text !== 'string' || s.text.trim().length === 0) return false;
			// Optional absolute left bounds for answers (useful when the textbox is in a different column than the label)
			if (typeof options.answerLeftMin === 'number' && s.left < options.answerLeftMin) return false;
			if (typeof options.answerLeftMax === 'number' && s.left > options.answerLeftMax) return false;
			// Optionally require tokens to be on or to the right of label A
			if (options.onlyRightOfA === true) {
				const rightSlack = typeof options.rightSlack === 'number' ? options.rightSlack : 0.0;
				if (s.left < (labelA.left - rightSlack)) return false;
			}
			if (typeof options.leftBand === 'number') {
				return Math.abs(s.left - labelA.left) < options.leftBand;
			}
			return true;
		})
		.sort((a, b) => a.left - b.left || a.top - b.top);

	if (options.debug) {
		console.log('[textarea] filtered spans count:', filtered.length);
		if (filtered.length > 0) {
			const sample = filtered.slice(0, 5).map(s => ({ text: s.text, left: s.left, top: s.top }));
			console.log('[textarea] first spans:', sample);
		}
	}

	// If no explicit leftBand provided, optionally cluster by left and take the column
	// whose mean left is nearest to labelA.left to avoid side-by-side fields.
	if (typeof options.leftBand !== 'number') {
		const threshold = typeof options.clusterThreshold === 'number' ? options.clusterThreshold : 3.0;
		const clusters = [];
		for (const s of filtered) {
			const last = clusters[clusters.length - 1];
			if (!last) {
				clusters.push([s]);
				continue;
			}
			const lastLeft = last[last.length - 1].left;
			if (Math.abs(s.left - lastLeft) <= threshold) {
				last.push(s);
			} else {
				clusters.push([s]);
			}
		}
		if (clusters.length > 0) {
			let best = clusters[0];
			let bestDist = Math.abs(avgLeft(best) - labelA.left);
			for (let i = 1; i < clusters.length; i++) {
				const dist = Math.abs(avgLeft(clusters[i]) - labelA.left);
				if (dist < bestDist) {
					best = clusters[i];
					bestDist = dist;
				}
			}
			// Optionally expand to include slightly more right-indented lines of the same column
			if (typeof options.expandRightWithin === 'number') {
				const mean = avgLeft(best);
				const leftMin = mean - threshold;
				const leftMax = mean + options.expandRightWithin;
				const expanded = filtered.filter(s => s.left >= leftMin && s.left <= leftMax);
				filtered = expanded;
			} else {
				filtered = best;
			}
		}
	}

	// Resort by reading order for concatenation
	filtered = filtered
		.sort((a, b) => {
			if (a.top !== b.top) return a.top - b.top;
			return a.left - b.left;
		});

	if (filtered.length === 0) return null;

	let joined = filtered.map(s => s.text.trim()).join(' ').replace(/\s+/g, ' ').trim();

	// Optionally strip label prefixes if they leak into the capture
	if (options.stripLabelPrefixes) {
		const stripOne = (text, prefix) => {
			if (!prefix || typeof prefix !== 'string') return text;
			const re = new RegExp('^' + escapeRegex(prefix.trim()) + '\\s*', 'i');
			return text.replace(re, '').trim();
		};
		const tokens = [];
		if (typeof options.labelAText === 'string' && options.labelAText.trim().length > 0) {
			tokens.push(options.labelAText);
		}
		if (Array.isArray(options.stripTokens)) {
			for (const tk of options.stripTokens) {
				if (typeof tk === 'string' && tk.trim().length > 0) tokens.push(tk);
			}
		}
		// Repeatedly strip any leading token until no change
		let changed = true;
		while (changed && joined.length > 0) {
			const before = joined;
			for (const tk of tokens) {
				joined = stripOne(joined, tk);
			}
			changed = before !== joined;
		}
	}

	// Optionally reject if the remaining text is just the label (or mostly the label)
	if (options.rejectIfLabel && typeof options.labelAText === 'string') {
		const lab = options.labelAText.trim().toLowerCase();
		const txt = joined.trim().toLowerCase();
		if (lab.length > 0) {
			if (txt === lab || (txt.startsWith(lab) && txt.length - lab.length < 5)) {
				joined = '';
			}
		}
	}

	// Optionally strip trailing checkbox tokens (X, Yes, No, N/A) that might leak from adjacent rows
	const stripCheckboxTokens = options.stripCheckboxTokens !== false;
	if (stripCheckboxTokens) {
		if (Array.isArray(options.stripTokens)) {
			const checkboxTokens = ['X', 'Yes', 'No', 'N/A'];
			const tokensToStrip = options.stripTokens.filter(t => checkboxTokens.includes(t));
			if (tokensToStrip.length > 0) {
				// Remove trailing standalone checkbox tokens
				for (const token of tokensToStrip) {
					const re = new RegExp('\\s+' + escapeRegex(token.trim()) + '\\s*$', 'i');
					joined = joined.replace(re, '').trim();
				}
			}
		}

		// Strip checkbox tokens from anywhere in the text (not just trailing)
		const checkboxTokens = ['X', 'Yes', 'No', 'N/A'];
		for (const token of checkboxTokens) {
			// Remove standalone checkbox tokens (with word boundaries)
			const re = new RegExp('\\b' + escapeRegex(token.trim()) + '\\b', 'gi');
			joined = joined.replace(re, '').trim();
		}
	}

	// Clean up multiple spaces
	joined = joined.replace(/\s+/g, ' ').trim();

	// Reject if the result only contains checkbox tokens (when stripping is enabled) or is empty
	if (stripCheckboxTokens) {
		const checkboxOnlyPattern = /^(Yes|No|X|N\/A|\s)+$/i;
		if (checkboxOnlyPattern.test(joined) || joined.length === 0) {
			return null;
		}
	} else if (joined.length === 0) {
		return null;
	}

	if (options.debug) {
		console.log('[textarea] joined:', joined);
	}
	return joined.length > 0 ? joined : null;
}

function avgLeft(arr) {
	if (!arr || arr.length === 0) return 0;
	let sum = 0;
	for (const s of arr) sum += s.left;
	return sum / arr.length;
}

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

