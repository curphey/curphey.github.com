import * as T from '../tower/vendor/three.js';

export function createTraveller() {
  const group = new T.Group();
  group.name = 'Sailing traveller';
  const material = color => new T.MeshStandardMaterial({ color, roughness: .88 });
  const jacket = material('#e8e9dc');
  const trim = material('#c57455');
  const navy = material('#263d48');
  const skin = material('#d5a57f');
  const sole = material('#e6e4d8');
  const pack = material('#678e89');
  function part(geometry, mat, x, y, z, parent = group) {
    const mesh = new T.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  const box = (w,h,d,x,y,z,m,parent) => part(new T.BoxGeometry(w,h,d),m,x,y,z,parent);
  // A short technical jacket, trousers and deck trainers keep the silhouette contemporary.
  part(new T.CylinderGeometry(.145,.17,.32,12), jacket,0,.59,0);
  box(.27,.065,.22,0,.43,0,navy);
  box(.018,.29,.014,0,.59,.178,navy);
  box(.095,.035,.014,-.085,.66,.145,trim);
  part(new T.CylinderGeometry(.09,.12,.07,12),navy,0,.78,0);
  part(new T.SphereGeometry(.125,20,16),skin,0,.9,.005);
  // A close-fitting baseball cap and a short forward brim, rather than a broad traveller's hat.
  part(new T.SphereGeometry(.135,20,12,0,Math.PI*2,0,Math.PI/2),navy,0,.96,0);
  const brim = part(new T.CylinderGeometry(.13,.13,.018,20),navy,0,.966,.087);
  brim.scale.set(1,1,.75);
  box(.19,.035,.024,0,.922,.115,navy);
  box(.22,.24,.095,0,.61,-.18,pack);
  for(const x of [-.11,.11])box(.027,.29,.025,x,.6,.135,pack);
  const legs=[],arms=[];
  for(const side of [-1,1]) {
    const leg=new T.Group();leg.position.set(side*.083,.43,0);group.add(leg);
    part(new T.CylinderGeometry(.052,.047,.3,10),navy,0,-.15,0,leg);
    box(.108,.07,.17,0,-.36,.027,sole,leg);
    box(.105,.025,.15,0,-.318,.03,navy,leg);
    legs.push(leg);
    const arm=new T.Group();arm.position.set(side*.176,.7,0);group.add(arm);
    part(new T.CapsuleGeometry(.047,.17,4,10),jacket,0,-.108,0,arm);
    part(new T.SphereGeometry(.043,10,8),skin,0,-.245,0,arm);
    arms.push(arm);
  }
  let amount=0;
  return {group,update(time,moving,reduced,dt){
    amount += ((moving&&!reduced?1:0)-amount)*Math.min(1,dt*12);
    const swing=Math.sin(time*10)*.43*amount;
    legs[0].rotation.x=swing;legs[1].rotation.x=-swing;
    arms[0].rotation.x=-swing*.65;arms[1].rotation.x=swing*.65;
  }};
}
