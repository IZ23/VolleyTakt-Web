// VolleyTakt Live 0.4.0 RC2 - DOM-free keyboard/touch routing helpers.
import {COMMANDS} from './commands.js';

export function normalizeShortcutKey(key=''){
  const value=String(key||'');
  if(value.length===1&&/[a-z]/i.test(value))return value.toUpperCase();
  return value;
}

export function shortcutKeyLabel(key=''){
  return key===' ' ? 'Leertaste' : String(key||'');
}

export function shortcutActionForKey(shortcuts={},key=''){
  const normalized=normalizeShortcutKey(key);
  return Object.keys(shortcuts||{}).find(id=>shortcuts[id]===normalized)||'';
}

const ACTION_MAP=Object.freeze({
  'action.attack':'Angriff',
  'action.reception':'Annahme',
  'action.serve':'Aufschlag',
  'action.block':'Block',
  'action.defense':'Abwehr',
  'action.set':'Zuspiel'
});
const QUALITY_MAP=Object.freeze({
  'quality.equal':'=',
  'quality.minus':'-',
  'quality.bang':'!',
  'quality.slash':'/',
  'quality.zero':'0',
  'quality.plus':'+',
  'quality.hash':'#'
});

export function commandForShortcutAction(action=''){
  if(action==='cancel')return {command:COMMANDS.CANCEL};
  if(action.startsWith('position.')){
    const position=Number(action.split('.')[1]);
    if(Number.isInteger(position)&&position>=1&&position<=6)return {command:COMMANDS.SELECT_POSITION,position};
  }
  if(ACTION_MAP[action])return {command:COMMANDS.SELECT_ACTION,action:ACTION_MAP[action]};
  if(QUALITY_MAP[action])return {command:COMMANDS.SELECT_QUALITY,quality:QUALITY_MAP[action]};
  if(action==='rally.own')return {command:COMMANDS.AWARD_POINT_US};
  if(action==='rally.opponent')return {command:COMMANDS.AWARD_POINT_THEM};
  if(action==='substitution')return {command:COMMANDS.SUBSTITUTION};
  if(action==='libero')return {command:COMMANDS.LIBERO};
  if(action==='rotation')return {command:COMMANDS.ROTATE,direction:1};
  if(action==='undo')return {command:COMMANDS.UNDO};
  return null;
}

export function createEdgeSwipeRouter({edgePx=28,minDx=70,maxDy=80}={}){
  let start=null;
  return {
    pointerDown({pointerType='',clientX=0,clientY=0}={}){
      if(pointerType==='mouse'||clientX>edgePx){start=null;return false}
      start={x:Number(clientX)||0,y:Number(clientY)||0};
      return true;
    },
    pointerUp({clientX=0,clientY=0}={}){
      if(!start)return false;
      const dx=(Number(clientX)||0)-start.x;
      const dy=Math.abs((Number(clientY)||0)-start.y);
      start=null;
      return dx>minDx&&dy<maxDy;
    },
    reset(){start=null}
  };
}
