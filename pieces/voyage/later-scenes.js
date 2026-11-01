import * as T from '../tower/vendor/three.js';
import {chapters} from './later-puzzles.mjs';
export function createChapterScene(chapter){
 const config=chapters[chapter],group=new T.Group();group.position.x=config.offset;
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.86,...extra});
 const stone=material('#dedfd2'),timber=material('#bd9b70'),dark=material('#314b53'),green=material('#6d9684'),gold=material('#c7a16b'),warm=material('#f2d28b',{emissive:'#e0aa59',emissiveIntensity:.7}),accent=material(chapter===3?'#91b5a2':chapter===4?'#a4b6bd':'#607e8d');
 const spots=[],markers={},artifacts={},mechanisms={},bridges=[];
 function mesh(geometry,mat,x=0,y=0,z=0,parent=group){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const box=(w,h,d,x,y,z,mat=stone,parent=group)=>mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,parent);
 const cylinder=(r,h,x,y,z,mat=stone,parent=group)=>mesh(new T.CylinderGeometry(r,r,h,48),mat,x,y,z,parent);
 function ring(r,x,y,z,mat=gold,parent=group){const m=mesh(new T.TorusGeometry(r,.025,8,48),mat,x,y,z,parent);m.rotation.x=-Math.PI/2;return m;}
 function hitSphere(x,y,z,data,parent=group,r=.48){const h=mesh(new T.SphereGeometry(r,16,12),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),x,y,z,parent);h.userData=data;h.castShadow=false;spots.push(h);return h;}
 function shrub(x,y,z){cylinder(.18,.16,x,y+.08,z,timber);for(let i=0;i<3;i++){const leaf=mesh(new T.IcosahedronGeometry(.28,1),green,x+Math.sin(i*2)*.17,y+.46+i*.08,z+Math.cos(i*2)*.12);leaf.scale.y=1.25;}}
 function arch(x,y,z,width=1.9){const shape=new T.Shape(),outer=width/2,inner=outer-.25;shape.moveTo(-outer,0);shape.lineTo(-outer,2);shape.absarc(0,2,outer,Math.PI,0,true);shape.lineTo(outer,0);shape.lineTo(inner,0);shape.lineTo(inner,2);shape.absarc(0,2,inner,0,Math.PI,false);shape.lineTo(-inner,0);shape.closePath();return mesh(new T.ExtrudeGeometry(shape,{depth:.35,bevelEnabled:false,curveSegments:32}),stone,x,y,z);}
 for(const [id,[x,y,z]]of Object.entries(config.nodes)){if(id==='boat')continue;const island=new T.Group();group.add(island);island.position.set(x,0,z);if(id!=='lift'){const radius=id==='goal'?1.45:id==='dock'?1.25:1.3;cylinder(radius+.1,.22,0,.06,0,dark,island);cylinder(radius,y-.15,0,(y-.15)/2,0,accent,island);cylinder(radius+.04,.12,0,y-.04,0,stone,island);cylinder(radius,.055,0,y-.16,0,dark,island);}const spot=ring(.32,x,y+.035,z);spot.userData.laterGo=id;spots.push(spot);const target=mesh(new T.CylinderGeometry(id==='goal'?.8:1.2,id==='goal'?.8:1.2,.025,32),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),x,y+.05,z);target.castShadow=false;target.userData.laterGo=id;spots.push(target);markers[id]={ring:spot,hit:target};}
 // The same comfortable landing arrangement makes every arrival familiar.
 box(1.6,.14,2.1,-4,.72,5.45,timber);box(.7,.14,2.1,-4.4,.72,7.35,timber);box(.8,.08,.55,-5.1,.8,8,timber);
 for(let i=0;i<5;i++)box(1.2,.16,.36,-4,.8+i*.16,4.5-i*.32);
 const dockHit=box(.9,.025,2.2,-4.4,.82,7.3,new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));dockHit.userData.laterGo='dock';dockHit.castShadow=false;spots.push(dockHit);
 function bridge(a,b){const mat=stone.clone(),m=box(1,.15,.85,0,0,0,mat);m.userData.laterBridge=[a,b];spots.push(m);bridges.push({a,b,mesh:m,amount:0,target:0});}
 const pairs=chapter===3?[['dock','west'],['west','garden'],['west','east'],['east','lookout'],['east','garden'],['garden','goal']]:chapter===4?[['dock','west'],['west','garden'],['west','lift'],['lift','east'],['east','lookout'],['lift','goal']]:[['dock','west'],['west','garden'],['garden','east'],['east','lookout'],['garden','goal']];pairs.forEach(([a,b])=>bridge(a,b));
 function mechanism(id,top){const [x,y,z]=config.nodes[id],g=new T.Group();g.position.set(x,y,chapter===5&&id==='goal'?z+.65:z-.65);group.add(g);cylinder(.055,top,0,top/2,0,dark,g);ring(.35,0,top,0,gold,g);const handle=cylinder(.13,.08,0,top,0,gold,g);handle.userData.laterAct=id;spots.push(handle);hitSphere(0,top,0,{laterAct:id},g);mechanisms[id]={group:g,rotor:null};return g;}
 function artifact(id,node,color){const [x,y,z]=config.nodes[node];const g=new T.Group();g.position.set(x+.65,y+.35,z+.2);group.add(g);const piece=mesh(new T.OctahedronGeometry(.2),material(color,{emissive:color,emissiveIntensity:.3}),0,0,0,g);piece.userData.laterGo=node;spots.push(piece);artifacts[id]=g;}
 let liftDeck=null,lockWater=null,homeLamp=null,homeBeam=null;const mirrorBeams=[];
 if(chapter===3){
  for(const [id,color]of [['west','#e9e7ce'],['east','#cc9474']]){const g=mechanism(id,1),rotor=new T.Group();g.add(rotor);mechanisms[id].rotor=rotor;cylinder(.035,3.3,0,1.65,0,dark,rotor);const shape=new T.BufferGeometry();shape.setAttribute('position',new T.Float32BufferAttribute([0,3.3,0,0,.8,0,1.65,1.1,0],3));shape.computeVertexNormals();mesh(shape,material(color,{side:T.DoubleSide}),0,0,0,rotor);box(1.7,.04,.05,.8,1,0,gold,rotor);}
  const dial=mechanism('garden',1.15);const arrow=mesh(new T.ConeGeometry(.13,.65,4),gold,0,1.4,0,dial);arrow.rotation.z=-Math.PI/2;mechanisms.garden.rotor=new T.Group();dial.add(mechanisms.garden.rotor);mechanisms.garden.rotor.add(arrow);
  arch(0,1.7,-7,2.1);artifact('compass','lookout','#e9c47b');
  for(const [x,z]of [[-3.8,.5],[3.7,.8],[5.9,-3.7]])shrub(x,1.7,z);
  // Three restrained wind ribbons, made of stiff sculptural fabric.
  for(let i=0;i<3;i++){const x=-5+i*.5;box(.035,2.4,.035,x,1.2,-3.5,dark);const sheet=mesh(new T.PlaneGeometry(.35,1.4),material('#cbdcc6',{side:T.DoubleSide}),x+.17,1.7,-3.5);sheet.rotation.y=.45;}
 }else if(chapter===4){
  // A clear-sided tide chamber and a floating timber platform.
  for(const x of [-1.2,1.2])for(const z of [.05,2.35])box(.07,6,.07,x,3,z,dark);
  const glass=material('#93bec0',{transparent:true,opacity:.18,side:T.DoubleSide,depthWrite:false,roughness:.2});for(const x of [-1.23,1.23]){const m=box(.025,5.6,2.5,x,2.8,1.2,glass);m.castShadow=false;}
  lockWater=box(2.35,1.4,2.35,0,.7,1.2,material('#3e9299',{transparent:true,opacity:.65,roughness:.3}));lockWater.castShadow=false;
  liftDeck=new T.Group();group.add(liftDeck);liftDeck.position.set(0,1.7,1.2);box(2.1,.16,2.1,0,-.08,0,timber,liftDeck);for(let i=0;i<8;i++)box(.012,.01,2, -.85+i*.24,.008,0,dark,liftDeck);
  const mech=mechanism('lift',.75);ring(.35,0,.77,0,warm,mech);artifact('wheel','garden','#e5bc73');artifact('valve','lookout','#9ac8bf');
  arch(0,5.7,-3.6,2.1);shrub(-4.65,1.7,-3.2);shrub(4.6,3.7,-3.5);for(const x of [3.45,4.55])box(.06,1.4,.06,x,4.4,-3.6,dark);box(1.4,.1,.75,4,5.15,-3.6,stone);
 }else{
  for(const id of ['west','east']){const m=mechanism(id,1.35);const rotor=new T.Group();m.add(rotor);mechanisms[id].rotor=rotor;const mirror=mesh(new T.CircleGeometry(.45,48),material('#a2c9c6',{metalness:.65,roughness:.2,side:T.DoubleSide}),0,1.5,0,rotor);ring(.48,0,1.5,0,gold,rotor).rotation.x=0;const beam=mesh(new T.ConeGeometry(.2,1,24,1,true),new T.MeshBasicMaterial({color:'#eed095',transparent:true,opacity:.14,depthWrite:false,side:T.DoubleSide}));beam.castShadow=false;mirrorBeams.push({id,mesh:beam});}
  // A modern lighthouse, with a glass lantern and a warm home light.
  cylinder(.65,4.1,0,3.75,-4.85);for(let i=0;i<3;i++)box(.2,.6,.025,0,2.7+i*.95,-4.19,dark);cylinder(.88,.14,0,5.86,-4.85,dark);
  const glass=mesh(new T.CylinderGeometry(.62,.62,.9,48),material('#b2cec8',{transparent:true,opacity:.25,roughness:.1,depthWrite:false}),0,6.35,-4.85);glass.castShadow=false;cylinder(.84,.11,0,6.85,-4.85,stone);homeLamp=mesh(new T.SphereGeometry(.25,24,16),warm,0,6.35,-4.85);homeLamp.visible=false;
  homeBeam=mesh(new T.ConeGeometry(2.5,17,48,1,true),new T.MeshBasicMaterial({color:'#ffd995',transparent:true,opacity:.055,side:T.DoubleSide,depthWrite:false}),0,6.35,3.65);homeBeam.rotation.x=-Math.PI/2;homeBeam.castShadow=false;homeBeam.visible=false;
  mechanism('goal',.65);artifact('lens','lookout','#f1d69b');for(const x of [4.8,6.2])box(.06,1.6,.06,x,2.5,-3.6,dark);box(2,.12,1.4,5.5,3.3,-3.3,stone);shrub(-4.6,1.7,.4);shrub(4.6,1.7,1.5);
 }
 for(const [x,z]of [[-6,-4],[6,5],[-1,8]]){cylinder(.16,.4,x,.13,z,dark);mesh(new T.ConeGeometry(.14,.22,16),gold,x,.45,z);}
 let model=null,settle=0,liftY=1.7;
 function sync(next,instant=false){model=next;settle=instant?0:.75;const active=model.edges();for(const b of bridges){b.target=Number(active.some(([a,c])=>a===b.a&&c===b.b||a===b.b&&c===b.a));if(instant)b.amount=b.target;}for(const [id,o]of Object.entries(artifacts))o.visible=!model.items.has(id);if(instant)liftY=model.point('lift' in config.nodes?'lift':'west').y;}
 function update(dt,instant=false){if(!model)return;settle=Math.max(0,settle-dt);if(liftDeck){const target=model.point('lift').y;liftY+= (target-liftY)*Math.min(1,dt*3);if(instant)liftY=target;liftDeck.position.y=liftY;mechanisms.lift.group.position.y=liftY;markers.lift.ring.position.y=liftY+.035;markers.lift.hit.position.y=liftY+.05;lockWater.scale.y=(liftY-.17)/1.4;lockWater.position.y=(liftY-.17)/2;}
 for(const b of bridges){b.amount+=(b.target-b.amount)*Math.min(1,dt*6);if(instant)b.amount=b.target;b.mesh.visible=b.amount>.005;const a=b.a==='dock'?{x:-4,y:1.7,z:3.1}:model.point(b.a),c=b.b==='dock'?{x:-4,y:1.7,z:3.1}:model.point(b.b),av=new T.Vector3(a.x,b.a==='lift'?liftY:a.y,a.z),cv=new T.Vector3(c.x,b.b==='lift'?liftY:c.y,c.z),delta=cv.clone().sub(av);b.mesh.position.copy(av.add(cv).multiplyScalar(.5));b.mesh.position.y-=.075;b.mesh.scale.set(delta.length(),1,Math.max(.001,b.amount));b.mesh.quaternion.setFromUnitVectors(new T.Vector3(1,0,0),delta.normalize());}
 for(const [id,m]of Object.entries(mechanisms)){if(!m.rotor)continue;const value=chapter===3?(id==='garden'?model.wind:model.sails[id==='west'?0:1]):id==='west'?model.a:model.b;const target=value*Math.PI*2/(chapter===5&&id==='west'?2:3);let diff=T.MathUtils.euclideanModulo(target-m.rotor.rotation.y+Math.PI,Math.PI*2)-Math.PI;m.rotor.rotation.y+=diff*(instant?1:Math.min(1,dt*5));}
 if(homeLamp){homeLamp.visible=model.chart;homeBeam.visible=model.chart;for(const b of mirrorBeams){const n=model.point(b.id),from=new T.Vector3(n.x,n.y+1.5,n.z-.65),to=b.id==='west'?(model.a===0?new T.Vector3(4,3.2,.35):new T.Vector3(0,6.35,-4.85)):model.b===0?new T.Vector3(8,0,5):model.b===1?new T.Vector3(5.5,2.05,-3):new T.Vector3(0,6.35,-4.85),delta=to.clone().sub(from);b.mesh.position.copy(from.add(to).multiplyScalar(.5));b.mesh.scale.y=delta.length();b.mesh.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),delta.normalize());}}
 }
 function busy(){return settle>0||chapter===4&&Math.abs(liftY-model.point('lift').y)>.015;}
 return {group,spots,sync,update,busy,get liftY(){return liftY;},config};
}
