import {useEffect, useRef} from 'react';
import {RtgAdapter, type ViewerOptions} from '../viewer/adapter.mjs';
import '../viewer/viewer.css';

/** Optional future React host bridge. Runtime DOM host example is independently verified. */
export function RtgPanel(props:ViewerOptions){
  const element=useRef<HTMLDivElement>(null),adapter=useRef<RtgAdapter|null>(null),latest=useRef(props);
  latest.current=props;
  useEffect(()=>{
    if(!element.current)return;
    const instance=new RtgAdapter(element.current,{...latest.current,
      onSelectionChange:s=>latest.current.onSelectionChange(s),
      onFallback:r=>latest.current.onFallback?.(r),
      onMotion:s=>latest.current.onMotion?.(s),
      onReady:r=>latest.current.onReady?.(r)});
    adapter.current=instance;
    void instance.load().then(()=>{
      if(adapter.current!==instance)return;
      const p=latest.current;
      instance.setEquipment({equipmentId:p.equipmentId,modelVersion:p.modelVersion,bindings:p.bindings,selection:p.selection,overlays:p.overlays});
      instance.setState({selection:p.selection,mode:p.mode,overlays:p.overlays});
    });
    return()=>{adapter.current=null;instance.dispose();};
  },[props.modelUrl,props.manifestUrl,props.manifest,props.modelVersion,props.loader]);
  useEffect(()=>{adapter.current?.setEquipment({equipmentId:props.equipmentId,modelVersion:props.modelVersion,bindings:props.bindings,selection:props.selection,overlays:props.overlays});},[props.equipmentId,props.bindings]);
  useEffect(()=>{adapter.current?.setState({selection:props.selection,mode:props.mode,overlays:props.overlays});},[props.selection,props.mode,props.overlays]);
  return <div ref={element} className="rtg-host" style={{height:'100%',minHeight:450}} aria-label="RTG equipment view"/>;
}
