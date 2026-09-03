import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const need=(x,m)=>{if(!x)throw new Error(m)};
need(app.includes("TECHNIQUE_ICON_REV='0.4.0-rc3-pictograms'"),'icon asset revision missing');
need(app.includes('src="${ACTION_ICON_FILES[a]}?v=${TECHNIQUE_ICON_REV}"'),'buttons do not use revised icon files');
need(css.includes('flex-direction:row!important'),'horizontal button icon/label layout missing');
need(css.includes('text-align:left!important'),'technique label not placed beside pictogram');
for(const n of ['aufschlag','zuspiel','angriff','annahme','abwehr','block']){
  const png=fs.readFileSync(new URL(`../app-icons/techniques/${n}.png`,import.meta.url));
  need(png.length>5000,`${n} PNG unexpectedly small`);
  need(png[0]===0x89&&png.toString('ascii',1,4)==='PNG',`${n} PNG invalid`);
  need(sw.includes(`./app-icons/techniques/${n}.png?v=0.4.0-rc3-pictograms`),`${n} not cached with revised URL`);
}
console.log('Preview2-r7 rebuild3 pictogram application checks OK');
