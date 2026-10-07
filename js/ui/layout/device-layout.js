/**
 * VolleyTakt Live device-class layout controller.
 *
 * Architecture rule (0.4.1): domain/scouting logic stays shared. This module
 * only classifies the currently usable CSS viewport and exposes layout classes.
 * No device model, OS or DPR based branching is used.
 */
export const LAYOUT_CLASS={
  phonePortrait:'layout-phone-portrait',
  phoneLandscape:'layout-phone-landscape',
  large:'layout-large'
};

export function readUsableViewport(){
  const vv=window.visualViewport;
  const doc=document.documentElement;
  const vvWidth=Number(vv?.width)||0;
  const vvHeight=Number(vv?.height)||0;
  const innerWidth=Number(window.innerWidth)||0;
  const innerHeight=Number(window.innerHeight)||0;
  const clientWidth=Number(doc?.clientWidth)||0;
  const clientHeight=Number(doc?.clientHeight)||0;
  // visualViewport is the best measure for actually usable browser space, but
  // some mobile browsers briefly report stale values while their chrome settles.
  // Keep both sets available and classify from the stable orientation media query.
  const width=Math.max(1,Math.round(vvWidth||innerWidth||clientWidth||1280));
  const height=Math.max(1,Math.round(vvHeight||innerHeight||clientHeight||720));
  return {width,height,innerWidth,innerHeight,clientWidth,clientHeight};
}

export function classifyViewport({width,height}){
  const portraitMq=window.matchMedia?.('(orientation: portrait)')?.matches;
  const landscapeMq=window.matchMedia?.('(orientation: landscape)')?.matches;
  const portrait=portraitMq ?? (height>width);
  const landscape=landscapeMq ?? !portrait;
  const shortSide=Math.min(width,height);
  const aspect=Math.max(width,height)/Math.max(1,shortSide);
  // Portrait phones are blocked by the rotation overlay. Use orientation + the
  // short side rather than zoom-sensitive visualViewport width alone.
  if(portrait && shortSide<=640)return 'phonePortrait';
  // Low-height landscape is the phone constraint. The 640px ceiling also keeps
  // Chrome zoom/browser-chrome variations in the same class while excluding
  // normal tablets/laptops. Aspect ratio avoids classifying nearly-square views.
  if(landscape && height<=640 && width>=540 && aspect>=1.28)return 'phoneLandscape';
  return 'large';
}

export function applyDeviceLayout(){
  const viewport=readUsableViewport();
  const kind=classifyViewport(viewport);
  const root=document.documentElement;
  Object.values(LAYOUT_CLASS).forEach(cls=>root.classList.remove(cls));
  root.classList.add(LAYOUT_CLASS[kind]);
  root.dataset.deviceLayout=kind;
  root.dataset.usableViewport=`${viewport.width}x${viewport.height}`;
  const overlay=document.getElementById('portraitRotateOverlay');
  if(overlay){
    const active=kind==='phonePortrait';
    overlay.hidden=!active;
    overlay.setAttribute('aria-hidden',String(!active));
  }
  if(kind!=='phoneLandscape')document.body?.classList.remove('phone-protocol-open');
  window.dispatchEvent(new CustomEvent('vsw-device-layout-change',{detail:{kind,...viewport}}));
  return {kind,...viewport};
}

export function wireDeviceLayout(){
  let raf=0;
  let settleTimers=[];
  const update=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(applyDeviceLayout)};
  const settle=()=>{
    update();
    settleTimers.forEach(clearTimeout);
    settleTimers=[50,180,450,900].map(ms=>setTimeout(update,ms));
  };
  settle();
  window.addEventListener('DOMContentLoaded',settle,{passive:true});
  window.addEventListener('load',settle,{passive:true});
  window.addEventListener('pageshow',settle,{passive:true});
  window.addEventListener('resize',settle,{passive:true});
  window.addEventListener('orientationchange',settle,{passive:true});
  window.visualViewport?.addEventListener('resize',settle,{passive:true});
  window.visualViewport?.addEventListener('scroll',update,{passive:true});
  const mqPortrait=window.matchMedia?.('(orientation: portrait)');
  mqPortrait?.addEventListener?.('change',settle);
  return ()=>{
    cancelAnimationFrame(raf);
    settleTimers.forEach(clearTimeout);
    window.removeEventListener('DOMContentLoaded',settle);
    window.removeEventListener('load',settle);
    window.removeEventListener('pageshow',settle);
    window.removeEventListener('resize',settle);
    window.removeEventListener('orientationchange',settle);
    window.visualViewport?.removeEventListener('resize',settle);
    window.visualViewport?.removeEventListener('scroll',update);
    mqPortrait?.removeEventListener?.('change',settle);
  };
}
