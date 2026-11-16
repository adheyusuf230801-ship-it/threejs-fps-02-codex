import * as T from 'three';
import {resetBots} from './bots.js';
import {equip,GUNS} from './weapon.js';
export function initMatch(s){Object.assign(s,{phase:'buy',round:0,score:[0,0],money:800,roundTime:100,phaseTime:15,buyOpen:false,siteChoice:0,feed:[],message:'',messageTime:0,banner:'',bomb:{planted:false,dropped:false,carrier:null,pos:new T.Vector3(),fuse:35,progress:0,defuser:null,beep:0},plantProgress:0});
 s.callout=text=>{s.message=text;s.messageTime=4;};
 s.damage=(victim,amount,attacker,head)=>{if(!victim.alive||s.phase!=='live')return;victim.plant=0;victim.defuse=0;if(victim===s.player)s.plantProgress=0;const absorbed=Math.min(victim.armour,amount*.45);victim.armour-=absorbed;victim.hp-=amount-absorbed;if(victim===s.player){s.hurt=.35;s.hurtYaw=Math.atan2(attacker.pos.x-victim.pos.x,attacker.pos.z-victim.pos.z);s.shake=.12;}
 if(victim.hp<=0){victim.hp=0;victim.alive=false;if(attacker===s.player&&victim.team!==attacker.team){s.money+=300;s.player.kills++;}s.feed.unshift({text:attacker.name+'  / '+(head?'HEADSHOT':'ELIM')+' /  '+victim.name,time:6,team:attacker.team});if(s.feed.length>5)s.feed.pop();if(s.bomb.carrier===victim&&!s.bomb.planted){s.bomb.carrier=null;s.bomb.dropped=true;s.bomb.pos.copy(victim.pos);s.callout('Charge dropped. Recover it with E.');}if(victim===s.player)s.callout('You are down. Your squad is still fighting.');}
 };
 s.plant=(actor,site)=>{if(s.bomb.planted)return;s.bomb.planted=true;s.bomb.carrier=null;s.bomb.dropped=false;s.bomb.pos.set(site.x,.12,site.z);s.bomb.fuse=35;s.bomb.beep=0;s.plantProgress=0;if(actor===s.player)s.money+=300;s.callout(actor.name+': Charge armed at '+site.id+'. Hold the site.');s.audio.play('beep');};
 s.endRound=(team,reason)=>{if(s.phase!=='live')return;s.score[team]++;s.phase='end';s.phaseTime=6;s.banner='ROUND '+s.round+' — '+(team===0?'RAIDERS':'WARDENS')+' WIN';s.reason=reason;s.money+=team===0?325:190;s.buyOpen=false;s.audio.play(team===0?'win':'lose');if(s.score[team]>=4){s.phase='match';s.phaseTime=0;document.exitPointerLock?.();}};
 newRound(s);
}
export function newRound(s){s.round++;s.phase='buy';s.phaseTime=15;s.roundTime=100;s.buyOpen=false;s.banner='';s.reason='';s.siteChoice=(s.round-1)%2;s.bomb.planted=false;s.bomb.dropped=false;s.bomb.defuser=null;s.bomb.progress=0;s.plantProgress=0;const p=s.player;if(!p.alive){s.weapon.index=0;p.armour=0;}Object.assign(p,{hp:100,alive:true,yaw:0,pitch:0,kick:0,armour:Math.max(0,p.armour)});p.pos.set(-18,0,12);p.vel.set(0,0,0);resetBots(s);s.bomb.carrier=s.bots[1];equip(s,s.weapon.index);s.weapon.grenade.active=false;s.weapon.grenade.mesh.visible=false;s.callout('Rook: Moving '+(s.siteChoice===0?'Furnace':'Crane Yard')+'. Stay close.');}
export function buy(s,n){if(s.phase!=='buy'||!s.player.alive)return;const cost=[0,2500,1200,300,650][n-1];if(cost===undefined)return;if(s.money<cost){s.callout('Insufficient funds.');return;}if(n===4&&s.weapon.grenades>=1){s.callout('One HE charge maximum.');return;}if(n===5&&s.player.armour>=100)return;s.money-=cost;if(n<=3)equip(s,n-1);if(n===4)s.weapon.grenades++;if(n===5)s.player.armour=100;s.audio.play('reload');}
export function updateMatch(s,dt){s.messageTime=Math.max(0,s.messageTime-dt);for(const f of s.feed)f.time-=dt;
 if(s.phase==='buy'){s.phaseTime-=dt;if(s.phaseTime<=0){s.phase='live';s.buyOpen=false;s.callout('Raiders, breach the yard.');}return;}
 if(s.phase==='end'){s.phaseTime-=dt;if(s.phaseTime<=0)newRound(s);return;}if(s.phase!=='live')return;
 const b=s.bomb,p=s.player;let raiders=0,wardens=0;for(const a of s.actors)if(a.alive){if(a.team===0)raiders++;else wardens++;}
 if(wardens===0){s.endRound(0,'WARDENS ELIMINATED');return;}if(raiders===0&&!b.planted){s.endRound(1,'RAIDERS ELIMINATED');return;}
 if(b.planted){b.fuse-=dt;b.beep-=dt;if(b.beep<=0){s.audio.play('beep');b.beep=b.fuse<8?.25:1;}if(b.fuse<=0){s.effects.burst(b.pos,s.rng,100);s.audio.play('boom');s.shake=1.2;s.endRound(0,'CHARGE DETONATED');return;}}
 else {s.roundTime-=dt;if(s.roundTime<=0){s.endRound(1,'TIME EXPIRED');return;}}
 if(p.alive&&s.keys.has('KeyE')){if(b.dropped&&p.pos.distanceTo(b.pos)<2){b.carrier=p;b.dropped=false;s.callout('Charge recovered. Hold E at a site to plant.');}else if(!b.planted&&b.carrier&&b.carrier.team===0&&b.carrier!==p&&p.pos.distanceTo(b.carrier.pos)<2){b.carrier=p;s.callout('You have the charge.');}
 if(!b.planted&&b.carrier===p){let site=null;for(const a of s.world.sites)if(Math.hypot(p.pos.x-a.x,p.pos.z-a.z)<2.4)site=a;if(site&&Math.hypot(p.vel.x,p.vel.z)<.6){s.plantProgress+=dt;if(s.plantProgress>=4)s.plant(p,site);}else s.plantProgress=0;}}
 else s.plantProgress=0;
}
