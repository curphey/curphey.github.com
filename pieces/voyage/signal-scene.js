import * as T from '../tower/vendor/three.js';
import {SignalPuzzle} from './signal-puzzle.mjs';
export function createSignalScene(chapter,anchor){
 const model=new SignalPuzzle(chapter),group=new T.Group(),spots=[];group.position.x=(chapter-1)*44;
 const y=anchor.y,points={entry:[anchor.x,y,anchor.z],west:[-9,y,-1],east:[-13,y,-1],north:[-11,y,-6],south:[-11,y,4],vault:[-16,y,-6]};
 const stone=new T.MeshStandardMaterial({color:'#dedfd2',roughness:.86}),accent=new T.MeshStandardMaterial({color:['#b6b9ac','#bc9985','#91b5a2','#a4b6bd','#607e8d'][chapter-1],roughness:.8}),dark=new T.MeshStandardMaterial({color:'#314b53'}),gold=new T.MeshStandardMaterial({color:'#d7ae66',emissive:'#d7ae66',emissiveIntensity:.15});
 function mesh(geo,mat,x,y,z){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 const rotors={},pieces={},sockets={},pips={};let lamp;
 for(const [id,[x,h,z]]of Object.entries(points)){if(id==='entry')continue;mesh(new T.CylinderGeometry(1.3,1.3,h-.14,48),accent,x,(h-.14)/2,z);const top=mesh(new T.CylinderGeometry(1.4,1.4,.13,48),stone,x,h-.065,z);top.userData.signalGo=id;spots.push(top);
 const ring=mesh(new T.TorusGeometry(.35,.025,8,40),gold,x,h+.025,z);ring.rotation.x=-Math.PI/2;
 if(['west','east','vault'].includes(id)){mesh(new T.CylinderGeometry(.065,.065,.7,16),dark,x,h+.35,z-.55);const dial=mesh(new T.CylinderGeometry(.32,.32,.12,32),gold,x,h+.75,z-.55);dial.userData.signalAct=id;spots.push(dial);const hit=mesh(new T.SphereGeometry(.5,16,12),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),x,h+.75,z-.55);hit.userData.signalAct=id;hit.castShadow=false;spots.push(hit);rotors[id]=mesh(new T.BoxGeometry(.5,.05,.07),dark,x,h+.83,z-.55);if(id!=='vault'){sockets[id]=mesh(new T.OctahedronGeometry(.12),gold,x+.5,h+.2,z-.55);pips[id]=Array.from({length:3},(_,i)=>mesh(new T.SphereGeometry(.07,12,8),stone,x+Math.sin(i*Math.PI*2/3)*.5,h+.1,z-.55+Math.cos(i*Math.PI*2/3)*.5));}}
 if(id==='north'||id==='south'){pieces[id]=mesh(new T.OctahedronGeometry(.24),gold,x,h+.5,z);pieces[id].userData.signalGo=id;spots.push(pieces[id]);}
 }
 // Open pergolas and a low signal tower keep the new district in the island's vocabulary.
 for(const id of ['north','south']){const [x,h,z]=points[id];for(const dx of [-.9,.9])mesh(new T.BoxGeometry(.07,1.8,.07),dark,x+dx,h+.9,z-.8);mesh(new T.BoxGeometry(2.2,.12,1),stone,x,h+1.8,z-.8);}
 const [vx,vy,vz]=points.vault;mesh(new T.CylinderGeometry(.42,.55,2.5,32),stone,vx,vy+1.25,vz-.8);lamp=mesh(new T.SphereGeometry(.28,24,16),gold,vx,vy+2.65,vz-.8);
 const pairs=[['entry','west'],['west','east'],['west','north'],['west','south'],['east','south'],['east','north'],['east','vault'],['north','vault']];
 const decks=pairs.map(([a,b])=>{const av=new T.Vector3(...points[a]),bv=new T.Vector3(...points[b]),delta=bv.clone().sub(av),m=mesh(new T.BoxGeometry(delta.length(),.14,.82),stone,...av.add(bv).multiplyScalar(.5).toArray());m.position.y-=.08;m.quaternion.setFromUnitVectors(new T.Vector3(1,0,0),delta.normalize());m.userData.signalBridge=[a,b];spots.push(m);return {a,b,m};});
 function sync(){const edges=model.edges();for(const d of decks)d.m.visible=edges.some(([a,b])=>a===d.a&&b===d.b||a===d.b&&b===d.a);for(const id of ['north','south'])pieces[id].visible=!model.keys.has(id);rotors.west.rotation.y=model.a*Math.PI*2/3;rotors.east.rotation.y=model.b*Math.PI*2/3;lamp.visible=model.done;for(const [i,id]of ['west','east'].entries()){sockets[id].visible=model.fitted[i];pips[id].forEach((pip,j)=>pip.material=j===(i===0?model.a:model.b)?gold:stone);}}
 sync();return {model,group,points,spots,sync};
}
