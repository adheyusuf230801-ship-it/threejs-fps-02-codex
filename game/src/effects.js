import * as T from 'three';
import {P} from './palette.js';
export function createEffects(scene){
 const tracers=[],particles=[];for(let i=0;i<32;i++){const a=new Float32Array(6),geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(a,3));const line=new T.Line(geo,new T.LineBasicMaterial({color:P.amber,transparent:true,opacity:.8}));line.visible=false;scene.add(line);tracers.push({mesh:line,life:0,a});}
 const geo=new T.BoxGeometry(.09,.09,.09),mat=new T.MeshBasicMaterial({color:P.amber});for(let i=0;i<100;i++){const mesh=new T.Mesh(geo,mat);mesh.visible=false;scene.add(mesh);particles.push({mesh,vel:new T.Vector3(),life:0});}let ti=0,pi=0;
 return {tracer(a,b){const t=tracers[ti++%tracers.length];t.life=.065;t.mesh.visible=true;t.a[0]=a.x;t.a[1]=a.y;t.a[2]=a.z;t.a[3]=b.x;t.a[4]=b.y;t.a[5]=b.z;t.mesh.geometry.attributes.position.needsUpdate=true;t.mesh.frustumCulled=false;},burst(p,rng,count=28){for(let i=0;i<count;i++){const t=particles[pi++%particles.length];t.life=.25+rng()*.65;t.mesh.visible=true;t.mesh.position.copy(p);t.vel.set((rng()-.5)*10,rng()*8,(rng()-.5)*10);}},step(dt){for(const t of tracers)if(t.life>0){t.life-=dt;t.mesh.visible=t.life>0;}for(const t of particles)if(t.life>0){t.life-=dt;t.mesh.visible=t.life>0;t.vel.y-=12*dt;t.mesh.position.addScaledVector(t.vel,dt);}}};
}
