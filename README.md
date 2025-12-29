# pdf-layout-extractor

Deterministic, layout-based extraction of structured data from fixed-template digital PDFs using coordinate boundaries.

GitHub: [Vikas-Varma09/pdf-layout-extractor](https://github.com/Vikas-Varma09/pdf-layout-extractor)

## Run (API)

```bash
npm install
npm run start
```

- Server runs on `http://localhost:4000`
- Health check: `GET /health`

## Run (UI)

Open:
- `http://localhost:4000/ui/`

The UI lets you:
- Upload a PDF
- Set `applicationType` (`BTL` or `HPP`)
- Extract JSON
- Copy the JSON directly (Copy JSON button)

## API

### `POST /api/extract-fields`

**multipart/form-data**
- `file`: PDF (required)
- `applicationType`: `BTL` | `HPP` (optional)

Notes:
- **BTL**: includes Rental Information + Valuation (BTL)
- **HPP**: includes Valuation (HPP); Rental Information is not expected

## How extraction works (high level)

- **PDF text layer (primary)**: `pdfjs-dist` reads the PDF *text layer* and produces positioned spans (`left`, `top`, `page`).  
  This is the preferred/fast path for fixed-template PDFs where the text is selectable.
- **Checkbox fields**: detect marker near Yes/No/N/A columns (with safe fallbacks)
- **Value columns**: find numeric tokens aligned to a target column near a label
- **Textarea fields**: capture text bounded between label A and label B, with left/right column controls
- **Raw text (OCR fallback)**: if the PDF text layer is missing/poor (scanned PDFs), we convert pages to images and run OCR to generate `rawText`.
  The OCR path is also used for sections that are easier/more stable to parse from `rawText` (e.g. “General Remarks”, “Valuers Declaration”, and “Valuation Report Details” mappers).

## OCR dependencies (Windows)

OCR is used by `extractRawTextFromOCR` and requires:
- **Poppler** (`pdftocairo`) available on PATH (or configured in your environment)
- **Python 3** + **PaddleOCR** dependencies installed from `python/requirements.txt`

Quick setup idea:
- Install Python 3
- From repo root:

```bash
pip install -r python/requirements.txt
```

If OCR is not configured, structured extraction can still work, but `rawText` may be `null`.

