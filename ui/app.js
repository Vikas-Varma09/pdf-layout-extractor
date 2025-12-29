/* global navigator, document, window */

const $ = (id) => document.getElementById(id);

const form = $('extractForm');
const fileInput = $('fileInput');
const appType = $('appType');
const prettyPrint = $('prettyPrint');
const docsToggle = $('docsToggle');
const docsPanel = $('docsPanel');
const submitBtn = $('submitBtn');
const copyBtn = $('copyBtn');
const downloadBtn = $('downloadBtn');
const statusEl = $('status');
const metaEl = $('meta');
const outputEl = $('output');

let lastJsonText = '{}';
let lastJsonObj = null;

function setStatus(msg, kind = 'info') {
  statusEl.textContent = msg || '';
  statusEl.classList.toggle('error', kind === 'error');
}

function renderOutput(obj) {
  lastJsonObj = obj;
  const text = prettyPrint.checked ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
  lastJsonText = text;
  outputEl.textContent = text;
  copyBtn.disabled = false;
  downloadBtn.disabled = false;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  fileInput.disabled = isLoading;
  appType.disabled = isLoading;
  prettyPrint.disabled = isLoading;
  copyBtn.disabled = isLoading || !lastJsonObj;
  downloadBtn.disabled = isLoading || !lastJsonObj;
  submitBtn.textContent = isLoading ? 'Extracting…' : 'Extract';
}

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(lastJsonText);
    setStatus('Copied JSON to clipboard.');
  } catch (e) {
    setStatus('Copy failed (browser clipboard permission). Select and copy manually.', 'error');
  }
});

downloadBtn.addEventListener('click', () => {
  const blob = new Blob([lastJsonText], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const base = (fileInput.files?.[0]?.name || 'output').replace(/\.pdf$/i, '');
  a.href = url;
  a.download = `${base}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

prettyPrint.addEventListener('change', () => {
  if (!lastJsonObj) return;
  renderOutput(lastJsonObj);
});

docsToggle?.addEventListener('change', () => {
  if (!docsPanel) return;
  docsPanel.hidden = !docsToggle.checked;
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = fileInput.files?.[0];
  if (!file) {
    setStatus('Please choose a PDF file.', 'error');
    return;
  }

  setStatus('');
  metaEl.textContent = '';
  setLoading(true);

  try {
    const fd = new FormData();
    fd.append('file', file);
    if (appType.value) fd.append('applicationType', appType.value);

    const startedAt = performance.now();
    const res = await fetch('/api/extract-fields', { method: 'POST', body: fd });
    const ms = Math.round(performance.now() - startedAt);

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await res.json() : { error: await res.text() };

    if (!res.ok) {
      renderOutput(payload);
      setStatus(payload?.error || `Request failed (${res.status})`, 'error');
      metaEl.textContent = `HTTP ${res.status} • ${ms}ms`;
      return;
    }

    renderOutput(payload);
    setStatus('Done.');
    metaEl.textContent = `HTTP ${res.status} • ${ms}ms`;
  } catch (err) {
    renderOutput({ error: String(err?.message || err) });
    setStatus(String(err?.message || err), 'error');
  } finally {
    setLoading(false);
  }
});

// Initial state
renderOutput({});
copyBtn.disabled = true;
downloadBtn.disabled = true;
if (docsPanel && docsToggle) docsPanel.hidden = !docsToggle.checked;


