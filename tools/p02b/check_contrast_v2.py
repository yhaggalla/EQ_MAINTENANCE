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
 # U1 round 8 (css/eq-fleet.css): EQ Fleet flat pastel restyle, blink states and TV mode. Text 4.5:1, non-text (rings, stripes, icons, donut) 3:1.
 ('R8 KPI number / card code (ink) on white','#1b2733',W,4.5),('R8 KPI label / card meta (muted) on white','#56626c',W,4.5),
 ('R8 freshness / TV footer (muted) on page','#56626c','#f2f2ee',4.5),('R8 TV updated (ink-2) on page','#34424e','#f2f2ee',4.5),
 ('R8 card meta on Breakdown blink peak','#56626c','#fbd9e3',4.5),('R8 card code on Breakdown blink peak','#1b2733','#fbd9e3',4.5),('R8 ZMMS count / TV duration on Breakdown peak','#34424e','#fbd9e3',4.5),
 ('R8 card meta on Maintenance blink peak','#56626c','#fae2a0',4.5),('R8 card code on Maintenance blink peak','#1b2733','#fae2a0',4.5),('R8 ZMMS count / TV duration on Maintenance peak','#34424e','#fae2a0',4.5),
 ('R8 card meta on Breakdown steady (reduced motion / paused)','#56626c','#fde8ee',4.5),('R8 card meta on Maintenance steady','#56626c','#fef5dc',4.5),
 ('R8 src tag Auto inside a card','#0c4268','#eef6fa',4.5),('R8 src tag Manual inside a card','#5d4100','#fff4c7',4.5),
 ('R8 badge Breakdown text','#8f1d2a','#fde8ea',4.5),('R8 badge Maintenance text','#6a4600','#fff1cf',4.5),('R8 badge Ready text','#0f5f40','#e3f4ec',4.5),('R8 badge Unreported text','#46596a','#eef1f4',4.5),
 ('R8 segmented control on (white on ink)','#ffffff','#1b2733',4.5),('R8 button text on white','#1b2733',W,4.5),('R8 group count pill / Synthetic tag','#34424e','#e7e8e3',4.5),('R8 retired card meta','#56626c','#f7f7f4',4.5),
 ('R8 Breakdown blink ring vs white (non-text)','#c2416b',W,3),('R8 Breakdown ring vs its peak fill (non-text)','#c2416b','#fbd9e3',3),
 ('R8 Maintenance blink ring vs white (non-text)','#9a7417',W,3),('R8 Maintenance ring vs its peak fill (non-text)','#9a7417','#fae2a0',3),
 ('R8 KPI icon Ready on soft circle (non-text)','#0f5f40','#e2f2e9',3),('R8 KPI icon Breakdown (non-text)','#8f1d2a','#fbe2e9',3),('R8 KPI icon Maintenance (non-text)','#6a4600','#fdf0cf',3),('R8 KPI icon Unreported (non-text)','#46596a','#eceff1',3),
 ('R8 donut value vs white (non-text)','#2e8a5e',W,3),
]
bad=0
for n,f,b,t in pairs:
    r=cr(f,b); ok=r>=t; bad+=0 if ok else 1; print(('PASS' if ok else 'FAIL'), f'{r:.2f}:1 (need {t})', n)
print(len(pairs),'pairs,',bad,'below threshold')
sys.exit(1 if bad else 0)
