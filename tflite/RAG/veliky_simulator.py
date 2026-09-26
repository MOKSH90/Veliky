#!/usr/bin/env python3
"""Synthetic CSV historian for the proactive demo; never connects to plant equipment."""
import argparse
import csv
import math
import os
import tempfile
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from veliky_service import RAG_DIR

FIELDS = ['Date', 'Equipment', 'Measurement_Point', 'RMS_Velocity_mms', 'Temperature_C', 'ISO_Zone', 'Notes']


def readings(step, timestamp):
    """Two assets; pump starts drifting after five stable readings."""
    return [{'Date': timestamp, 'Equipment': equipment, 'Measurement_Point': 'NDE_Horizontal',
             'RMS_Velocity_mms': round(value, 2), 'Temperature_C': 48,
             'ISO_Zone': 'unclassified', 'Notes': 'SYNTHETIC DEMO DATA'}
            for equipment, value in [('P-204', 2.8 + max(0, step-4)*0.3), ('C-104', 2.1 + (step % 3)*0.02)]]


def publish(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w', newline='', dir=path.parent, delete=False) as stream:
        writer = csv.DictWriter(stream, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(stream.name, path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-dir', type=Path, default=RAG_DIR/'state/demo-data')
    parser.add_argument('--steps', type=int, default=18)
    parser.add_argument('--interval', type=float, default=5)
    args = parser.parse_args()
    if not 1 <= args.steps <= 10000 or not math.isfinite(args.interval) or args.interval < 0:
        parser.error('steps must be 1..10000 and interval finite and nonnegative')
    path = args.data_dir.resolve()/'simulated_sensor_history.csv'
    rows = []
    start = datetime.now(timezone.utc)
    for step in range(args.steps):
        timestamp = (start + timedelta(seconds=step*max(args.interval, .001))).isoformat()
        rows.extend(readings(step,timestamp))
        publish(path,rows)
        print(f'SYNTHETIC step={step} P-204={rows[-2]["RMS_Velocity_mms"]} mm/s -> {path}', flush=True)
        if step+1 < args.steps:
            time.sleep(args.interval)


if __name__ == '__main__':
    main()
