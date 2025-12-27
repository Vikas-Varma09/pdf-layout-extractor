import argparse
import json
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to JSON mapping {section: imagePath}")
    parser.add_argument("--lang", default="en")
    args = parser.parse_args()

    try:
        from paddleocr import PaddleOCR
    except Exception as e:
        print(json.dumps({"success": False, "error": f"PaddleOCR import failed: {e}"}))
        return 1

    try:
        with open(args.input, "r", encoding="utf-8") as f:
            mapping = json.load(f)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Failed to read input: {e}"}))
        return 1

    ocr = PaddleOCR(use_angle_cls=True, lang=args.lang, use_gpu=False, show_log=False)

    result = {}
    for section, img_path in mapping.items():
        try:
            if not img_path or not Path(img_path).exists():
                result[section] = ""
                continue
            ocr_res = ocr.ocr(img_path, cls=True)
            lines = []
            for page in ocr_res:
                for line in page:
                    txt = line[1][0]
                    if txt:
                        lines.append(txt)
            result[section] = "\n".join(lines)
        except Exception:
            result[section] = ""

    print(json.dumps({"success": True, "data": result}, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    sys.exit(main())

