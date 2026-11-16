import * as T from 'three';
import {P} from './palette.js';
// Foundry Row: a 46 x 32 yard. Cover splits three lanes; all physical
// blocks use the same AABBs for humans, navigation, bullets and grenades.
const AXES=['x','y','z'];
export function createWorld(scene) {
 const colliders=[],solids=[],materials=new Map(),v=new T.Vector3();
 function mat(c,metal=.2){let key=c+':'+metal;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color:c,roughness:.8,metalness:metal}));return materials.get(key);}
 function box(x,y,z,w,h,d,c,solid=true){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);if(solid){colliders.push(new T.Box3(new T.Vector3(x-w/2,y,z-d/2),new T.Vector3(x+w/2,y+h,z+d/2)));solids.push(m);}return m;}
 function cylinder(x,y,z,r,h,c){const m=new T.Mesh(new T.CylinderGeometry(r,r,h,12),mat(c));m.position.set(x,y+h/2,z);m.castShadow=true;scene.add(m);return m;}
 function label(text,x,y,z,w,h,rotation=0,bg='#263b3e',fg='#e7ddbf'){const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,512,256);g.strokeStyle=fg;g.lineWidth=8;g.strokeRect(12,12,488,232);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';g.font='bold 72px sans-serif';g.fillText(text,256,128);const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),side:T.DoubleSide}));m.position.set(x,y,z);m.rotation.y=rotation;scene.add(m);return m;}
 box(0,-.5,0,46, .5,32,P.ground);box(-23,0,0,1,7,33,P.wall);box(23,0,0,1,7,33,P.wall);box(0,0,-16,46,7,1,P.wall);box(0,0,16,46,5,1,P.wall);
 // Backdrop stacks and roofline make a silhouette without external assets.
 for(let x=-20;x<=20;x+=10){box(x,7,-18,7,3,4,P.steel,false);cylinder(x,7,-19,.8,7,P.steel);}
 box(-12,0,-9,10,5,5,P.rust);box(-12,4.8,-9,11,.4,6,P.steel);
 for(let x=-15;x<=-9;x+=3){box(x,.5,-6.45,1.9,3.4,.14,P.amber,false);const light=new T.PointLight(P.amber,26,16,2);light.position.set(x,2,-5.5);scene.add(light);}
 label('FURNACE',-12,4.2,-6.35,6,1.3);label('A',-19,2,-15.4,2,2,0,'#8b4d32');label('B',17,2,-15.4,2,2,0,'#225a5e');
 // Containers flank mid and leave connected routes at either end.
 for(const a of [[-7,2,3,6,3,3,P.rust],[7,0,2,6,3,4,P.steel],[-16,0,4,4,2.4,4,P.steel],[16,0,5,4,2.4,4,P.rust],[-16,0,-2,3,1.3,2,P.rust],[15,0,-7,4,1.4,3,P.steel],[-2,0,-8,3,1.5,3,P.rust],[1,0,7,3,1.5,2,P.steel]])box(...a);
 for(const x of [-9,-5]){box(x,0,3,.3,2,.3,P.steel);}
 // Walkable catwalk over the middle. Stair treads are low enough to step up.
 box(0,2.8,-1,9,.25,2.5,P.steel);for(const z of [-2.2,.2]){box(0,3.05,z,9,.08,.08,P.amber,false);box(0,4,z,9,.08,.08,P.amber,false);for(let x=-4;x<=4;x+=2)box(x,3,z,.08,1,.08,P.steel,false);}
 for(let i=0;i<10;i++)box(-5.1-i*.38,0,-1,.4,(10-i)*.28,2,P.steel);
 // Crane yard gantry, hanging hook and cool work lamps.
 for(const x of [11,21])box(x,0,-11,.5,8,.5,P.rust);box(16,7.8,-11,11,.6,.7,P.rust);box(17,4.5,-11,.08,3.4,.08,P.steel,false);cylinder(17,4,-11,.3,.5,P.amber);
 for(const x of [-20,0,20]){box(x,0,12,.18,6,.18,P.steel);box(x,5.9,11.7,1,.12,.7,P.teal,false);const l=new T.PointLight(P.teal,32,19,2);l.position.set(x,5.7,11);scene.add(l);}
 for(let i=0;i<16;i++){const x=-21+i*2.8;box(x,.008,9.5,1.35,.018,.12,P.cream,false);}
 const sites=[{id:'A',name:'Furnace',x:-18,z:-10},{id:'B',name:'Crane Yard',x:17,z:-11}];
 for(const site of sites){const ring=new T.Mesh(new T.RingGeometry(2.1,2.22,48),new T.MeshBasicMaterial({color:site.id==='A'?P.amber:P.teal,side:T.DoubleSide,transparent:true,opacity:.8}));ring.rotation.x=-Math.PI/2;ring.position.set(site.x,.025,site.z);scene.add(ring);label(site.id+' / CHARGE',site.x,.035,site.z,3,1).rotation.x=-Math.PI/2;}
 label('IRONHOLD / 07',0,4.1,15.42,10,1.4,Math.PI);label('MID',0,5,-15.4,3,1.2);
 const ambient=new T.HemisphereLight(0xa5b6cb,0x4a3326,2);scene.add(ambient);const sun=new T.DirectionalLight(0xffc38a,2.6);sun.position.set(-20,30,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:25,bottom:-25,far:90});sun.shadow.normalBias=.04;scene.add(sun);
 const points=[[-18,12],[0,12],[18,12],[-19,5],[-10,8],[0,4],[10,8],[20,4],[-20,-3],[-10,-3],[0,-4],[9,-4],[20,-4],[-18,-10],[-6,-12],[3,-12],[17,-11]];
 const edges=[[1,3,4],[0,2,4,5,6],[1,6,7],[0,4,8],[0,1,3,5,9],[1,4,6,10],[1,2,5,7,11],[2,6,12],[3,9,13],[4,8,10,14],[5,9,11,15],[6,10,12,15],[7,11,16],[8,14],[9,13,15],[10,11,14,16],[12,15]];
 const nodes=points.map((p,i)=>({x:p[0],z:p[1],edges:edges[i]}));
 // Segment vs slab intersection, allocation-free and shared by AI and bullets.
 function obstruction(origin,dir,max){let nearest=max;for(const b of colliders){let lo=0,hi=nearest;for(const axis of AXES){const d=dir[axis];if(Math.abs(d)<1e-8){if(origin[axis]<b.min[axis]||origin[axis]>b.max[axis]){hi=-1;break;}}else{let a=(b.min[axis]-origin[axis])/d,c=(b.max[axis]-origin[axis])/d;if(a>c){const t=a;a=c;c=t;}lo=Math.max(lo,a);hi=Math.min(hi,c);}}if(hi>=lo&&lo>0.001)nearest=Math.min(nearest,lo);}return nearest;}
 function clear(a,b){v.subVectors(b,a);const d=v.length();v.multiplyScalar(1/(d||1));return obstruction(a,v,d)>=d-.1;}
 return {colliders,solids,sites,nodes,box,label,obstruction,clear};
}
