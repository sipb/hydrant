#! /bin/sh
cd "${0%/*}"
echo "=== fireroadws.py ==="
python3 fireroadws.py
echo "=== sublist_ws.py ==="
python3 sublist_ws.py
echo "=== combiner_ws.py ==="
python3 combiner_ws.py
cp full.json ../public/full.json
