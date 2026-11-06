import * as T from './tower/vendor/three.js';
export const palettes=[
 {bg:'#192d3b',floor:'#354d60',accent:'#6cdbeb',edge:'#a7bfcc',width:31},
 {bg:'#2a2741',floor:'#a297b4',accent:'#ff84bb',edge:'#e0d7cb',width:32},
 {bg:'#211d3b',floor:'#44306b',accent:'#b3ff00',edge:'#aa92cf',width:31},
 {bg:'#142b35',floor:'#2d4653',accent:'#6cdbeb',edge:'#8baab1',width:31},
 {bg:'#302038',floor:'#61415d',accent:'#e0c68c',edge:'#be93aa',width:32}
];
export const eggs={phone:{title:'The underground is listening.',copy:'No dial tone. Just a familiar message: Hack the planet.',label:'Inspect the payphone',chapter:1},floppy:{title:'High capacity. Low expectations.',copy:'1.44 MB of pure ambition. We Stop Bad Code. Even on floppy disks.',label:'Inspect the stray floppy disk',chapter:3},gibson:{title:'You found the Gibson.',copy:'The terminal wakes up: “Unauthorized curiosity detected. Excellent.”',label:'Inspect the old maintenance terminal',chapter:4}};
export function createSummitScene(puzzle,onInvalidate=()=>{}){
 const chapter=puzzle.chapter,pal=palettes[chapter-1],group=new T.Group(),spots=[],signs=[],mechanisms={},markers={},pickups={},moving=[],panels=[],power=[];
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.75,...extra});
 const floor=mat(pal.floor),edge=mat(pal.edge),ink=mat('#182135'),ivory=mat('#ddd5bf'),violet=mat('#523aa4'),pink=mat('#ff2f8e',{emissive:'#ff2f8e',emissiveIntensity:.15}),cyan=mat('#6cdbeb',{emissive:'#6cdbeb',emissiveIntensity:.18}),lime=mat('#b3ff00',{emissive:'#b3ff00',emissiveIntensity:.18}),gold=mat('#d7b772'),glass=mat('#9dbed8',{transparent:true,opacity:.27,roughness:.2,depthWrite:false}),rubber=mat('#252834'),muted=mat('#595773');
 const light=new T.MeshBasicMaterial({color:pal.accent}),signBack=mat('#162236'),invisible=new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
 function mesh(geo,m,x=0,y=0,z=0,p=group){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
 const box=(w,h,d,x,y,z,m=floor,p=group)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
 const cyl=(r,h,x,y,z,m=ink,p=group,n=32)=>mesh(new T.CylinderGeometry(r,r,h,n),m,x,y,z,p);
 function line(points,m=cyan,r=.025,p=group){const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)),false,'centripetal');return mesh(new T.TubeGeometry(curve,Math.max(4,points.length*8),r,6,false),m,0,0,0,p)}
 function ring(x,y,z,r=.35,m=light,p=group){const o=mesh(new T.TorusGeometry(r,.025,6,32),m,x,y,z,p);o.rotation.x=-Math.PI/2;return o}
 function hit(x,y,z,data,p=group,w=1.25,h=.35,d=1.25){const o=box(w,h,d,x,y,z,invisible,p);o.castShadow=false;o.receiveShadow=false;o.userData=data;spots.push(o);return o}
 function sign(lines,x,y,z,w=4.6,{color=pal.accent,small=false,post=true,logo=false,angle=.56}={}){
  const g=new T.Group();g.position.set(x,y,z);g.rotation.y=angle;group.add(g);const h=logo?1.35:lines.length>1?1.25:.78;box(w+.16,h+.15,.14,0,0,0,ink,g);box(.09,h,.025,-w/2+.07,0,.085,new T.MeshBasicMaterial({color}),g);
  if(post)for(const dx of [-w*.38,w*.38])box(.065,Math.max(.2,y-.8-h/2),.065,dx,-(y-.8+h/2)/2,-.07,ink,g);
  if(logo){const tex=new T.TextureLoader().load('assets/crash-override-logo.avif',onInvalidate);tex.colorSpace=T.SRGBColorSpace;const logoMesh=mesh(new T.PlaneGeometry(w*.88,w*.88*.08),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}),0,.24,.085,g);logoMesh.castShadow=false;logoMesh.receiveShadow=false;lines=['We Stop Bad Code.'];}
  const c=document.createElement('canvas');c.width=1024;c.height=logo?180:lines.length>1?320:180;const ctx=c.getContext('2d');ctx.fillStyle='#f3ede4';ctx.textAlign='center';ctx.textBaseline='middle';lines.forEach((t,i)=>{let size=lines.length>1?128:140;ctx.font=`bold ${size}px ${small?'Courier New':'Arial'}`;while(ctx.measureText(t).width>900){size-=2;ctx.font=`bold ${size}px ${small?'Courier New':'Arial'}`}ctx.fillStyle=i===1?color:'#f3ede4';ctx.fillText(t,512,(i+.5)*c.height/lines.length)});const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const text=mesh(new T.PlaneGeometry(w*.93,logo?.38:h*.87),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide}),0,logo?-.32:0,.09,g);text.castShadow=false;signs.push({text:logo?'Crash Override · We Stop Bad Code.':lines.join(' · '),object:g});return g;
 }
 // Small official brand details, placed along the edges, away from walkways.
 function brandDetails(x,z,fx,fz){
  const flag=new T.Group();flag.position.set(x,1,z);flag.rotation.y=.56;group.add(flag);
  cyl(.045,2.8,0,1.4,0,ivory,flag,12);mesh(new T.SphereGeometry(.08,12,8),gold,0,2.83,0,flag);
  const flagGeo=new T.PlaneGeometry(1.6,1.6,16,8),pos=flagGeo.attributes.position;
  for(let i=0;i<pos.count;i++){const u=(pos.getX(i)+.8)/1.6;pos.setZ(i,Math.sin(u*Math.PI*2-.3)*.16*u);pos.setY(i,pos.getY(i)-u*.18)}
  flagGeo.computeVertexNormals();
  const mark=new T.TextureLoader().load('assets/crash-override-mark.svg',onInvalidate);mark.colorSpace=T.SRGBColorSpace;
  const cloth=mesh(flagGeo,new T.MeshStandardMaterial({color:'#523aa4',roughness:1,side:T.DoubleSide}),.83,1.98,0,flag);
  const emblem=mesh(flagGeo,new T.MeshBasicMaterial({map:mark,transparent:true,depthWrite:false}),.83,1.98,.012,flag);emblem.castShadow=false;
  flag.name='Crash Override flag';
  const fence=new T.Group();fence.position.set(fx,1,fz);group.add(fence);
  for(const dx of [-1.65,1.65]){box(.075,.95,.075,dx,.475,0,ivory,fence);mesh(new T.SphereGeometry(.065,10,8),gold,dx,.98,0,fence)}
  for(const y of [.22,.78])box(3.3,.045,.045,0,y,0,ivory,fence);
  box(2.9,.55,.07,0,.52,.03,ink,fence);
  const wordmark=new T.TextureLoader().load('assets/crash-override-logo.avif',onInvalidate);wordmark.colorSpace=T.SRGBColorSpace;
  const label=mesh(new T.PlaneGeometry(2.55,.204),new T.MeshBasicMaterial({map:wordmark,transparent:true,depthWrite:false}),0,.52,.071,fence);label.castShadow=false;
  fence.name='Crash Override fence';signs.push({text:'Crash Override flag and fence',object:fence});
 }
 function crt(x,y,z,w=1.5,content='READY',accent='#b3ff00',p=group){const g=new T.Group();g.position.set(x,y,z);p.add(g);box(w,w*.69,w*.6,0,w*.48,0,ivory,g);box(w*.84,w*.52,.05,0,w*.48,w*.31,ink,g);const c=document.createElement('canvas');c.width=512;c.height=300;const ctx=c.getContext('2d');ctx.fillStyle='#101b25';ctx.fillRect(0,0,512,300);ctx.fillStyle=accent;ctx.font='bold 42px Courier New';const lines=content.split('|');lines.forEach((l,i)=>ctx.fillText(l,26,64+i*60));for(let i=0;i<300;i+=5){ctx.fillStyle='#00000022';ctx.fillRect(0,i,512,1)}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;mesh(new T.PlaneGeometry(w*.78,w*.46),new T.MeshBasicMaterial({map:tex}),0,w*.48,w*.34,g);box(w*.6,.14,w*.35,0,.05,0,rubber,g);box(w*.85,.09,w*.28,0,-.06,w*.56,ivory,g);for(let i=0;i<6;i++)for(let j=0;j<3;j++)box(w*.09,.02,w*.055,-w*.33+i*w*.13,0,w*.48+j*w*.075,muted,g);return g}
 function floppy(x,y,z,color=violet,scale=1,egg=null){const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(scale);group.add(g);box(.55,.57,.08,0,0,0,color,g);box(.34,.2,.09,0,.13,.015,ivory,g);box(.4,.19,.09,0,-.13,.015,ink,g);box(.1,.13,.1,.08,-.13,.025,edge,g);g.rotation.y=.55;if(egg)hit(0,0,0,{egg},g,.85,.85,.5);return g}
 function mechanism(id,caption){const n=puzzle.point(id);const g=crt(n.x,n.y+.1,n.z-.55,.7,caption||'USE',pal.accent);mechanisms[id]=g;hit(n.x,n.y+.68,n.z-.3,{act:id},group,1,1,1);return g}
 function plaque(lines,x,y,z,w=3){return sign(lines,x,y,z,w,{small:true,post:false})}
 function platform(w,d,x,z,y=1){box(w,y-.1,d,x,(y-.1)/2,z,floor);box(w+.12,.1,d+.12,x,y-.05,z,edge)}
 const paths=new T.Group();group.add(paths);
 function removePaths(){while(paths.children.length){const o=paths.children.pop();o.parent=null;o.geometry?.dispose()}}
 function pathSegment(a,b,active){const va=new T.Vector3(a.x,a.y,a.z),vb=new T.Vector3(b.x,b.y,b.z),delta=vb.clone().sub(va),distance=delta.length(),mid=va.clone().add(vb).multiplyScalar(.5),m=active?edge:ink;
  if(Math.abs(a.y-b.y)>.2){const steps=Math.max(3,Math.ceil(Math.abs(a.y-b.y)/.18));for(let i=0;i<steps;i++){const t=(i+.5)/steps,y=T.MathUtils.lerp(a.y,b.y,t);const o=box(1.15,.19,distance/steps+.04,T.MathUtils.lerp(a.x,b.x,t),y-.095,T.MathUtils.lerp(a.z,b.z,t),m,paths);o.rotation.y=Math.atan2(b.x-a.x,b.z-a.z)}}else{const o=box(1.05,.1,distance,mid.x,mid.y-.05,mid.z,m,paths);o.rotation.y=Math.atan2(delta.x,delta.z);const stripe=box(.075,.012,distance-.1,mid.x,mid.y+.009,mid.z,active?light:muted,paths);stripe.rotation.y=o.rotation.y;}
 }
 function pathsSync(){removePaths();const active=puzzle.edges().map(e=>[...e].sort().join('/'));for(const [a,b]of puzzle.allEdges()){if(chapter===1&&[a,b].includes('tram'))continue;const connected=active.includes([a,b].sort().join('/')),points=puzzle.pathPoints(a,b);for(let i=1;i<points.length;i++)pathSegment(points[i-1],points[i],connected)}}
 let tram=null,tramPosition=null,tramTarget=null,settle=0,gatePanels=[],curtains=[],coreDoor=null;
 if(chapter===1){
  platform(17,14,0,1,1);box(17,.04,4.8,0,1.01,1,mat('#293848'));for(let i=0;i<10;i++)box(.5,.025,.08,-7+i*1.5,1.045,6.7,ivory);
  // The tram and its two actual destinations replace every island/bridge from the voyage.
  const origin={x:-2,y:1,z:1};for(const dest of [{x:4,y:1,z:4},{x:4,y:1,z:-1}]){const dx=dest.x-origin.x,dz=dest.z-origin.z,len=Math.hypot(dx,dz);for(const s of [-.4,.4]){const o=box(.06,.035,len,1+s*dz/len,1.03,(1+dest.z)/2-s*dx/len,gold);o.rotation.y=Math.atan2(dx,dz)}for(let i=0;i<12;i++){const t=i/11,o=box(1.05,.035,.1,origin.x+dx*t,1.02,origin.z+dz*t,rubber);o.rotation.y=Math.atan2(dx,dz)}}
  tram=new T.Group();group.add(tram);tram.position.set(-2,1,1);tramPosition=tram.position.clone();tramTarget=tram.position.clone();box(1.4,.2,2.2,0,-.02,0,ivory,tram);for(const x of [-.62,.62])for(const z of [-.8,.8]){const wheel=cyl(.2,.1,x,-.2,z,rubber,tram,16);wheel.rotation.z=Math.PI/2}for(const x of [-.64,.64]){box(.1,.58,2.1,x,.35,0,violet,tram);box(.03,.48,1.4,x,.85,0,glass,tram)}for(const z of [-1,1]){box(1.4,.45,.08,0,.35,z,violet,tram);box(1.25,.5,.03,0,.85,z,glass,tram)}box(1.5,.08,.32,0,1.17,-.9,ivory,tram);box(.35,.15,.22,0,.7,-.7,cyan,tram);hit(0,.75,0,{act:'tram'},tram,1.5,1.7,2.3);
  for(const [x,z,h]of [[-7,-4,3.6],[-3,-5,4.5],[1,-6,2.7],[6,6,2.3]]){box(2.1,h,2,x,1+h/2,z,mat('#476279'));box(2.25,.14,2.1,x,1+h,z,ink);for(let i=0;i<3;i++)for(let j=0;j<3;j++)box(.25,.36,.035,x-.65+j*.65,1.5+i*.8,z+1.02,(i+j)%2?cyan:muted)}
  for(const [x,z,h]of [[-5,-9,4],[0,-10,5],[4,-10,3.5]]){const m=mesh(new T.ConeGeometry(2,h,4),mat('#7a91a9'),x,h/2,z);m.rotation.y=.4;const cap=mesh(new T.ConeGeometry(.65,h*.32,4),ivory,x,h*.84,z);cap.rotation.y=.4}
  sign(['Salt Lake City','Downtown · Tram stop'],-4,6.1,-4.2,6);sign(['Salt Palace','Convention stop'],5.8,3.3,-3,3.6);plaque(['City loop'],5.5,2.1,5.4,2.4);
  box(1.4,.8,1,-6,1.4,.2,violet);pickups.disk=floppy(-5.65,2,.5,pink,.65);plaque(['Disk kiosk'],-6,2.7,0,2.3);mechanism('signal','TRACK');
  // Optional payphone: deliberately separate from the route controls.
  box(.8,2.1,.6,-7,2.05,4,ink);box(.65,1.1,.08,-7,2.4,4.35,cyan);box(.17,.55,.12,-7.18,2.4,4.43,rubber);line([[-7.18,2.18,4.46],[-7.1,1.94,4.5],[-6.85,2.2,4.46]],ink,.025);hit(-7,2.3,4.4,{egg:'phone'},group,1.2,1.5,.8);plaque(['Payphone'],-7,3.6,4,2.1);
 }
 if(chapter===2){
  platform(17,14,0,0,1);box(6.6,.2,8,4.3,2.9,-.5,edge);box(3,.2,2.8,.3,2.9,-3,edge);for(const x of [1.2,7.3])for(const z of [-4,3])box(.18,2,.18,x,2,z,ivory);for(const x of [-8,8])for(let z=-6;z<=5;z+=2){box(.13,5,.13,x,3.5,z,ivory);const pane=box(.025,4.5,1.8,x,3.4,z,glass);pane.castShadow=false}for(let x=-8;x<=8;x+=2){box(.12,5,.12,x,3.5,-6.4,ivory);box(1.9,4.4,.035,x,3.4,-6.4,glass)}
  for(let i=0;i<9;i++)box(.12,.16,12,-8+i*2,6,-.5,edge);box(17,.22,1.4,0,6,-6,ivory);
  sign(['Salt Palace','Registration'],0,6.6,-5.5,6.8,{color:'#ff84bb'});sign(['KubeCon','Welcome, hackers.'],-5,4.5,-1,3.8);plaque(['Expo entrance'],5.2,4.7,-4.1,3.2);
  box(2,.9,1,-6,1.45,-1.7,violet);box(2.1,.12,1.1,-6,1.95,-1.7,ivory);crt(-6,1.1,-4.5,.9,'BADGE|PRINT');for(let i=0;i<5;i++){cyl(.035,.8,-7.2+i*.75,1.4,3.8,gold);if(i<4)line([[-7.2+i*.75,1.75,3.8],[-6.85+i*.75,1.6,3.8],[-6.45+i*.75,1.75,3.8]],pink,.035)}
  mechanism('doors','DOORS');mechanism('gate','GATE');mechanism('scanner','SCAN');hit(-6,1.7,-4.4,{act:'printer'},group,1.4,1.4,1.2);
  for(const [a,b]of [['doors','registration'],['doors','gallery'],['gate','scanner'],['gate','exit']]){const na=puzzle.point(a),nb=puzzle.point(b),g=new T.Group();g.position.set((na.x+nb.x)/2,(na.y+nb.y)/2,(na.z+nb.z)/2);g.rotation.y=Math.atan2(nb.x-na.x,nb.z-na.z);group.add(g);for(const x of [-.7,.7])box(.08,1.8,.12,x,.9,0,ink,g);const door=box(1.3,1.6,.08,0,.85,0,glass,g);box(1.2,.08,.1,0,.65,.06,pink,door);gatePanels.push({a,b,door})}
 }
 if(chapter===3){
  platform(17,14,0,0,.72);box(16.7,.07,13.7,0,.8,0,mat('#382457'));for(let i=0;i<17;i++){line([[-8+i,.86,6.8],[-8+i,.86,5.7],[-7.5+i,.86,5.2]],i%2?gold:violet,.02)}for(const [x,z,w,d]of [[-6,4,2.8,2],[-6,-3,3,3],[4,3,3,3],[3,-3,3,3],[-2,1,3.8,3]])platform(w,d,x,z,x===-6&&z===4?1:1.5);
  crt(-2,1.6,-1.2,4.2,'SOURCE|BUILD|RUNTIME','#b3ff00');hit(-2,3,0,{act:'terminal'},group,4,3,1.2);mechanisms.terminal=group;
  sign([],0,7,-4.4,6.6,{logo:true});sign(['Expo floor','Follow the wire'],-5.2,4.9,2,4.3,{color:'#b3ff00'});plaque(['Source booth'],-7.1,3,-1.9,3.1);plaque(['Build booth'],4,3.2,3.2,3);plaque(['Runtime bay'],3.4,3,-3.6,3);
  for(const [x,z]of [[-7,-5],[6,-2],[0,6],[-7,1]]){box(1,.35,1.5,x,1,z,ink);for(let i=0;i<6;i++){box(.3,.08,.06,x-.6,1.1,z-.6+i*.24,gold);box(.3,.08,.06,x+.6,1.1,z-.6+i*.24,gold)}}
  pickups.source=floppy(-6,2.1,-3,lime);pickups.seal=floppy(4,2.1,3,cyan);floppy(6.6,1.5,5,pink,.85,'floppy');line([[-1,1.1,2],[-.5,1.1,4],[2,1.1,4.5],[3,1.1,3]],pink,.08);line([[-3,1.1,-2],[-4,1.1,-4],[-6,1.1,-4]],cyan,.08);
 }
 if(chapter===4){
  platform(17,14,0,0,1);for(let i=0;i<9;i++)box(.025,.02,14,-8+i*2,1.01,0,muted);for(let i=0;i<8;i++)box(17,.02,.025,0,1.01,-7+i*2,muted);
  for(const x of [-7,-3.3,3.3,7])for(const z of [-5,1]){if(Math.abs(x)<4&&z===1)continue;box(1.15,3.8,1.4,x,2.9,z,ink);box(1.05,3.55,.05,x,2.9,z+.73,glass);for(let i=0;i<9;i++){box(.92,.25,.06,x,1.35+i*.36,z+.78,muted);box(.07,.05,.08,x-.3,1.35+i*.36,z+.82,(i%3)?cyan:lime)}}
  box(3.5,3.1,2.2,0,2.55,-4.1,ink);box(3.2,2.8,.08,0,2.6,-2.97,violet);for(let i=0;i<3;i++){const rail=box(.55,2.25,.12,-1+i,2.65,-2.87,cyan);power.push(rail);plaque([String.fromCharCode(65+i)],-1+i,4,-2.85,.65)}
  sign(['Data center','Backstage access'],0,6.4,-5.1,6.3,{color:'#6cdbeb'});sign(['We Stop Bad Code.'],4.6,4.5,3,4.9,{color:'#b3ff00'});
  for(const id of ['a','b','c','core'])mechanism(id,id==='core'?'ISOLATE':`RAIL ${id.toUpperCase()}`);plaque(['A flips A + B'],-5,2.6,.3,2.6);plaque(['B flips B + C'],0,2.6,4.6,2.6);plaque(['C flips C'],7.2,3.1,3.2,2.6);
  coreDoor=box(1.3,1.8,.1,0,1.9,.8,pink);crt(-6.3,1.5,-2.6,.9,'THE|GIBSON','#b3ff00');hit(-6.3,2,-2.2,{egg:'gibson'},group,1.3,1.5,1.2);
  line([[-5,1.1,0],[-5,1.1,-1.6],[-1,1.1,-1.6],[-1,3,-2.8]],cyan,.04);line([[0,1.1,4],[1.8,1.1,4],[1.8,1.1,-1.6],[0,1.1,-1.6],[0,3,-2.8]],pink,.04);line([[5,1.1,0],[5,1.1,-1.6],[1,1.1,-1.6],[1,3,-2.8]],lime,.04);
 }
 if(chapter===5){
  platform(17,15,0,0,1);const carpet=mat('#64354f');box(16.8,.03,14.8,0,1.02,0,carpet);platform(9,4.3,0,-5.4,2.4);box(10,.3,.3,0,6.7,-7.5,ink);
  for(const x of [-4.8,4.8])box(.25,5.7,.25,x,3.8,-7.5,ink);box(9.2,3.1,.25,0,5,-7.45,violet);sign([],0,5.7,-7.2,7.4,{logo:true,post:false,angle:0});sign(['Keynote auditorium'],-5.5,3.8,5.7,4.4);
  for(const x of [-4,3]){box(.16,3.6,.16,x,1.8,-3,ink);box(.16,.16,3,x,3.35,-3,ink)}box(7.4,.18,1,-.5,3.35,-3,muted);for(let i=0;i<12;i++){box(.045,.05,.85,-4+i*.62,3.49,-3,gold);const lamp=mesh(new T.CylinderGeometry(.16,.22,.35,12),ink,-3.5+i*.55,3.05,-3);lamp.rotation.x=.45;box(.2,.04,.1,-3.5+i*.55,2.85,-2.94,light)}
  for(let row=0;row<4;row++)for(let i=0;i<7;i++){const x=-2.8+i*.8,z=1.9+row*1.05,y=1.1+row*.1;box(.55,.18,.55,x,y+.15,z,violet);box(.55,.7,.12,x,y+.5,z+.25,mat('#8f4b72'));cyl(.09,.35,x,y-.04,z,ink);if((row+i)%3){cyl(.12,.37,x,y+.48,z,ink);mesh(new T.SphereGeometry(.13,12,10),ivory,x,y+.79,z)}}
  for(const side of [-1,1]){const g=new T.Group();g.position.set(side*2.15,4.45,-4.65);group.add(g);for(let i=0;i<10;i++)box(.48,4.1,.18,-2.1+i*.46,0,Math.sin(i)*.09,mat(i%2?'#9f376e':'#74305d'),g);curtains.push(g)}
  box(.9,.9,.8,.7,2.85,-6.1,ink);box(1.1,.12,1,.7,3.35,-6.1,ivory);crt(-5,1.2,.3,.9,'HOUSE|SPOT|SHOW');hit(-5,1.8,.5,{act:'desk'},group,1.3,1.5,1.2);mechanism('house','1 HOUSE');mechanism('spot','2 SPOT');hit(0,3,-6,{act:'podium'},group,1.5,2,1.5);
  crt(4,1.2,3.2,1,'CUE|DISK');pickups.cueDisk=floppy(4.5,1.7,4.1,gold,.8);plaque(['Show desk','3 · Show'],-5,3.1,1,2.9);plaque(['1 · House'],-4.3,5.2,-3,2.5);plaque(['2 · Spotlight'],5.5,4.8,-2.6,3);
 }
 const brandPositions=[[-8,6.5,2,7.6],[-7.8,5.9,3,6.8],[-7.8,6,3,6.8],[-7.8,5.7,3,6.8],[-7.8,6.5,3.5,7.3]];
 brandDetails(...brandPositions[chapter-1]);
 for(const id of puzzle.ids){if(id==='tram')continue;const n=puzzle.point(id),m=ring(n.x,n.y+.04,n.z,.32);m.userData.go=id;spots.push(m);markers[id]=m;hit(n.x,n.y+.05,n.z,{go:id},group,.95,.15,.95)}
 let lastSignature='',oldDock=0,current=puzzle;
 function sync(next,instant=false){puzzle=current=next;const signature=next.key();if(signature!==lastSignature){lastSignature=signature;pathsSync();settle=instant?0:.38;}if(tram){tramTarget.set(...[next.point('tram').x,1,next.point('tram').z]);if(instant)tram.position.copy(tramTarget);if(oldDock!==next.s.dock){settle=instant?0:1;oldDock=next.s.dock;}}
  for(const g of gatePanels){const active=next.edges().some(e=>[...e].sort().join('/')===[g.a,g.b].sort().join('/'));g.target=active?-.75:.85;if(instant)g.door.position.y=g.target}
  if(coreDoor){coreDoor.visible=!next.s.rails.every(Boolean);power.forEach((o,i)=>o.material=next.s.rails[i]?cyan:muted)}
  if(pickups.disk)pickups.disk.visible=!next.s.disk;if(pickups.source)pickups.source.visible=!next.s.source;if(pickups.seal)pickups.seal.visible=!next.s.seal;if(pickups.cueDisk)pickups.cueDisk.visible=!next.s.cueDisk;
  if(instant)curtains.forEach((g,i)=>g.position.x=(i?1:-1)*(next.s.curtain?6.3:2.15));
 }
 function update(dt,instant=false){settle=Math.max(0,settle-dt);if(tram){const delta=tramTarget.clone().sub(tram.position),d=delta.length();if(instant||d<.035)tram.position.copy(tramTarget);else {tram.rotation.y=Math.atan2(delta.x,delta.z);tram.position.addScaledVector(delta.normalize(),Math.min(d,dt*3.5))}}for(const p of gatePanels)p.door.position.y+=(p.target-p.door.position.y)*(instant?1:Math.min(1,dt*8));curtains.forEach((g,i)=>g.position.x+=((i?1:-1)*(current.s.curtain?6.3:2.15)-g.position.x)*(instant?1:Math.min(1,dt*5)));}
 function busy(){return settle>0||!!tram&&tram.position.distanceTo(tramTarget)>.04||curtains.some((g,i)=>Math.abs(g.position.x-(i?1:-1)*(current.s.curtain?6.3:2.15))>.04)}
 return {group,spots,signs,sync,update,busy,palette:pal,get carrier(){return tram?.position},eggIds:Object.entries(eggs).filter(([,e])=>e.chapter===chapter).map(([id])=>id)};
}
