import fs from 'node:fs';
const need=(v,m)=>{if(!v)throw new Error(m)};
const dir='app-icons/techniques';
for(const name of ['aufschlag','zuspiel','angriff','annahme','abwehr','block']){
  const png=fs.readFileSync(`${dir}/${name}.png`);
  need(png.length>5000,`${name}: standalone pictogram file`);
  need(png[0]===0x89&&png.toString('ascii',1,4)==='PNG',`${name}: valid PNG`);
}
console.log('Preview2-r7 rebuild3 separate technique pictogram checks OK');
