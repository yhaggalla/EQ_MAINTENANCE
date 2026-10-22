from pathlib import Path
import base64, json, mimetypes

HERE=Path(__file__).resolve().parent
assert HERE.name=='eq-maintenance-demo-20261021'
assets={p.name:{'mime':mimetypes.guess_type(p.name)[0] or 'application/octet-stream','base64':base64.b64encode(p.read_bytes()).decode()} for p in (HERE/'assets').iterdir() if p.is_file()}
sources={'STYLES':'styles.css','THREE':'vendor/three.bundle.js','REFERENCE':'reference-data.js','DATA':'demo-data.js','VIEWER':'crane-viewer-corrected.js','APP':'app.js'}
html=(HERE/'page-template.html').read_text(encoding='utf-8')
for marker,name in sources.items():
    data=(HERE/name).read_text(encoding='utf-8')
    if marker!='STYLES': data=data.replace('</script','<\\/script')
    html=html.replace('/* '+marker+' */',data)
html=html.replace('/* DOCUMENTS */','window.DEMO_DOC_ASSETS = '+json.dumps(assets)+';')
(HERE/'index.html').write_text(html,encoding='utf-8')
print(json.dumps({'html':str(HERE/'index.html'),'bytes':(HERE/'index.html').stat().st_size,'embeddedDrawingsAndPhotos':len(assets),'offline':True},indent=2))
