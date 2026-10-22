"""Create a local source/model/evidence delivery archive; never publish it."""
from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[1]
destination=root/'dist';destination.mkdir(exist_ok=True)
archive=destination/'rtg-workbench-0.1.0.zip'
files=[p for p in root.rglob('*') if p.is_file() and not any(part in {'node_modules','dist','.browser-profile','__pycache__'} for part in p.relative_to(root).parts) and p.suffix not in {'.log','.pending','.pyc'} and p.name!='server.pid']
manifest={'algorithm':'sha256','files':{p.relative_to(root).as_posix():{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(files)}}
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in files:z.write(p,Path('rtg-workbench')/p.relative_to(root))
    z.writestr('rtg-workbench/PACKAGE_CHECKSUMS.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(archive) as z:
    for name,entry in manifest['files'].items():
        content=z.read('rtg-workbench/'+name)
        assert len(content)==entry['bytes'] and hashlib.sha256(content).hexdigest()==entry['sha256']
report={'result':'PASS','archive':archive.name,'files':len(files),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'verification':'Every archived file read back and SHA-256 checked','excluded':['node_modules','original PDF authorities','runtime logs/PID','dist']}
(destination/'package-verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
