"""Reference the supplied flag image unchanged; derive only its display mesh outline."""
from pathlib import Path
from PIL import Image
import hashlib,json,shutil
root=Path(__file__).resolve().parents[1]
art=root/'source/artwork'; evidence=root/'evidence/appearance'
name='04a76ac3-a3c0-494b-bbc9-2f5859c38600.png'
source=root.parent/'RTG drawings'/name
shutil.copyfile(source,art/'cict-flag-source.png')
im=Image.open(source).convert('RGB');width,height=im.size;pixels=im.load()
# Follow the blue outer silhouette; texture retains lettering and gold emblem.
# The supplied image has an opaque checkerboard outside the mark. No source pixels are edited.
columns=[]
for x in range(width):
    ys=[y for y in range(height) if (lambda r,g,b:r<100 and b>100 and g>35 and b>r*1.8)(*pixels[x,y])]
    if len(ys)>100:columns.append((x,min(ys),max(ys)))
assert columns[0][0] in range(124,128) and columns[-1][0] in range(1130,1136)
samples=columns[::4]
if samples[-1]!=columns[-1]:samples.append(columns[-1])
# Preserve the gold staff below the flag, part of the supplied artwork.
bottom=[]
for x,_,y in samples:bottom.append([x,1162 if x<=228 else y])
outline=[[x,y] for x,y,_ in samples]+list(reversed(bottom))
data={'source':'RTG drawings/'+name,'width':width,'height':height,'outline':outline,'image':'cict-flag-source.png','note':'Unchanged user image, clipped by display geometry to the flag silhouette and gold staff; no checkerboard geometry.'}
(art/'cict-flag.mesh.json').write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')
photos=[]
for p in sorted((root.parent/'RTG drawings').iterdir()):
    if p.suffix.lower() in {'.jpg','.webp','.png'}:photos.append({'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
report={'photos':photos,'flag':{'identity':'CICT company flag','source':data['source'],'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceImageUnchanged':True,'embeddedInGlb':True,'authorization':'User clarification: CICT flag; flag added to folder'}}
(evidence/'source-register.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(f'CICT supplied flag: {width} x {height}, {len(outline)} outline points; original PNG unchanged')
