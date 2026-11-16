import * as T from 'three';
import {clamp} from './rng.js';
export function createPlayer(){return {id:0,name:'YOU',team:0,pos:new T.Vector3(-18,0,12),vel:new T.Vector3(),yaw:0,pitch:0,kick:0,eye:1.62,height:1.8,hp:100,armour:0,alive:true,ground:true,crouch:false,kills:0};}
function overlaps(x,y,z,h,c){return x+.32>c.min.x&&x-.32<c.max.x&&z+.32>c.min.z&&z-.32<c.max.z&&y+h>c.min.y+.02&&y<c.max.y-.02;}
const HORIZONTAL_AXES=['x','z'];
// Axis-separated swept movement, with 0.30 m stair stepping and support tests.
export function moveBody(b,dx,dz,dt,world,jump=false){
 const r=.32,h=b.height||1.8;let x=b.pos.x,z=b.pos.z,y=b.pos.y;
 for(const axis of HORIZONTAL_AXES){let nx=x+(axis==='x'?dx:0),nz=z+(axis==='z'?dz:0);for(const c of world.colliders){if(overlaps(nx,y,nz,h,c)){if(b.ground&&c.max.y-y<=.31&&c.max.y>y){y=c.max.y;}else {if(axis==='x'){nx=dx>0?c.min.x-r:c.max.x+r;b.vel.x=0;}else {nz=dz>0?c.min.z-r:c.max.z+r;b.vel.z=0;}}}}x=nx;z=nz;}
 if(jump&&b.ground){b.vel.y=6;b.ground=false;}b.vel.y-=20*dt;let ny=y+b.vel.y*dt;b.ground=false;
 for(const c of world.colliders){if(overlaps(x,ny,z,h,c)){if(b.vel.y<=0&&y>=c.max.y-.32){ny=c.max.y;b.ground=true;b.vel.y=0;}else if(b.vel.y>0&&y+h<=c.min.y+.1){ny=c.min.y-h;b.vel.y=0;}}}
 if(ny<0){ny=0;b.ground=true;b.vel.y=0;}b.pos.set(x,ny,z);
}
export function updatePlayer(s,dt){const p=s.player,k=s.keys;p.crouch=k.has('ControlLeft')||k.has('ControlRight');p.height=p.crouch?1.14:1.8;
 // Do not stand inside a low ceiling.
 if(!p.crouch)for(const c of s.world.colliders)if(p.pos.x+.32>c.min.x&&p.pos.x-.32<c.max.x&&p.pos.z+.32>c.min.z&&p.pos.z-.32<c.max.z&&p.pos.y<c.max.y&&p.pos.y+1.8>c.min.y&&p.pos.y+1.14<=c.min.y){p.crouch=true;p.height=1.14;break;}
 p.eye+=( (p.crouch?1.02:1.62)-p.eye)*Math.min(1,dt*14);const f=+k.has('KeyW')-+k.has('KeyS'),r=+k.has('KeyD')-+k.has('KeyA'),len=Math.hypot(f,r)||1,speed=p.crouch?2.25:5.1;
 const wx=(-Math.sin(p.yaw)*f+Math.cos(p.yaw)*r)/len*speed,wz=(-Math.cos(p.yaw)*f-Math.sin(p.yaw)*r)/len*speed,a=Math.min(1,dt*(p.ground?12:3));p.vel.x+=(wx-p.vel.x)*a;p.vel.z+=(wz-p.vel.z)*a;moveBody(p,p.vel.x*dt,p.vel.z*dt,dt,s.world,k.has('Space'));p.kick*=Math.exp(-dt*8);p.pitch=clamp(p.pitch,-1.4,1.4);
}
