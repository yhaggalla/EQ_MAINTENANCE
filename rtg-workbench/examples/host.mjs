import{mountRtgViewer}from'../viewer/adapter.mjs';
// This module is a host application, not part of the viewer. It alone owns these records.
const fixtures=await fetch('/model/1/bindings.synthetic.json').then(r=>r.json()),host=document.querySelector('#host'),record=document.querySelector('#record'),saved=new Map(),loaderCalls=[];
let equipmentId=fixtures[0].equipmentId,selection={equipmentId,kind:'equipment'},adapter;
const current=()=>fixtures.find(f=>f.equipmentId===equipmentId);
function render(){record.textContent=JSON.stringify({selection,history:current().history.filter(h=>selection.kind==='equipment'||h.positionId===selection.positionId)},null,2);}
function choose(s){selection=s;saved.set(equipmentId,s);adapter.setState({selection,focus:true});render();}
const loader=async(url,{signal,kind})=>{loaderCalls.push({url,kind});const response=await fetch(url,{signal,credentials:'same-origin'});if(!response.ok)throw new Error('Host asset request failed: '+response.status);return kind==='manifest'?response.json():response.arrayBuffer();};
adapter=await mountRtgViewer(host,{equipmentId,modelVersion:1,bindings:current().entries,modelUrl:'/model/1/scene.glb',manifestUrl:'/model/1/manifest.json',loader,selection,mode:'overall',onSelectionChange:choose,onFallback:reason=>{if(reason)record.textContent=reason;}});
function selectKey(key){const b=current().entries.find(b=>b.nodeKey===key);choose({equipmentId,modelVersion:1,kind:'position',nodeKey:key,positionId:b.positionId,...b.classification});}
document.querySelector('#motor').onclick=()=>selectKey('hoist.motor.main');document.querySelector('#tyre').onclick=()=>selectKey('gantry.tyre.left.front.outer');document.querySelector('#fit').onclick=()=>adapter.fitAll();document.querySelector('#dispose').onclick=()=>adapter.dispose();
document.querySelector('#equipment').onchange=e=>{equipmentId=e.target.value;selection=saved.get(equipmentId)||{equipmentId,kind:'equipment'};adapter.setEquipment({equipmentId,modelVersion:1,bindings:current().entries,selection,overlays:[]});render();};
addEventListener('pagehide',()=>adapter.dispose());render();window.__hostExample={adapter,loaderCalls,get selection(){return selection;},ready:true};
