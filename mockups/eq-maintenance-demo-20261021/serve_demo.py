"""Serve only this isolated mockup on an automatically chosen loopback port."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
import json, os

HERE=Path(__file__).resolve().parent
assert HERE.name=='eq-maintenance-demo-20261021'
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(HERE)))
port=server.server_address[1]
(HERE/'preview-session.json').write_text(json.dumps({'pid':os.getpid(),'url':f'http://127.0.0.1:{port}/','directory':str(HERE)},indent=2),encoding='utf-8')
print(f'Interactive mockup: http://127.0.0.1:{port}/',flush=True)
try:server.serve_forever()
finally:server.server_close()
