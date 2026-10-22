from pathlib import Path
import base64, hashlib, io, json, shutil, subprocess, tarfile, urllib.request

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
assert HERE.name == 'eq-maintenance-demo-20261021'
BUILD = HERE / '.build'
ASSETS = HERE / 'assets'
VENDOR = HERE / 'vendor'
for p in [BUILD, ASSETS, VENDOR]: p.mkdir(parents=True, exist_ok=True)

def package(name):
    with urllib.request.urlopen('https://registry.npmjs.org/' + name + '/latest', timeout=30) as r:
        meta = json.load(r)
    with urllib.request.urlopen(meta['dist']['tarball'], timeout=60) as r:
        data = r.read()
    expected = meta['dist'].get('integrity', '')
    if expected.startswith('sha512-'):
        assert base64.b64encode(hashlib.sha512(data).digest()).decode() == expected[7:]
    return meta, data

three, data = package('three')
dest = BUILD / 'node_modules' / 'three'
with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as tar:
    wanted = ['package/package.json','package/LICENSE','package/build/three.module.js','package/build/three.core.js','package/examples/jsm/controls/OrbitControls.js']
    for name in wanted:
        m = tar.getmember(name)
        out = dest / Path(name).relative_to('package')
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(tar.extractfile(m).read())
shutil.copyfile(dest / 'LICENSE', VENDOR / 'THREE-LICENSE.txt')
esbuild, data = package('@esbuild/win32-x64')
with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as tar:
    exe = next(m for m in tar.getmembers() if m.name.endswith('esbuild.exe'))
    (BUILD / 'esbuild.exe').write_bytes(tar.extractfile(exe).read())
entry = BUILD / 'vendor-entry.mjs'
entry.write_text("export * from 'three';\nexport {OrbitControls} from 'three/addons/controls/OrbitControls.js';\n", encoding='utf-8')
subprocess.run([str(BUILD / 'esbuild.exe'), str(entry), '--bundle', '--format=iife', '--global-name=THREE', '--minify', '--legal-comments=linked', '--outfile=' + str(VENDOR / 'three.bundle.js')], check=True, cwd=HERE)
(VENDOR / 'THIRD_PARTY.json').write_text(json.dumps({'three':{'version':three['version'],'source':three['dist']['tarball'],'integrity':three['dist'].get('integrity'),'license':'MIT'},'bundler':{'name':'esbuild','version':esbuild['version']}}, indent=2),encoding='utf-8')

catalogue = json.loads((ROOT / 'documents' / 'prompt-pack' / 'reference' / 'mechanisms-approved.json').read_text(encoding='utf-8'))
parameters = json.loads((ROOT / 'documents' / 'prompt-pack' / 'reference' / 'major-parameters.json').read_text(encoding='utf-8'))
(HERE / 'reference-data.js').write_text('window.DEMO_REFERENCE = ' + json.dumps({'catalogue':catalogue,'parameters':parameters},ensure_ascii=False) + ';\n',encoding='utf-8')
copies = {
    'As-bulit drawing/J526A00（structure parameters）.pdf':'qc-general-arrangement.pdf',
    'As-bulit drawing/J526A0300.pdf':'qc-main-hoist.pdf',
    'As-bulit drawing/J526A0200.pdf':'qc-trolley.pdf',
    'As-bulit drawing/J526A0600.pdf':'qc-gantry-drive.pdf',
    'As-bulit drawing/J526A1200.pdf':'qc-headblock.pdf',
    'documents/images2.jpg':'cict-qc-reference.jpg',
}
for source, name in copies.items(): shutil.copyfile(ROOT / source, ASSETS / name)
print(json.dumps({'folder':str(HERE),'threeVersion':three['version'],'esbuildVersion':esbuild['version'],'localReferenceCopies':list(copies.values()),'originalFilesChanged':False},indent=2))
