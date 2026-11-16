// IRONHOLD: one authoritative state, a fixed 60 Hz simulation, and a separate
// presentation pass. Capture mode uses the exact same map, actors and HUD.
import * as T from 'three';
import {mulberry32,clamp} from './rng.js';
import {P} from './palette.js';
import {createWorld} from './world.js';
import {createPlayer,updatePlayer} from './player.js';
import {createWeapon,updateWeapon,renderWeapon,reload,throwGrenade,equip} from './weapon.js';
import {createBots,updateBots,renderBots,hear} from './bots.js';
import {initMatch,updateMatch,buy} from './match.js';
import {createHud} from './hud.js';
import {createAudio} from './audio.js';
import {createEffects} from './effects.js';
const query=new URLSearchParams(location.search),shot=query.get('shot'),seed=Number(query.get('seed')||1);
const scene=new T.Scene();scene.background=new T.Color(P.sky);scene.fog=new T.FogExp2(P.fog,.018);
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;document.body.prepend(renderer.domElement);
const camera=new T.PerspectiveCamera(74,innerWidth/innerHeight,.06,130);scene.add(camera);
const s={scene,camera,renderer,rng:mulberry32(seed),shot,keys:new Set(),firing:false,started:false,locked:false,time:0,hit:0,hurt:0,hurtYaw:0,shake:0,spread:.004};
s.world=createWorld(scene);s.player=createPlayer();s.bots=createBots(scene);s.actors=[s.player,...s.bots];s.weapon=createWeapon(camera,scene);s.audio=createAudio();s.effects=createEffects(scene);s.hud=createHud();s.hear=(p,team)=>hear(s,p,team);initMatch(s);
const bombMesh=new T.Group(),caseMesh=new T.Mesh(new T.BoxGeometry(.55,.22,.38),new T.MeshStandardMaterial({color:0x3a4540,metalness:.4,roughness:.6})),lamp=new T.Mesh(new T.BoxGeometry(.16,.025,.09),new T.MeshBasicMaterial({color:P.amber}));lamp.position.y=.13;bombMesh.add(caseMesh,lamp);scene.add(bombMesh);
const dom=s.hud.dom;
function begin(){if(shot)return;s.started=true;s.audio.unlock();dom.start.classList.add('hidden');renderer.domElement.requestPointerLock();}
document.getElementById('play').addEventListener('click',begin);document.getElementById('restart').addEventListener('click',()=>{s.player.kills=0;s.weapon.index=0;s.weapon.grenades=0;s.player.armour=0;initMatch(s);begin();});
for(const button of document.querySelectorAll('[data-buy]'))button.addEventListener('click',()=>buy(s,Number(button.dataset.buy)));
document.addEventListener('pointerlockchange',()=>{s.locked=!!document.pointerLockElement;s.firing=false;s.keys.clear();if(!s.locked&&s.started&&s.phase!=='match'&&!s.buyOpen&&!shot){dom.start.classList.remove('hidden');document.getElementById('play').textContent='RESUME OPERATION →';}});
document.addEventListener('mousemove',e=>{if(!s.locked||shot||s.buyOpen)return;s.player.yaw-=e.movementX*.002;s.player.pitch=clamp(s.player.pitch-e.movementY*.002,-1.4,1.4);});
document.addEventListener('mousedown',e=>{if(e.button===0&&s.locked&&!s.buyOpen)s.firing=true;});document.addEventListener('mouseup',()=>s.firing=false);
document.addEventListener('keydown',e=>{if(shot)return;if(['Space','ControlLeft','ControlRight','KeyB','Digit1','Digit2','Digit3','Digit4','Digit5'].includes(e.code))e.preventDefault();s.keys.add(e.code);if(e.repeat||!s.started)return;if(e.code==='KeyR')reload(s);if(e.code==='KeyG')throwGrenade(s);if(e.code==='KeyB'&&s.phase==='buy'){s.buyOpen=!s.buyOpen;s.firing=false;if(s.buyOpen){document.exitPointerLock();dom.start.classList.add('hidden');}else renderer.domElement.requestPointerLock();}if(s.phase==='buy'&&/^Digit[1-5]$/.test(e.code))buy(s,Number(e.code.slice(-1)));});
document.addEventListener('keyup',e=>s.keys.delete(e.code));window.addEventListener('blur',()=>{s.keys.clear();s.firing=false;});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(shot)render();});
function step(dt){s.time+=dt;s.hit=Math.max(0,s.hit-dt);s.hurt=Math.max(0,s.hurt-dt);s.shake=Math.max(0,s.shake-dt*2);
 if(s.player.alive&&!s.buyOpen&&(s.phase==='live'||s.phase==='buy'))updatePlayer(s,dt);else {s.player.vel.x=0;s.player.vel.z=0;s.player.kick*=Math.exp(-dt*8);}
 updateWeapon(s,dt);updateBots(s,dt);const wasBuying=s.buyOpen;updateMatch(s,dt);if(wasBuying&&!s.buyOpen&&!s.locked){dom.start.classList.remove('hidden');document.getElementById('play').textContent='RESUME OPERATION →';}s.effects.step(dt);
}
function render(){const p=s.player;camera.position.copy(p.pos);camera.position.y+=p.eye;const shake=Math.sin(s.time*92)*s.shake*.018;camera.rotation.set(p.pitch+p.kick+shake,p.yaw+shake*.5,shake,'YXZ');renderWeapon(s);renderBots(s);bombMesh.visible=s.bomb.planted||s.bomb.dropped;if(bombMesh.visible){bombMesh.position.copy(s.bomb.pos);bombMesh.position.y+=.15;lamp.visible=!s.bomb.planted||Math.floor(s.bomb.fuse*5)%2===0;}s.hud.update(s);renderer.render(scene,camera);}
// Explicit capture fixtures are deterministic, readable operation moments, not
// alternate artwork. No click, audio context, clock or pointer lock is needed.
function capture(kind){s.started=kind!=='start';s.phase=kind==='start'?'buy':'live';s.time=24;s.money=kind==='start'?800:2175;
 if(kind==='start'){s.player.yaw=.035;s.callout('Rook: Ready on Furnace lane.');}
 else {dom.start.classList.add('hidden');equip(s,1);s.player.armour=76;s.player.hp=84;s.weapon.mag=23;s.weapon.grenades=1;s.round=3;s.score[0]=1;s.score[1]=1;s.roundTime=63;s.player.pos.set(12,0,6);s.player.yaw=-.18;s.player.pitch=.015;s.bots[0].pos.set(11.5,0,-1);s.bots[0].yaw=0;s.bots[1].pos.set(18,0,-3);s.bots[1].yaw=.2;s.bots[2].pos.set(12,0,-10);s.bots[2].yaw=2.9;s.bots[3].pos.set(15,0,-8);s.bots[4].pos.set(-17,0,-10);s.callout('Rook: Contact, Crane lane. I’m with you.');s.feed.unshift({text:'Mica  / HEADSHOT /  Cinder',time:6,team:0});s.bots[3].alive=false;
 if(kind==='play'){s.weapon.flash=.1;s.weapon.flashMesh.visible=true;s.weapon.bloom=.012;s.spread=.018;s.effects.tracer(new T.Vector3(12,1.4,-10),new T.Vector3(12,1.1,5));s.effects.tracer(new T.Vector3(12.2,1.4,5.2),new T.Vector3(12,1.4,-10));}
 if(kind==='end'){s.player.pos.set(17,0,-2);s.player.yaw=0;s.player.pitch=-.06;s.bomb.planted=true;s.bomb.pos.set(17,.12,-11);s.bomb.fuse=0;s.phase='end';s.phaseTime=5;s.score[0]=2;s.banner='ROUND 3 — RAIDERS WIN';s.reason='CHARGE DETONATED';s.effects.burst(s.bomb.pos,s.rng,70);s.effects.step(.16);s.bots[2].alive=false;s.bots[4].alive=false;s.callout('Mica: Yard secured. Good work.');}}
 render();requestAnimationFrame(()=>{render();window.__shotReady=true;});}
if(shot&&['start','play','end'].includes(shot))capture(shot);
else {let last=performance.now(),acc=0;function frame(now){requestAnimationFrame(frame);const elapsed=Math.min(.1,(now-last)/1000);last=now;if(s.started&&(s.locked||s.buyOpen)&&s.phase!=='match'){acc+=elapsed;while(acc>=1/60){step(1/60);acc-=1/60;}}else acc=0;render();}requestAnimationFrame(frame);}
// Deliberately exposed read-only reference for local diagnostics, not required
// by the screenshot harness (which only waits for __shotReady).
window.ironhold=s;
