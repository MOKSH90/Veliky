"""Subprocess-only callable adapters; this file is mounted read-only in the sandbox."""
from __future__ import annotations
import importlib
import json
from pathlib import Path
import subprocess
import sys


def csv_analysis(data: dict) -> dict | list:
    """Analyze a staged CSV using pandas without evaluating caller expressions."""
    import pandas as pd
    frame = pd.read_csv(data['path'])
    if data['operation'] == 'head':
        return json.loads(frame.head(10).to_json(orient='records'))
    if data['operation'] == 'describe':
        return json.loads(frame.describe(include='all').to_json())
    return {'rows': len(frame), 'columns': list(frame.columns)}


def ocr(data: dict) -> dict:
    """Rasterize PDFs locally before tesseract; accept images directly."""
    source = data['path']
    images = [source]
    if Path(source).suffix == '.pdf':
        subprocess.run(['/usr/bin/pdftoppm', '-f', '1', '-l', '20', '-scale-to', '2000', '-png', source, '/work/page'], check=True)
        images = sorted(str(p) for p in Path('/work').glob('page-*.png'))
    texts = []
    for image in images:
        result = subprocess.run(['/usr/bin/tesseract', image, 'stdout'], capture_output=True, text=True, check=True)
        texts.append(result.stdout)
    return {'text': '\n'.join(texts)}


def main() -> None:
    """Import the administrator-selected callable after entering the sandbox."""
    module, function = sys.argv[1].split(':')
    target = sys.modules[__name__] if module == 'capability_worker' else importlib.import_module(module)
    result = getattr(target, function)(json.load(sys.stdin))
    print(json.dumps(result, allow_nan=False))


if __name__ == '__main__':
    main()
