import {localeDe} from './locales/de.js';
import {MESSAGES_DE,MESSAGES_EN} from './locales/messages.js';
import {LEGACY_KEY_BY_DE} from './locales/legacy-messages.js';

let language='de';
let observer=null;
let busy=false;
const originals=new WeakMap();
const rendered=new WeakMap();
const renderedAttrs=new WeakMap();
const attrs=['title','aria-label','placeholder'];

function preserveWhitespace(source,replacement){
 const lead=(source.match(/^\s*/)||[''])[0],trail=(source.match(/\s*$/)||[''])[0];
 return lead+replacement+trail;
}
function interpolate(template,params={}){return String(template??'').replace(/\{([A-Za-z0-9_]+)\}/g,(_,key)=>Object.prototype.hasOwnProperty.call(params,key)?String(params[key]):`{${key}}`)}
export function t(key,params={},lang=language){
 const catalogue=lang==='en'?MESSAGES_EN:MESSAGES_DE;
 const fallback=MESSAGES_DE[key]??key;
 return interpolate(catalogue[key]??fallback,params)
}
export function tr(value,lang=language){
 if(value==null||lang==='de')return String(value??'');
 const source=String(value),trim=source.trim();if(!trim)return source;
 const legacyKey=LEGACY_KEY_BY_DE[trim];
 if(legacyKey)return preserveWhitespace(source,t(legacyKey,{},lang));
 const dynamic=[
  [/^Du verwendest (.+)\. Die Kamerakopplung benötigt einen sicheren HTTPS-Kontext\. Öffne VolleyTaktLive über HTTPS\.$/,m=>`You are using ${m[1]}. Camera pairing requires a secure HTTPS context. Open VolleyTakt Live via HTTPS.`],
  [/^Du verwendest (.+) unter iOS\/iPadOS\. Web Bluetooth steht dort derzeit nicht zur Verfügung; ein Browserwechsel aktiviert die Kamerakopplung nicht\. Die lokale Zeitquelle bleibt nutzbar\.$/,m=>`You are using ${m[1]} on iOS/iPadOS. Web Bluetooth is currently unavailable there; switching browsers does not enable camera pairing. The local time source remains usable.`],
  [/^Du verwendest (.+) unter Android; daher steht die Kamera-Synchronisation über Web Bluetooth hier nicht zur Verfügung\. Verwende Google Chrome; weitere Chromium-Browser können je nach Android-Version ebenfalls funktionieren\.$/,m=>`You are using ${m[1]} on Android; camera synchronization via Web Bluetooth is not available here. Use Google Chrome; other Chromium browsers may also work depending on the Android version.`],
  [/^Du verwendest (.+) unter (Windows|macOS); daher steht die Kamera-Synchronisation über Web Bluetooth hier nicht zur Verfügung\. Verwende Google Chrome, Microsoft Edge oder Opera\.$/,m=>`You are using ${m[1]} on ${m[2]}; camera synchronization via Web Bluetooth is not available here. Use Google Chrome, Microsoft Edge or Opera.`],
  [/^Du verwendest (.+) unter Linux\. Web Bluetooth ist in diesem Browser nicht verfügbar\. Verwende einen Chromium-basierten Browser mit aktivem Web Bluetooth; die Unterstützung ist unter Linux systemabhängig\.$/,m=>`You are using ${m[1]} on Linux. Web Bluetooth is unavailable in this browser. Use a Chromium-based browser with Web Bluetooth enabled; support on Linux depends on the system.`],
  [/^Du verwendest (.+)\. Dieser Browser stellt Web Bluetooth nicht bereit\. Verwende einen Web-Bluetooth-fähigen Chromium-Browser; die lokale Zeitquelle bleibt verfügbar\.$/,m=>`You are using ${m[1]}. This browser does not provide Web Bluetooth. Use a Web-Bluetooth-capable Chromium browser; the local time source remains available.`],
  [/^(\d+) CSV-Einträge geladen; Spielzustand rekonstruiert\.$/,m=>`${m[1]} CSV entries loaded; match state reconstructed.`],
  [/^(\d+) Spielerinnen übernommen\.$/,m=>`${m[1]} players applied.`],
  [/^Session wiederaufgenommen · Sätze (.+) · (.+) · (.+)\.$/,m=>`Session resumed · Sets ${m[1]} · ${m[2]} · ${m[3]}.`],
  [/^(Gegner|Eigenes Team) aktiv · (.+) · (detailliert|kompakt)\.$/,m=>`${m[1]==='Gegner'?'Opponent':'Own team'} active · ${m[2]} · ${m[3]==='detailliert'?'detailed':'compact'}.`],
  [/^(Gegner|Eigenes Team): (detaillierte|kompakte) Bewertung\.$/,m=>`${m[1]==='Gegner'?'Opponent':'Own team'}: ${m[2]==='detaillierte'?'detailed':'compact'} rating.`],
  [/^Doppelte Belegung: (.+)$/,m=>`Duplicate assignment: ${m[1]}`],
  [/^Bewertung (.+) ist im aktuellen Profil nicht verfügbar\.$/,m=>`Rating ${m[1]} is not available in the current profile.`],
  [/^DJI: (.+)$/,m=>`DJI: ${m[1]}`]
 ];
 for(const [re,fn] of dynamic){const m=trim.match(re);if(m)return preserveWhitespace(source,fn(m));}
 // RC2: all formerly exact legacy translations resolve through stable keys.
 // Unknown strings remain intact instead of using unsafe substring translation.
 return source;
}
function translateTextNode(node,external=false){
 if(external&&rendered.has(node)&&node.nodeValue!==rendered.get(node))originals.set(node,node.nodeValue);
 else if(!originals.has(node))originals.set(node,node.nodeValue);
 const original=originals.get(node);
 const target=language==='de'?original:tr(original,'en');
 rendered.set(node,target);
 if(node.nodeValue!==target)node.nodeValue=target;
}
function attrKey(a){return `i18nOriginal${a.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()).replace(/^./,c=>c.toUpperCase())}`}
function translateElement(el,changedAttr=''){
 if(!(el instanceof Element)||el.closest('[data-i18n-skip]'))return;
 let last=renderedAttrs.get(el)||{};
 for(const a of attrs){if(!el.hasAttribute(a))continue;const key=attrKey(a),current=el.getAttribute(a);if(changedAttr===a&&last[a]!==undefined&&current!==last[a])el.dataset[key]=current;else if(!(key in el.dataset))el.dataset[key]=current;const original=el.dataset[key];const target=language==='de'?original:tr(original,'en');last[a]=target;if(current!==target)el.setAttribute(a,target)}
 renderedAttrs.set(el,last);
}
function walk(root=document){
 const doc=root.nodeType===9?root:root.ownerDocument||document;
 const walker=doc.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
 let n=root;if(n.nodeType===Node.TEXT_NODE)translateTextNode(n);else if(n.nodeType===Node.ELEMENT_NODE)translateElement(n);
 while((n=walker.nextNode())){if(n.nodeType===Node.TEXT_NODE)translateTextNode(n);else translateElement(n)}
}
export function localizeDocument(root=document){if(busy)return;busy=true;try{walk(root);document.documentElement.lang=language==='en'?'en':'de'}finally{busy=false}}
export function setLanguage(lang){language=lang==='en'?'en':'de';localStorage.setItem('volleytakt-live-ui-language',language);localizeDocument();window.dispatchEvent(new CustomEvent('volleytakt-language-change',{detail:{language}}));return language}
export function getLanguage(){return language}
export function initI18n(lang='de'){
 language=lang==='en'?'en':'de';document.documentElement.lang=language;
 if(!observer){observer=new MutationObserver(ms=>{if(busy)return;busy=true;try{for(const m of ms){if(m.type==='characterData'){translateTextNode(m.target,true);continue}if(m.type==='attributes'){translateElement(m.target,m.attributeName);continue}for(const n of m.addedNodes){if(n.nodeType===Node.TEXT_NODE)translateTextNode(n);else if(n.nodeType===Node.ELEMENT_NODE)walk(n)}}}finally{busy=false}});observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrs});}
 localizeDocument();
 // Browser dialogs are outside the DOM; translate their messages too.
 if(!window.__VT_I18N_DIALOGS__){window.__VT_I18N_DIALOGS__=true;const a=window.alert.bind(window),c=window.confirm.bind(window),p=window.prompt.bind(window);window.alert=v=>a(tr(v));window.confirm=v=>c(tr(v));window.prompt=(v,d)=>p(tr(v),d)}
 return language;
}
export const locales=[localeDe,{code:'en',name:'English'}];
