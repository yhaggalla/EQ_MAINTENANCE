"""P02B: contrast of the new V2 colour pairs (WCAG 2.x relative luminance). Pairs are the token values in css/v2.css and css/app.css."""
import json, sys
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=sorted((lum(a),lum(b)),reverse=True); return (la+0.05)/(lb+0.05)
W='#ffffff'
pairs=[
 ('Electrical lane title on white','#8a5a00',W,4.5),('Mechanical lane title on white','#0f5a89',W,4.5),('Civil lane title on white','#3d6b2b',W,4.5),
 ('pill On hold','#2c4458','#e7edf3',4.5),('pill In progress','#0a3a58','#e1eff7',4.5),('pill Overdue','#8f1d2a','#fde8ea',4.5),
 ('pill Due soon','#6a4600','#fff1cf',4.5),('pill Pending','#46596a','#eef1f4',4.5),('pill Completed','#0f5f40','#e3f4ec',4.5),
 ('KPI label','#20394e',W,4.5),('KPI overdue number','#8f1d2a',W,4.5),('KPI due soon number','#7a5200',W,4.5),('KPI completed number','#0f5f40',W,4.5),('KPI on hold number','#2c4458',W,4.5),
 ('ticker text on navy','#ffffff','#071e30',4.5),('LIVE badge','#071e30','#efb817',4.5),('tab count badge','#5d4100','#fff4c7',4.5),
 ('src tag Auto','#0c4268','#eef6fa',4.5),('read-only chip text','#5d4100','#fff4c7',4.5),
 ('prototype banner','#ffe9a6','#3a2a00',4.5),('section switch current','#071e30','#efb817',4.5),('section switch idle on navy','#d6e5ee','#071e30',4.5),
]
bad=0
for n,f,b,t in pairs:
    r=cr(f,b); ok=r>=t; bad+=0 if ok else 1; print(('PASS' if ok else 'FAIL'), f'{r:.2f}:1 (need {t})', n)
print(len(pairs),'pairs,',bad,'below threshold')
sys.exit(1 if bad else 0)
