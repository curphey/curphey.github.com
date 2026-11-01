import * as T from '../tower/vendor/three.js';
import {reefNodes} from './coral-puzzle.mjs';
export function createCoralGate(){
 const group=new T.Group();group.position.x=44;const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.9});const sand=mat('#dfbba3'),stone=mat('#dedfd2'),coral=mat('#bf9486'),green=mat('#709b89'),metal=mat('#b69663'),dark=mat('#35575d');
 function mesh(g,m,x,y,z,parent=group){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const box=(w,h,d,x,y,z,m=stone,parent=group)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,parent);
 const cylinder=(r,h,x,y,z,m=stone)=>mesh(new T.CylinderGeometry(r,r,h,48),m,x,y,z);
 function island(x,z,r,h){cylinder(r+.18,.18,x,-.02,z,sand);cylinder(r,h,x,h/2,z,coral);cylinder(r+.06,.12,x,h+.06,z,stone);cylinder(r+.01,.06,x,h-.06,z,dark);}
 // Sculptural reef crescents with an open foreground for the arrival.
 for(let i=0;i<9;i++){const a=Math.PI*.9+i*.32,x=Math.cos(a)*7.1,z=Math.sin(a)*6.6;const r=.6+(i%3)*.17;const rock=mesh(new T.CylinderGeometry(r*.8,r,.5+(i%2)*.25,6),sand,x,.1,z);rock.rotation.y=i*.7;for(let j=0;j<3;j++){const twig=mesh(new T.ConeGeometry(.12,.7+j*.12,5),coral,x+Math.cos(j*2)*.22,.7,z+Math.sin(j*2)*.22);twig.rotation.z=(j-1)*.2;}}
 island(-4,4.2,1.3,.65);box(1.6,.14,2.1,-4,.72,5.45,sand);box(.7,.14,2.1,-4.4,.72,7.35,sand);box(.8,.08,.55,-5.1,.8,8,stone);for(let i=0;i<5;i++)box(1.2,.16,.36,-4,.8+i*.16,4.5-i*.32,stone);
 island(-3,1.2,1.5,1.6);island(3,1.2,1.5,1.6);island(0,-3,2,1.6);island(5.5,-3,1.25,1.6);
 function bridge(a,b){const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),o=box(length,.22,1,(a[0]+b[0])/2,1.58,(a[1]+b[1])/2);o.rotation.y=-Math.atan2(dz,dx);}
 bridge([-4,3.1],[-3,1.2]);
 const causeways=[];
 for(const x of [-3,3]){const pivot=new T.Group();pivot.position.set(x,1.58,1.2);group.add(pivot);const deck=box(1,.22,.8,.5,0,0,stone,pivot);const trim=box(1,.035,.82,.5,.13,0,sand,pivot);causeways.push({pivot,deck,trim,angle:0,length:1,targetAngle:0,targetLength:1});}
 const spots=[],prismObjects={};causeways.forEach((causeway,index)=>{for(const surface of [causeway.deck,causeway.trim]){surface.userData.reefBridge=index;spots.push(surface);}});
 for(const [id,n]of Object.entries(reefNodes)){if(id==='boat')continue;const ring=mesh(new T.TorusGeometry(.3,.022,8,40),metal,n.x,n.y+.025,n.z);ring.rotation.x=-Math.PI/2;ring.userData.reefGo=id;spots.push(ring);const hit=mesh(new T.CylinderGeometry(id==='gate'?.5:id==='grotto'?1.1:1.35,id==='gate'?.5:id==='grotto'?1.1:1.35,.03,32),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),n.x,n.y+(id==='gate'?.07:.04),n.z);hit.userData.reefGo=id;hit.castShadow=false;spots.push(hit);}
 for(const [id,node,color]of [['east','court','#efbe71'],['west','grotto','#8bccc3']]){const n=reefNodes[node];const prism=mesh(new T.OctahedronGeometry(.21),new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.3}),n.x+.7,2.1,n.z+.4);prismObjects[id]=prism;}
 // A cantilevered folded canopy shelters the remote prism terrace.
 for(const x of [4.8,6.2])box(.065,1.5,.065,x,2.4,-3.4,dark);
 const canopy=new T.BufferGeometry();canopy.setAttribute('position',new T.Float32BufferAttribute([4.4,3.15,-4,6.6,3.15,-4,5.5,3.55,-3.2,4.4,3.15,-4,5.5,3.55,-3.2,4.4,3.15,-2.5,6.6,3.15,-4,6.6,3.15,-2.5,5.5,3.55,-3.2],3));canopy.computeVertexNormals();mesh(canopy,new T.MeshStandardMaterial({color:'#dedfd2',side:T.DoubleSide,roughness:.8}),0,0,0);
 box(1.1,.1,.32,5.5,2.08,-3.65,sand);

 // Twin reef-light towers with a crown of warm brass.
 const lights=[];
 for(const x of [-3,3]){box(.34,1.45,.34,x,2.4,.55,dark);cylinder(.4,.07,x,3.16,.55,stone);box(.11,.85,.012,x,2.45,.73,metal);const top=new T.Group();top.position.set(x,3.3,.55);group.add(top);mesh(new T.OctahedronGeometry(.22),new T.MeshStandardMaterial({color:'#f8d592',emissive:'#edb65e',emissiveIntensity:.6}),0,0,0,top);const target=new T.Vector3(-x,-.3,-6.1),length=target.length();const beam=mesh(new T.ConeGeometry(.32,length,32,1,true),new T.MeshBasicMaterial({color:'#f7dc9f',transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide}),target.x/2,target.y/2,target.z/2,top);beam.castShadow=false;beam.receiveShadow=false;beam.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),target.clone().normalize());const opticHit=mesh(new T.SphereGeometry(.46,16,12),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),x,3.3,.55);opticHit.castShadow=false;opticHit.userData.reefMechanism=x<0?'west':'east';spots.push(opticHit);top.children[0].userData.reefMechanism=x<0?'west':'east';spots.push(top.children[0]);lights.push({group:top,beam});}
 // A tall sea gate and two opening leaves at the back of the lagoon.
 for(const x of [-1.35,1.35]){box(.45,3.6,.55,x,3.45,-4.15);}
 const arch=new T.Shape();arch.absarc(0,0,1.575,0,Math.PI,false);arch.lineTo(-1.125,0);arch.absarc(0,0,1.125,Math.PI,0,true);arch.closePath();mesh(new T.ExtrudeGeometry(arch,{depth:.55,bevelEnabled:false,curveSegments:40}),stone,0,5.15,-4.43);
 const quayHit=box(.85,.03,2.3,-4.4,.83,7.3,new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));quayHit.userData.reefGo='dock';quayHit.castShadow=false;spots.push(quayHit);
 const gateHit=box(1.1,2.8,.2,0,3.1,-4.15,new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));gateHit.castShadow=false;gateHit.userData.reefGo='gate';spots.push(gateHit);
 const doorLeft=box(1.08,2.9,.12,-.55,3.2,-4.15,dark),doorRight=box(1.08,2.9,.12,.55,3.2,-4.15,dark);doorLeft.userData.reefGo='gate';doorRight.userData.reefGo='gate';spots.push(doorLeft,doorRight);for(let i=0;i<7;i++){box(.016,2.8,.02,-.45+i*.15,0,.075,stone,doorLeft);box(.016,2.8,.02,-.45+i*.15,0,.075,stone,doorRight);}
 for(const [x,z]of [[-4,.5],[4,1.7],[-1,-2]]){cylinder(.06,.8,x,2.1,z,metal);for(let i=0;i<5;i++){const leaf=mesh(new T.ConeGeometry(.17,1,5),green,x+Math.cos(i*1.26)*.3,2.5,z+Math.sin(i*1.26)*.3);leaf.rotation.z=Math.sin(i*1.26)*.8;leaf.rotation.x=Math.cos(i*1.26)*.8;}}
 let open=0,state=null;
 function sync(model,instant=false){state=model;for(let i=0;i<2;i++){const from=reefNodes[i===0?'west':'east'],to=reefNodes[i===0?(model.modes[0]===1?'east':'court'):(model.modes[1]===0?'grotto':'court')];const dx=to.x-from.x,dz=to.z-from.z,c=causeways[i];c.targetAngle=-Math.atan2(dz,dx);c.targetLength=Math.hypot(dx,dz);if(instant){c.angle=c.targetAngle;c.length=c.targetLength;}const beamTarget=model.modes[i]===2?{x:0,y:3,z:-4.15}:to;const delta=new T.Vector3(beamTarget.x-from.x,beamTarget.y-3.3,beamTarget.z-from.z+.65),length=delta.length(),b=lights[i].beam;b.geometry.dispose();b.geometry=new T.ConeGeometry(.19,length,24,1,true);b.position.copy(delta.clone().multiplyScalar(.5));b.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),delta.normalize());b.visible=model.modes[i]!==2||model.fitted[i];}for(const [id,o]of Object.entries(prismObjects))o.visible=!model.prisms.has(id);}
 function reset(){open=0;state=null;doorLeft.position.x=-.55;doorRight.position.x=.55;}
 function update(dt,instant=false){for(const c of causeways){const blend=instant?1:Math.min(1,dt*5);c.angle+=(c.targetAngle-c.angle)*blend;c.length+=(c.targetLength-c.length)*blend;c.pivot.rotation.y=c.angle;for(const deck of [c.deck,c.trim]){deck.scale.x=c.length;deck.position.x=c.length/2;}}const solved=!!state?.open;open+=(Number(solved)-open)*Math.min(1,dt*2);if(instant)open=Number(solved);doorLeft.position.x=-.55-open*1.05;doorRight.position.x=.55+open*1.05;}
 function busy(){return causeways.some(c=>Math.abs(c.angle-c.targetAngle)>.006||Math.abs(c.length-c.targetLength)>.006);}
 reset();return {group,reset,sync,update,busy,spots};
}
