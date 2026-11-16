import * as T from 'three';
import {moveBody} from './player.js';
import {trace} from './weapon.js';
const eye=new T.Vector3(),targetEye=new T.Vector3(),aim=new T.Vector3();
export function createBots(scene){const bots=[];for(let i=1;i<=5;i++){const team=i<3?0:1,root=new T.Group(),uniform=new T.MeshStandardMaterial({color:team?0x936850:0x367a7b,roughness:.85}),dark=new T.MeshStandardMaterial({color:0x232d30}),skin=new T.MeshStandardMaterial({color:0xc2ac8c});
 const part=(geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;root.add(m);return m;};part(new T.CapsuleGeometry(.28,.65,4,8),uniform,0,.96,0);part(new T.SphereGeometry(.22,10,8),skin,0,1.57,0);part(new T.SphereGeometry(.235,10,8,0,Math.PI*2,0,Math.PI*.55),dark,0,1.64,0);part(new T.BoxGeometry(.44,.4,.18),dark,0,1.1,-.23);part(new T.BoxGeometry(.12,.15,.6),dark,.27,1.2,-.38);const legs=[];for(const x of [-.15,.15])legs.push(part(new T.BoxGeometry(.19,.65,.21),dark,x,.33,0));scene.add(root);
 bots.push({id:i,name:['','Rook','Mica','Brass','Cinder','Latch'][i],team,pos:new T.Vector3(),vel:new T.Vector3(),hp:100,armour:team?30:0,alive:true,height:1.8,ground:true,root,legs,yaw:0,state:'hold',timer:0,think:0,target:null,reaction:0,cool:0,burst:0,pause:0,goal:0,node:0,path:[],pathIndex:0,heard:new T.Vector3(),heardTime:0,plant:0,defuse:0,carrier:i===2});}return bots;}
export function resetBots(s){for(const b of s.bots){b.alive=true;b.hp=100;b.armour=b.team?30:0;b.pos.set(b.team?[-18,2,18][b.id-3]:[-15,-20][b.id-1],0,b.team?-12:12);b.vel.set(0,0,0);b.root.visible=true;b.target=null;b.reaction=0;b.timer=0;b.think=0;b.cool=0;b.plant=0;b.defuse=0;b.heardTime=0;b.state=b.team?'hold':'advance';b.path.length=0;b.goal=b.team?[13,15,16][b.id-3]:s.siteChoice===0?13:16;b.node=nearest(s,b.pos.x,b.pos.z);b.pathIndex=0;}}
function nearest(s,x,z){let best=0,d=Infinity;for(let i=0;i<s.world.nodes.length;i++){const n=s.world.nodes[i],dd=(n.x-x)**2+(n.z-z)**2;if(dd<d){d=dd;best=i;}}return best;}
// Tiny fixed graph: breadth-first routing uses reusable typed scratch buffers.
const queue=new Int16Array(32),prev=new Int16Array(32);
function route(s,b,goal){prev.fill(-1);const start=nearest(s,b.pos.x,b.pos.z);let head=0,tail=1;queue[0]=start;prev[start]=start;while(head<tail){const i=queue[head++];if(i===goal)break;for(const j of s.world.nodes[i].edges)if(prev[j]===-1){prev[j]=i;queue[tail++]=j;}}b.path.length=0;if(prev[goal]<0)return;let i=goal;while(i!==start){b.path.push(i);i=prev[i];}b.path.reverse();b.pathIndex=0;b.goal=goal;}
export function hear(s,p,team){for(const b of s.bots)if(b.alive&&b.team!==team&&b.pos.distanceTo(p)<25&&!b.target){b.heard.copy(p);b.heardTime=5;b.think=0;}}
export function updateBots(s,dt){if(s.phase!=='live')return;
 for(const b of s.bots){if(!b.alive)continue;b.timer+=dt;b.cool-=dt;b.pause-=dt;b.heardTime-=dt;b.think-=dt;eye.copy(b.pos);eye.y+=1.5;
 if(b.think<=0){b.think=.12;let enemy=null,near=34;for(const a of s.actors){if(!a.alive||a.team===b.team)continue;const d=b.pos.distanceTo(a.pos);if(d>near)continue;targetEye.copy(a.pos);targetEye.y+=a.eye||1.5;if(s.world.clear(eye,targetEye)){near=d;enemy=a;}}
 if(enemy!==b.target){b.target=enemy;b.reaction=.35+s.rng()*.25;b.burst=2+Math.floor(s.rng()*3);}
 if(enemy){b.state=b.hp<25?'retreat':'engage';}
 else {let goal=b.goal;if(s.bomb.planted&&b.team){goal=nearest(s,s.bomb.pos.x,s.bomb.pos.z);b.state='advance';}else if(b.hp<25){goal=b.team?15:1;b.state='retreat';}else if(b.heardTime>0){goal=nearest(s,b.heard.x,b.heard.z);b.state='investigate';}else if(!b.team){goal=s.siteChoice===0?13:16;b.state='advance';if(s.bomb.dropped&&b.carrier)goal=nearest(s,s.bomb.pos.x,s.bomb.pos.z);}else if(b.timer>9+(b.id-3)*4){b.state='patrol';goal=[13,14,15,16,12,11,10,9,8][Math.floor(b.timer/7+b.id)%9];}else b.state='hold';if(goal!==b.goal||b.path.length===0)route(s,b,goal);}
 }
 let vx=0,vz=0;
 if(b.target&&b.target.alive){targetEye.copy(b.target.pos);targetEye.y+=b.target.eye||1.48;aim.subVectors(targetEye,eye);const distance=aim.length();b.yaw=Math.atan2(-aim.x,-aim.z);b.reaction-=dt;if(b.reaction<=0&&b.cool<=0&&b.pause<=0&&s.world.clear(eye,targetEye)){aim.normalize();const error=.009+distance*.00075+(b.hp<25?.02:0);aim.x+=(s.rng()-.5)*error*2;aim.y+=(s.rng()-.5)*error*2;aim.z+=(s.rng()-.5)*error*2;aim.normalize();trace(s,b,eye,aim,b.team?20:25);b.cool=.14;if(--b.burst<=0){b.pause=.5+s.rng()*.55;b.burst=2+Math.floor(s.rng()*3);}s.hear(eye,b.team);if(s.player.pos.distanceTo(b.pos)<20)s.audio.play('rifle');}
 if(b.state==='retreat'){vx=-aim.x*2;vz=-aim.z*2;}
 }else if(b.state!=='hold'&&b.pathIndex<b.path.length){const node=s.world.nodes[b.path[b.pathIndex]],dx=node.x-b.pos.x,dz=node.z-b.pos.z,d=Math.hypot(dx,dz);if(d<.7)b.pathIndex++;else {vx=dx/d*2.7;vz=dz/d*2.7;b.yaw=Math.atan2(-dx,-dz);}}
 // Objectives require staying still at the site; damage/contacts interrupt progress.
 if(b.carrier&&!s.bomb.planted&&!b.target){const site=s.world.sites[s.siteChoice];if(s.bomb.dropped&&b.pos.distanceTo(s.bomb.pos)<1.3){s.bomb.dropped=false;s.bomb.carrier=b;s.callout('Mica: Charge recovered.');}if(s.bomb.carrier===b&&Math.hypot(b.pos.x-site.x,b.pos.z-site.z)<2.3){vx=vz=0;b.state='plant';b.plant+=dt;if(b.plant>=4)s.plant(b,site);}else b.plant=0;}
 if(b.team&&s.bomb.planted&&!b.target&&b.pos.distanceTo(s.bomb.pos)<2.3){vx=vz=0;b.state='defuse';b.defuse+=dt;s.bomb.defuser=b;s.bomb.progress=b.defuse/5;if(b.defuse>=5)s.endRound(1,'CHARGE DEFUSED');}else {if(s.bomb.defuser===b){s.bomb.defuser=null;s.bomb.progress=0;}b.defuse=0;}
 b.vel.x+=(vx-b.vel.x)*Math.min(1,dt*9);b.vel.z+=(vz-b.vel.z)*Math.min(1,dt*9);moveBody(b,b.vel.x*dt,b.vel.z*dt,dt,s.world);
 }
}
export function renderBots(s){for(const b of s.bots){b.root.visible=b.alive;b.root.position.copy(b.pos);b.root.rotation.y=b.yaw;const walk=Math.sin(s.time*10)*Math.min(.5,Math.hypot(b.vel.x,b.vel.z)*.16);b.legs[0].rotation.x=walk;b.legs[1].rotation.x=-walk;}}
