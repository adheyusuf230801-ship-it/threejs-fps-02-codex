import * as T from 'three';
import {clamp} from './rng.js';
export const GUNS=[{id:'pistol',name:'P9',price:0,mag:12,reserve:72,damage:30,rate:.23,reload:1.25,spread:.003,recoil:.035,auto:false,pellets:1},{id:'rifle',name:'VK-9',price:2500,mag:30,reserve:90,damage:26,rate:.095,reload:2.05,spread:.002,recoil:.022,auto:true,pellets:1},{id:'scatter',name:'SCATTERGUN',price:1200,mag:6,reserve:30,damage:18,rate:.8,reload:2.5,spread:.052,recoil:.09,auto:false,pellets:8}];
export function createWeapon(camera,scene){const group=new T.Group();camera.add(group);const steel=new T.MeshStandardMaterial({color:0x263237,metalness:.65,roughness:.35}),trim=new T.MeshStandardMaterial({color:0xb28b57,metalness:.5,roughness:.4});
 function part(x,y,z,w,h,d,m){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);group.add(mesh);return mesh;}part(.24,-.24,-.43,.12,.15,.45,steel);part(.24,-.32,-.36,.095,.18,.13,steel);part(.24,-.21,-.76,.055,.055,.32,steel);part(.24,-.15,-.48,.03,.06,.035,trim);part(.24,-.15,-.64,.022,.05,.025,trim);part(.24,-.23,-.34,.13,.04,.14,trim);
 const flash=new T.Mesh(new T.ConeGeometry(.085,.26,5),new T.MeshBasicMaterial({color:0xffdb9b}));flash.rotation.x=-Math.PI/2;flash.position.set(.24,-.21,-.96);flash.visible=false;group.add(flash);
 const grenadeMesh=new T.Mesh(new T.SphereGeometry(.12,8,6),new T.MeshStandardMaterial({color:0x5b6651}));scene.add(grenadeMesh);grenadeMesh.visible=false;
 return {index:0,mag:12,reserve:72,cool:0,reload:0,bloom:0,trigger:false,grenades:0,flash:0,group,flashMesh:flash,grenade:{active:false,pos:new T.Vector3(),vel:new T.Vector3(),fuse:0,mesh:grenadeMesh}};
}
const origin=new T.Vector3(),dir=new T.Vector3(),end=new T.Vector3(),center=new T.Vector3(),delta=new T.Vector3();
// Analytic ray/capsule tests: vertical cylinder and endcaps plus a separate head sphere.
function sphere(o,d,c,r,max){delta.subVectors(o,c);const b=delta.dot(d),h=b*b-delta.lengthSq()+r*r;if(h<0)return max;const t=-b-Math.sqrt(h);return t>0&&t<max?t:max;}
export function trace(s,shooter,o,d,damage,range=85){let dist=s.world.obstruction(o,d,range),victim=null,head=false;
 for(const b of s.actors){if(!b.alive||b.team===shooter.team)continue;center.copy(b.pos);center.y+=1.56;const ht=sphere(o,d,center,.23,dist);let bt=dist;const ox=o.x-b.pos.x,oz=o.z-b.pos.z,aa=d.x*d.x+d.z*d.z,bb=ox*d.x+oz*d.z,cc=ox*ox+oz*oz-.30*.30,disc=bb*bb-aa*cc;
 if(disc>=0&&aa>.0001){const t=(-bb-Math.sqrt(disc))/aa,yy=o.y+d.y*t;if(t>0&&t<bt&&yy>b.pos.y+.35&&yy<b.pos.y+1.35)bt=t;}
 center.y=b.pos.y+.35;bt=sphere(o,d,center,.3,bt);center.y=b.pos.y+1.28;bt=sphere(o,d,center,.3,bt);
 if(ht<dist||bt<dist){head=ht<bt;dist=Math.min(ht,bt);victim=b;}}
 end.copy(o).addScaledVector(d,dist);s.effects.tracer(o,end);if(victim){s.damage(victim,damage*(head?2.5:1),shooter,head);if(shooter===s.player){s.hit=.13;s.audio.play('hit');}}return victim;
}
export function equip(s,i){const w=s.weapon,g=GUNS[i];w.index=i;w.mag=g.mag;w.reserve=g.reserve;w.reload=0;w.bloom=0;w.group.scale.z=i===0?.78:i===1?1.18:1.35;}
export function reload(s){const w=s.weapon,g=GUNS[w.index];if(!w.reload&&w.mag<g.mag&&w.reserve>0){w.reload=g.reload;s.audio.play('reload');}}
export function throwGrenade(s){const w=s.weapon,p=s.player,g=w.grenade;if(w.grenades<1||g.active||s.phase!=='live'||!p.alive)return;w.grenades--;g.active=true;g.fuse=2.1;g.pos.copy(p.pos);g.pos.y+=1.4;g.vel.set(-Math.sin(p.yaw)*11,5+Math.sin(p.pitch)*7,-Math.cos(p.yaw)*11);g.mesh.visible=true;}
export function updateWeapon(s,dt){const w=s.weapon,p=s.player,g=GUNS[w.index];w.cool=Math.max(0,w.cool-dt);w.bloom=Math.max(0,w.bloom-dt*.055);w.flash=Math.max(0,w.flash-dt);w.flashMesh.visible=w.flash>0;
 if(w.reload>0){w.reload-=dt;if(w.reload<=0){const n=Math.min(g.mag-w.mag,w.reserve);w.mag+=n;w.reserve-=n;w.reload=0;}}
 s.spread=g.spread+w.bloom+Math.hypot(p.vel.x,p.vel.z)*.005+(p.ground?0:.025);if(p.crouch)s.spread*=.6;
 if(s.firing&&p.alive&&s.phase==='live'&&!w.reload&&w.cool===0&&(g.auto||!w.trigger)){w.trigger=true;if(w.mag>0){w.mag--;w.cool=g.rate;w.flash=.045;p.kick+=g.recoil;p.yaw+=(s.rng()-.5)*g.recoil*.35;w.bloom=clamp(w.bloom+.006,0,.055);origin.copy(p.pos);origin.y+=p.eye;
 for(let i=0;i<g.pellets;i++){const yaw=p.yaw+(s.rng()-.5)*s.spread*2,pitch=p.pitch+p.kick+(s.rng()-.5)*s.spread*2;dir.set(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));trace(s,p,origin,dir,g.damage);}s.audio.play(g.id);s.hear(origin,p.team); }else reload(s);}
 if(!s.firing)w.trigger=false;
 const gr=w.grenade;if(gr.active){gr.fuse-=dt;gr.vel.y-=12*dt;origin.copy(gr.pos);dir.copy(gr.vel).normalize();if(s.world.obstruction(origin,dir,gr.vel.length()*dt)<gr.vel.length()*dt){gr.vel.x*=-.5;gr.vel.z*=-.5;gr.vel.y=Math.abs(gr.vel.y)*.5;}gr.pos.addScaledVector(gr.vel,dt);if(gr.pos.y<.12){gr.pos.y=.12;gr.vel.y=Math.abs(gr.vel.y)*.45;gr.vel.x*=.96;gr.vel.z*=.96;}gr.mesh.position.copy(gr.pos);if(gr.fuse<=0){gr.active=false;gr.mesh.visible=false;s.audio.play('boom');s.effects.burst(gr.pos,s.rng,65);s.shake=.7;for(const a of s.actors)if(a.alive){const d=a.pos.distanceTo(gr.pos);if(d<7){center.copy(a.pos);center.y+=.8;if(s.world.clear(gr.pos,center))s.damage(a,Math.max(0,125*(1-d/7)),p,false);}}}}
}
export function renderWeapon(s){const w=s.weapon,p=s.player;w.group.visible=p.alive;w.group.position.y=-p.kick*.55+(w.reload>0?-.15:0)+Math.sin(s.time*9)*Math.min(.012,Math.hypot(p.vel.x,p.vel.z)*.002);w.group.rotation.x=w.reload>0?-.35:p.kick*.6;}
