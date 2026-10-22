export type ViewerMode = 'overall' | 'technical';
export type ViewName = 'perspective' | 'front' | 'rear' | 'left' | 'right' | 'top';
export interface Selection { equipmentId:string; modelVersion?:number; kind:'equipment'|'main'|'sub'|'position'|'container'; main?:string; sub?:string; nodeKey?:string; positionId?:string; subInstanceId?:string; source?:'pointer'|'label'|'tree'; }
export interface Binding { nodeKey:string; kind:'position'|'hotspot'; classification:{main:string;sub:string}; positionId?:string; subInstanceId?:string; }
export interface Overlay { equipmentId:string; nodeKey:string; label:string; }
export interface MotionState { x:number; h:number; playing?:boolean; }
export interface ManifestNode { key:string; kind:'position'|'hotspot'|'container'|'decorative';label:string;parentKey:string|null;classification:{main:string;sub:string}|null;provenance:{kind:'measured'|'drawing-derived'|'estimated'|'approximate-location';sources:Record<string,unknown>[]};bounds:{min:number[];max:number[]}; }
export interface Manifest { schemaVersion:1;version:number;units:'m';nodes:ManifestNode[];[key:string]:unknown; }
export interface ViewerOptions {
  modelUrl:string;manifestUrl:string;manifest?:Manifest;modelVersion:number;equipmentId:string;bindings:Binding[];
  selection:Selection;mode:ViewerMode;overlays?:Overlay[];
  /** Return parsed JSON for manifest; ArrayBuffer for model. Host owns authentication. */
  loader?:(url:string,options:{signal:AbortSignal;kind:'manifest'|'model'})=>Promise<any>;
  onSelectionChange:(selection:Selection)=>void;
  onFallback?:(reason:string|null)=>void;onHint?:(text:string)=>void;
  onMotion?:(state:MotionState)=>void;onFrame?:(metrics:{triangles:number;drawCalls:number})=>void;
  onReady?:(result:{checksumVerified:boolean;loadMs:number})=>void;
}
export class RtgAdapter {
  constructor(host:HTMLElement,options:ViewerOptions);
  load():Promise<{checksumVerified?:boolean;loadMs?:number;error?:string}|undefined>;
  setState(state:{selection?:Selection;mode?:ViewerMode;overlays?:Overlay[];focus?:boolean}):void;
  setEquipment(state:{equipmentId:string;modelVersion:number;bindings:Binding[];selection:Selection;overlays?:Overlay[]}):boolean;
  keysFor(selection:Selection):string[];focus():boolean|undefined;resetCamera():void;fitAll():boolean|undefined;
  setView(view:ViewName):void;isolate(key:string|null):void;hide(keys:string[],hidden?:boolean):void;showAll():void;transparency(value:boolean):void;
  setLabels(items:{key:string;text:string;selection?:{kind:'sub';main:string;sub:string}}[]):void;setMotion(state:Partial<MotionState>):void;play():void;pause():void;resetMotion():void;dispose():void;
}
export function mountRtgViewer(host:HTMLElement,options:ViewerOptions):Promise<RtgAdapter>;
