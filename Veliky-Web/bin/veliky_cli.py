#!/usr/bin/env python3
"""Compatibility entry point; the shared CLI lives beside the backend."""
import runpy
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[2] / "tflite"
sys.path.insert(0, str(root))
if __name__ == "__main__":
    runpy.run_path(str(root / "veliky_cli.py"), run_name="__main__")
