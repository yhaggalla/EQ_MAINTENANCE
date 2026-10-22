"""Diagnostic, uniformly registered source/model overlays. Never stretches a source."""
from pathlib import Path
import json, math
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[1]
directory=root/'evidence/comparisons'
data=json.loads((directory/'alignment.json').read_text())
for item in data['definitions']:
    source=Image.open(root/'evidence/sources/M14'/item['source']).convert('RGB')
    model=Image.open(directory/(item['name']+'-model.png')).convert('RGB')
    p,q=item['model']['pixels'];a,b=item['sourcePixels']
    scale=math.dist(a,b)/math.dist(p,q)
    dx=a[0]-scale*p[0];dy=a[1]-scale*p[1]
    # Inverse affine mapping is a single isotropic scale and a translation only.
    registered=model.transform(source.size,Image.Transform.AFFINE,(1/scale,0,-dx/scale,0,1/scale,-dy/scale),resample=Image.Resampling.BICUBIC,fillcolor='white')
    mask=registered.convert('L').point(lambda value:int((255-value)*.6))
    overlay=source.convert('RGBA');tint=Image.new('RGBA',source.size,(0,113,211,0));tint.putalpha(mask);overlay=Image.alpha_composite(overlay,tint)
    for im in [overlay]:
        draw=ImageDraw.Draw(im)
        for x,y in item['sourcePixels']:draw.ellipse((x-5,y-5,x+5,y+5),outline=(208,72,0),width=2)
    overlay.save(directory/(item['name']+'-overlay.png'));registered.save(directory/(item['name']+'-registered.png'))
    item['uniformTransform']={'scale':scale,'translateX':dx,'translateY':dy,'sourceAnchorUncertaintyPx':8 if 'trolley' in item['name'] else 3}
    w,h=source.size;contact=Image.new('RGB',(w*3,h+42),'#f1f5f8');draw=ImageDraw.Draw(contact)
    for i,(label,image) in enumerate([('SUPPLIED DRAWING',source),('MODEL AT SAME UNIFORM SCALE',registered),('SOURCE + BLUE MODEL / ORANGE DATUMS',overlay.convert('RGB'))]):
        contact.paste(image,(i*w,42));draw.text((i*w+12,13),label,fill='#254355')
    contact.save(directory/(item['name']+'-comparison.png'))
(directory/'alignment.json').write_text(json.dumps(data,indent=2))
print('Wrote five three-panel comparisons and transparent blue overlays; source pixels unwarped.')
