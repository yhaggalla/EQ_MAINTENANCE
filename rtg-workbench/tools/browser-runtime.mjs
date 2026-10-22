import{createRequire}from'node:module';import fs from'node:fs';
const require=createRequire(import.meta.url);
export function getPlaywright(){try{return require('playwright');}catch{return require('C:/Users/yasas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');}}
export async function launch(gpu='hardware'){const{chromium}=getPlaywright();const executablePath=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>fs.existsSync(p));return chromium.launch({executablePath,headless:true,args:gpu==='none'?['--disable-webgl','--disable-3d-apis']:gpu==='software'?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:['--use-angle=d3d11','--enable-gpu-rasterization']});}
