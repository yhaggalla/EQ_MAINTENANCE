# Exported dimension checks

Numeric export checks do not certify source accuracy, hidden geometry or dimensions classified as estimates. Source approximations remain approximations.

All figures below are millimetres. Numeric tolerance: 0.02 mm for float32 export; source raster/nominal uncertainty is separate and is not reduced by this tolerance.

| Parameter | Source | Actual export | Absolute deviation | Source confidence | Source |
|---|---:|---:|---:|---|---|
| span | 23470 | 23470 | 0 | high | M14 PDF20 |
| base | 7900 | 7900 | 0 | high | M14 PDF20 |
| bogiePitch | 2800 | 2800 | 0 | high | M14 PDF20 |
| gauge | 6400 | 6400 | 0 | high | M14 PDF21 |
| trolleyBase | 4050 | 4050 | 0 | medium | M14 PDF21 |
| cabFrontOffset | 1000 | 1000 | 0 | medium | M14 PDF21 |
| cabBodyLength | 2400 | 2400.000095 | 9.5e-05 | medium | M14 PDF21 |
| cabHeight | 2200 | 2199.998856 | 0.001144 | medium | M13 PDF11 |
| tyreDiameter | 1860 | 1860.000014 | 1.4e-05 | medium | M14 PDF17 |
| trolleyWheelDiameter | 500 | 500 | 0 | high | M14 PDF16 |
| railSection | 80 | 79.999924 | 7.6e-05 | high | M14 PDF16 |
| drumDiameter | 1200 | 1200.000048 | 4.8e-05 | high | M14 PDF16 |
| ropeDiameter | 28 | 28.000001 | 1e-06 | medium | M14 PDF16 |
| headblockRopeSpan | 5380 | 5380 | 0 | medium | M14 PDF21 |
| headblockFrameSpan | 5000 | 5000 | 0 | medium | M14 PDF21 |
| trolleyTravel | 18500 | 18500 | 0 | high | M14 PDF20 |
| trolleyEndInset | 2485 | 2485 | 0 | high | M14 PDF20 |
| lift | 21200 | 21200 | 0 | high | M14 PDF15 |

All checks PASS for those nominal references. Source rope/tyre/cabin qualifications and unresolved placements remain in SOURCE_AUDIT.md. Export values and measurement methods are stored in accuracy.json.