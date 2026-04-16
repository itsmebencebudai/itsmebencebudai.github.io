(function(){
  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x7a4a1a, 0.016);

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth/window.innerHeight, 0.1, 300);
  camera.position.set(14, 8, 20);
  camera.lookAt(0, 3.5, 0);

  // ── LIGHTS ──
  scene.add(new THREE.AmbientLight(0xffeedd, 0.5));

  const sun = new THREE.DirectionalLight(0xffcc88, 2.5);
  sun.position.set(25, 35, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 120;
  sun.shadow.camera.left = -35; sun.shadow.camera.right = 35;
  sun.shadow.camera.top = 35; sun.shadow.camera.bottom = -35;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const fill = new THREE.PointLight(0xff7722, 1.4, 60);
  fill.position.set(-12, 10, 8);
  scene.add(fill);

  scene.add(new THREE.HemisphereLight(0xffd080, 0x6a3a10, 0.7));

  // ── SKY DOME ──
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {uTime:{value:0}},
    vertexShader:`varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`
      uniform float uTime; varying vec3 vPos;
      void main(){
        float t=clamp((vPos.y+30.)/120.,0.,1.);
        vec3 top=vec3(0.08,0.18,0.52);
        vec3 mid=vec3(0.78,0.35,0.10);
        vec3 bot=vec3(0.95,0.70,0.25);
        vec3 c=mix(bot,mid,smoothstep(0.,.45,t));
        c=mix(c,top,smoothstep(0.35,1.,t));
        c+=0.025*sin(uTime*0.25);
        gl_FragColor=vec4(c,1.);
      }
    `
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(120,16,16), skyMat));

  // Sun disc
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(3.5,32), new THREE.MeshBasicMaterial({color:0xfffbe0}));
  sunDisc.position.set(-28,28,-90); sunDisc.lookAt(camera.position); scene.add(sunDisc);
  const sunHalo = new THREE.Mesh(new THREE.CircleGeometry(8,32), new THREE.MeshBasicMaterial({color:0xffaa44,transparent:true,opacity:.15}));
  sunHalo.position.copy(sunDisc.position); sunHalo.lookAt(camera.position); scene.add(sunHalo);

  // ── GROUND ──
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(150,150), new THREE.MeshLambertMaterial({color:0x4a7a32}));
  gnd.rotation.x=-Math.PI/2; gnd.receiveShadow=true; scene.add(gnd);
  const dirt = new THREE.Mesh(new THREE.PlaneGeometry(22,18), new THREE.MeshLambertMaterial({color:0x8c5a28}));
  dirt.rotation.x=-Math.PI/2; dirt.position.y=0.01; dirt.receiveShadow=true; scene.add(dirt);
  // Path
  const pathM = new THREE.Mesh(new THREE.BoxGeometry(3,.03,14), new THREE.MeshLambertMaterial({color:0xa07840}));
  pathM.position.set(0,.02,8); pathM.receiveShadow=true; scene.add(pathM);

  // ── HELPERS ──
  function mstd(col,rough=0.82,metal=0){return new THREE.MeshStandardMaterial({color:col,roughness:rough,metalness:metal});}
  function bbox(w,h,d,col,r,m){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mstd(col,r,m));
    mesh.castShadow=true; mesh.receiveShadow=true; return mesh;
  }

  // ── HOUSE ──
  const house = new THREE.Group(); scene.add(house);
  const buildParts=[];
  const roofPanels=[];

  function part(mesh,delay,dur){
    mesh.scale.y=0.001;
    mesh.userData.d=delay;
    mesh.userData.dur=dur;
    mesh.userData.startY=mesh.position.y - 20;
    mesh.userData.targetY=mesh.position.y;
    mesh.position.y=mesh.userData.startY;
    buildParts.push(mesh);
  }

  // Foundation
  const fnd=bbox(9,.55,8.35,0xb0a090,.92); fnd.position.set(0,.27,0); house.add(fnd); part(fnd,0,.07);

  // Walls
  const fwall=bbox(9,5.2,.35,0xd4a86a,.84); fwall.position.set(0,2.87,4.0); house.add(fwall); part(fwall,.07,.18);
  const bwall=bbox(9,5.2,.35,0xc89858,.84); bwall.position.set(0,2.87,-4.0); house.add(bwall); part(bwall,.07,.18);
  const lwall=bbox(.35,5.2,8.0,0xcc9460,.84); lwall.position.set(-4.325,2.87,0); house.add(lwall); part(lwall,.10,.18);
  const rwall=bbox(.35,5.2,8.0,0xcc9460,.84); rwall.position.set(4.325,2.87,0); house.add(rwall); part(rwall,.10,.18);

  // Brick rows on front wall
  const frontWallWidth=9.0;
  const frontWallHeight=5.2;
  const frontWallZ=4.19;
  const frontWallBottom=.12;
  const frontBrickWidths=[
    [1.0,1.1,0.9,1.0,0.8,1.2,0.9,1.1,0.9],
    [1.2,0.8,1.0,1.1,0.7,1.3,0.9,1.0,1.0],
    [0.9,1.0,1.2,0.8,1.1,1.0,0.9,1.1,0.9],
    [1.1,0.9,1.0,1.2,0.8,1.0,1.0,0.9,1.1],
    [1.0,1.1,0.8,1.3,0.9,1.0,1.0,0.9,0.9],
    [1.2,0.8,1.1,0.9,1.0,1.0,0.9,1.0,1.1],
    [0.9,1.0,1.0,1.2,0.8,1.1,1.0,0.9,1.1],
    [1.0,1.1,0.9,1.0,0.8,1.2,0.9,1.0,1.1],
    [1.1,0.9,1.1,1.0,0.8,1.0,1.0,0.9,1.1],
    [1.0,1.0,1.0,1.1,0.9,1.0,1.0,0.9,1.0],
    [1.0,1.1,1.0,0.9,1.0,1.1,0.9,1.0,1.0]
  ];
  const frontBrickHeights=[.42,.46,.38,.50,.44,.40,.52,.38,.54,.40,.45];
  let yCursor=frontWallBottom;
  for(let row=0;row<frontBrickWidths.length;row++){
    const widths=frontBrickWidths[row];
    const h=frontBrickHeights[row];
    const rowTotal=widths.reduce((sum,w)=>sum+w,0);
    let x=-frontWallWidth/2 + (frontWallWidth-rowTotal)/2;
    const yCenter=yCursor + h/2;
    for(let col=0;col<widths.length;col++){
      const w=widths[col];
      const yJitter=(((col+row)%2===0)?0.03:-0.02);
      const brk=bbox(w,h,.08,(row%2===0)?0xc08050:0xd4a060,.9);
      x += w/2;
      brk.position.set(x,yCenter+yJitter,frontWallZ);
      x += w/2;
      house.add(brk); part(brk,.08+row*.022+col*.003,.05);
    }
    yCursor += h;
  }

  // Brick rows on right wall
  const rightWallDepth=8.0;
  const rightWallHeight=5.2;
  const rightWallX=4.52;
  const rightWallBottom=.12;
  const rightBrickWidths=[
    [1.0,1.0,0.9,1.1,0.8,1.0,1.1,1.0],
    [1.1,0.8,1.0,1.0,0.9,1.1,0.7,1.4],
    [0.9,1.0,1.2,0.8,1.1,1.0,0.9,1.1],
    [1.0,0.9,1.0,1.2,0.8,1.1,1.0,1.0],
    [1.1,0.8,1.1,0.9,1.0,1.0,1.0,1.1],
    [1.0,1.1,0.9,1.0,0.8,1.1,1.0,1.1],
    [1.1,0.9,1.0,1.0,0.8,1.0,1.1,1.1],
    [1.0,1.0,0.9,1.1,0.8,1.0,1.0,1.0],
    [1.1,0.9,1.0,1.0,0.8,1.0,1.0,1.0],
    [1.0,1.0,1.0,1.0,0.8,1.0,1.1,0.9],
    [1.0,1.0,0.9,1.1,0.8,1.0,1.0,1.1]
  ];
  const rightBrickHeights=[.42,.46,.38,.50,.44,.40,.52,.38,.54,.40,.45];
  yCursor=rightWallBottom;
  for(let row=0;row<rightBrickWidths.length;row++){
    const widths=rightBrickWidths[row];
    const h=rightBrickHeights[row];
    const rowTotal=widths.reduce((sum,w)=>sum+w,0);
    let z=-rightWallDepth/2 + (rightWallDepth-rowTotal)/2;
    const yCenter=yCursor + h/2;
    for(let col=0;col<widths.length;col++){
      const w=widths[col];
      const yJitter=(((col+row)%2===0)?0.03:-0.02);
      const brk=bbox(w,h,.08,(row%2===0)?0xc08050:0xd4a060,.9);
      brk.rotation.y=-Math.PI/2;
      z += w/2;
      brk.position.set(rightWallX,yCenter+yJitter,z);
      z += w/2;
      house.add(brk); part(brk,.08+row*.022+col*.003,.05);
    }
    yCursor += h;
  }

  // Door
  const dframe=bbox(1.8,3.2,.4,0x7a4a22,.72); dframe.position.set(0,2.1,4.2); house.add(dframe); part(dframe,.25,.09);
  const door=bbox(1.45,2.85,.12,0x5a3010,.65); door.position.set(0,1.92,4.28); house.add(door); part(door,.27,.08);
  const knob=new THREE.Mesh(new THREE.SphereGeometry(.1,8,8),mstd(0xf0c040,.2,.85));
  knob.position.set(.56,1.75,4.38); knob.castShadow=true; house.add(knob); part(knob,.29,.05);

  // Windows
  function mkWin(x,y,z,ry=0){
    const wg=new THREE.Group();
    const fr=bbox(1.8,1.6,.18,0x8a6030,.72); wg.add(fr);
    const gl=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.3,.06),new THREE.MeshStandardMaterial({color:0x88c8f8,roughness:.08,metalness:.1,transparent:true,opacity:.78}));
    gl.position.z=.09; wg.add(gl);
    const hb=bbox(1.5,.07,.1,0x8a6030,.7); hb.position.z=.13; wg.add(hb);
    const vb=bbox(.07,1.3,.1,0x8a6030,.7); vb.position.z=.13; wg.add(vb);
    wg.position.set(x,y,z); wg.rotation.y=ry;
    house.add(wg); return wg;
  }
  part(mkWin(-2.7,3.6,4.18),.30,.09);
  part(mkWin( 2.7,3.6,4.18),.32,.09);
  part(mkWin(-4.18,3.6,1.5,Math.PI/2),.34,.09);
  part(mkWin(-4.18,3.6,-1.5,Math.PI/2),.36,.09);

  // Roof group
  const roofG=new THREE.Group(); house.add(roofG); part(roofG,.44,.16);
  const wallTop=2.87 + 5.2/2; // align gable base with side wall tops
  roofG.userData.startY=-20; // start far below the scene
  roofG.userData.targetY=0;
  roofG.position.y=roofG.userData.startY;
  roofG.userData.skipScale=true;
  // Ridge peak line
  const ridgeH=8.5;
  // Left slope panel
  const ls=bbox(9.8,.28,5.2,0x7a3820,.88);
  ls.userData.d=roofG.userData.d;
  ls.userData.dur=roofG.userData.dur;
  ls.userData.startX=Math.PI/2;
  ls.userData.targetX=Math.PI/5.5;
  ls.userData.startZ=0;
  ls.userData.targetZ=2.1;
  ls.userData.openDelay=0.75;
  ls.rotation.x=ls.userData.startX;
  ls.position.set(0,7,0);
  roofG.add(ls);
  roofPanels.push(ls);
  const rs=bbox(9.8,.28,5.2,0x7a3820,.88);
  rs.userData.d=roofG.userData.d;
  rs.userData.dur=roofG.userData.dur;
  rs.userData.startX=-Math.PI/2;
  rs.userData.targetX=-Math.PI/5.5;
  rs.userData.startZ=0;
  rs.userData.targetZ=-2.1;
  rs.userData.openDelay=0.75;
  rs.rotation.x=rs.userData.startX;
  rs.position.set(0,7,0);
  roofG.add(rs);
  roofPanels.push(rs);
  // Gable triangles
  const gshape=new THREE.Shape();
  gshape.moveTo(-4.0, wallTop); gshape.lineTo(4.0, wallTop); gshape.lineTo(0, ridgeH); gshape.closePath();
  const gext={depth:.01,bevelEnabled:false};
  const gb1=new THREE.Mesh(new THREE.ExtrudeGeometry(gshape,gext),mstd(0xcc9460,.9));
  gb1.position.set(-4.5,0,0); gb1.rotation.y=Math.PI/2; gb1.castShadow=true; gb1.receiveShadow=true; roofG.add(gb1);
  const gb2=new THREE.Mesh(new THREE.ExtrudeGeometry(gshape,gext),mstd(0xcc9460,.9));
  gb2.position.set(4.5,0,0); gb2.rotation.y=-Math.PI/2; gb2.castShadow=true; gb2.receiveShadow=true; roofG.add(gb2);
  // Ridge cap
  const ridge=bbox(9.8,.22,.22,0x601c0a,.8); ridge.position.set(0,8.5,0); roofG.add(ridge);

  // Chimney
  const chimG=new THREE.Group();
  const chbody=bbox(1.1,3.2,1.1,0xc09058,.9); chbody.position.y=1.6; chimG.add(chbody);
  const chcap=bbox(1.3,.2,1.3,0x888070,.95); chcap.position.y=3.3; chimG.add(chcap);
  chimG.position.set(2.8,6.8,-1.8); chimG.scale.y=0.001; house.add(chimG); part(chimG,.60,.10);
  const chimneyDoneThreshold = chimG.userData.d + chimG.userData.dur + 0.02;

  // Porch steps
  for(let i=0;i<3;i++){
    const st=bbox(2.2+.3*i,.28,.55,0xb0a090,.9);
    st.position.set(0,.14+(2-i)*.28,4.6+i*.35); house.add(st); part(st,.38+i*.02,.06);
  }

  // ── SCAFFOLDING ──
  const scaff=new THREE.Group(); scaff.position.set(5.8,0,0); scene.add(scaff);
  function spole(x,z,h){const p=bbox(.14,h,.14,0xa0a8b8,.3,.75);p.position.set(x,h/2,z);scaff.add(p);}
  function splank(y){const pl=bbox(1.6,.14,1.4,0xb87030,.82);pl.position.set(0,y,0);scaff.add(pl);}
  spole(-.7,-.6,8);spole(.7,-.6,8);spole(-.7,.6,8);spole(.7,.6,8);
  splank(2);splank(4.2);splank(6.5);
  for(let h=0;h<4;h++){
    const br=bbox(1.45,.07,.07,0x9098b0,.4,.6);br.position.set(0,1+h*2,-.6);br.rotation.z=Math.PI/4;scaff.add(br);
  }

  // ── CRANE ──
  const craneG=new THREE.Group(); craneG.position.set(10,0,-3); scene.add(craneG);
  // Mast
  const mast=bbox(.55,14,.55,0xf0c040,.45,.45); mast.position.y=7; craneG.add(mast);
  // Jib
  const jib=bbox(12,.38,.38,0xf0c040,.45,.45); jib.position.set(-4,14,0); craneG.add(jib);
  const cjib=bbox(4,.32,.32,0xf0c040,.45,.45); cjib.position.set(5,14,0); craneG.add(cjib);
  const cwt=bbox(1.6,1.4,1.2,0x888888,.6,.25); cwt.position.set(7,13.4,0); craneG.add(cwt);
  // Lattice braces on mast
  for(let i=0;i<6;i++){
    const la=bbox(.1,3,.1,0xe0b030,.5,.4);la.position.set(.32,1.5+i*2.2,.32);la.rotation.y=Math.PI/4;craneG.add(la);
  }
  // Cable
  const cableGeo=new THREE.CylinderGeometry(.035,.035,7,6);
  const cable=new THREE.Mesh(cableGeo,new THREE.MeshBasicMaterial({color:0x888888}));
  cable.position.set(-9,10.5,0); craneG.add(cable);
  // Hook
  const hkGeo=new THREE.TorusGeometry(.26,.07,8,18,Math.PI);
  const hk=new THREE.Mesh(hkGeo,mstd(0x909090,.35,.8)); hk.position.set(-9,7,0); hk.rotation.z=Math.PI; craneG.add(hk);
  // Hanging load - brick pallet
  const pallet=bbox(1.2,1,1,0xd4a86a,.9); pallet.position.set(-9,6.1,0); craneG.add(pallet);

  // ── TREES ──
  function tree(x,z,s=1){
    const tg=new THREE.Group();
    const tr=bbox(.32*s,1.8*s,.32*s,0x7a5020,.9); tr.position.y=.9*s; tg.add(tr);
    const f=new THREE.Mesh(new THREE.ConeGeometry(1.4*s,2.8*s,7),new THREE.MeshLambertMaterial({color:0x2a6020}));
    f.position.y=3.1*s; f.castShadow=true; tg.add(f);
    const f2=new THREE.Mesh(new THREE.ConeGeometry(1.0*s,2.2*s,7),new THREE.MeshLambertMaterial({color:0x336a24}));
    f2.position.y=4.4*s; f2.castShadow=true; tg.add(f2);
    tg.position.set(x,0,z); scene.add(tg);
  }
  tree(-11,-5,1.3);tree(-13,2,1.0);tree(-10,6,.85);tree(-14,8,.7);
  tree(12,-4,1.1);tree(14,3,.9);tree(12,7,1.2);tree(15,9,.75);
  tree(-7,-9,.8);tree(8,-10,.95);tree(-5,12,.7);tree(9,11,.8);

  // ── MATERIAL PILES ──
  // Separate offsets for wood and bricks:
  //  - positive x moves right
  //  - negative x moves left
  //  - positive z moves forward
  //  - negative z moves backward
  const woodOffset = { x: 1.5, z: 2 };
  const brickOffset = { x: 4, z: 1.5 };
  const woodPositions=[
    [-8.4 + woodOffset.x,.14,5.4 + woodOffset.z],
    [-8.1 + woodOffset.x,.27,5.4 + woodOffset.z],
    [-8.7 + woodOffset.x,.40,5.4 + woodOffset.z],
    [-8.3 + woodOffset.x,.53,5.4 + woodOffset.z],
    [-9.0 + woodOffset.x,.14,5.0 + woodOffset.z],
    [-8.6 + woodOffset.x,.27,5.0 + woodOffset.z],
    [-9.2 + woodOffset.x,.40,5.0 + woodOffset.z],
    [-8.8 + woodOffset.x,.53,5.0 + woodOffset.z]
  ];
  for(let i=0;i<8;i++){
    const pl=bbox(2.2,.16,.35,0xb87030,.85);
    pl.position.set(...woodPositions[i]);
    pl.rotation.y=0.15; scene.add(pl);
  }
  const brickCols=3;
  const brickRows=4;
  const brickLayers=4; // stack height in layers
  const bricksToRemove=5; // remove this many bricks from the top/back of the pile
  const brickSpacingX=.54;
  const brickSpacingZ=.32;
  const brickSpacingY=.28;
  const brickStartX=-8.5 + brickOffset.x;
  const brickStartZ=4.4 + brickOffset.z;
  const brickStartY=.12;
  const totalBricks = brickCols * brickRows * brickLayers;
  const bricksToBuild = Math.max(0, totalBricks - Math.min(bricksToRemove, totalBricks));
  let builtBricks = 0;
  for(let layer=0; layer<brickLayers; layer++){
    for(let row=0; row<brickRows; row++){
      for(let col=0; col<brickCols; col++){
        if(builtBricks >= bricksToBuild) continue;
        const br=bbox(.52,.24,.28,0xc04030,.9);
        const x=brickStartX + col*brickSpacingX;
        const y=brickStartY + layer*brickSpacingY;
        const z=brickStartZ + row*brickSpacingZ;
        br.position.set(x,y,z);
        br.castShadow=true; scene.add(br);
        builtBricks++;
      }
    }
  }
  const sandG=new THREE.Mesh(new THREE.CylinderGeometry(.1,2,1.4,12),mstd(0xe8c870,.95));
  sandG.position.set(-7.2,.75,2.2); sandG.castShadow=true; scene.add(sandG);

  // Cement mixer
  const mixG=new THREE.Group(); mixG.position.set(7.5,0,4);
  const mixBase=bbox(1.7,.36,1.7,0x888888,.7,.2); mixBase.position.y=.18; mixG.add(mixBase);

  const supportLegs=[[-.65,0,-.65],[.65,0,-.65],[-.65,0,.65],[.65,0,.65]];
  supportLegs.forEach(([x,y,z])=>{
    const leg=bbox(.14,1.4,.14,0x707070,.4,.7);
    leg.position.set(x,.7,z);
    leg.rotation.z=(z>0?-.18:.18);
    leg.rotation.x=(x>0?-.12:.12);
    mixG.add(leg);
  });

  const drumPivot=new THREE.Group();
  drumPivot.position.set(0,1.2,0);
  mixG.add(drumPivot);

  const drum=new THREE.Mesh(
    new THREE.CylinderGeometry(.72,.72,1.7,18,1,true),
    new THREE.MeshStandardMaterial({color:0xf4a020,roughness:.4,metalness:.05,side:THREE.DoubleSide})
  );
  drum.rotation.z=Math.PI/10;
  drum.castShadow=true; drum.receiveShadow=true;
  drum.rotation.y=Math.PI;
  drumPivot.add(drum);

  const drumRim=new THREE.Mesh(new THREE.TorusGeometry(.78,.08,12,24),mstd(0x6d3a12,.7,.15));
  drumRim.rotation.x=Math.PI/2;
  drumPivot.add(drumRim);

  const chute=new THREE.Mesh(new THREE.BoxGeometry(.24,.56,1.1),mstd(0x777777,.45,.1));
  chute.position.set(-.8,1.05,0);
  chute.rotation.z=-Math.PI/10;
  mixG.add(chute);

  const motor=bbox(.6,.44,.78,0x333333,.9,.2);
  motor.position.set(1.2,.34,-.45); mixG.add(motor);
  const motorTop=bbox(.5,.2,.5,0x222222,.9,.2);
  motorTop.position.set(1.2,.68,-.45); mixG.add(motorTop);

  scene.add(mixG);

  // ── SMOKE ──
  const smokes=[];
  for(let i=0;i<16;i++){
    const sm=new THREE.Mesh(new THREE.SphereGeometry(.22+Math.random()*.28,6,6),
      new THREE.MeshBasicMaterial({color:0xbbbbbb,transparent:true,opacity:.35}));
    sm.userData.spd=.35+Math.random()*.45;
    sm.userData.off=Math.random()*Math.PI*2;
    sm.userData.ox=(Math.random()-.5)*.3;
    sm.visible=false; scene.add(sm); smokes.push(sm);
  }

  // ── DUST POINTS ──
  const dcount=300;
  const dpos=new Float32Array(dcount*3);
  for(let i=0;i<dcount;i++){dpos[i*3]=(Math.random()-.5)*24;dpos[i*3+1]=Math.random()*10;dpos[i*3+2]=(Math.random()-.5)*18;}
  const dgeo=new THREE.BufferGeometry(); dgeo.setAttribute('position',new THREE.BufferAttribute(dpos,3));
  scene.add(new THREE.Points(dgeo,new THREE.PointsMaterial({color:0xd4a060,size:.08,transparent:true,opacity:.45})));

  // ── ANIMATION ──
  const clock=new THREE.Clock();
  let totalT=0;
  const BUILD_DUR=9;
  const SMOKE_FADE_DUR=1.2;
  const smokeStartT = chimneyDoneThreshold * BUILD_DUR;
  const pbar=document.getElementById('progress-bar');
  const pwrap=document.getElementById('progress-wrap');
  const baseCamAngle=Math.atan2(14,20);
  const camRadius=25;
  let mouseX=0,mouseY=0;
  document.addEventListener('mousemove',e=>{mouseX=(e.clientX/window.innerWidth-.5)*2;mouseY=(e.clientY/window.innerHeight-.5)*2;});

  function easeInOut(t){return t<.5?2*t*t:-1+(4-2*t)*t;}

  function animate(){
    requestAnimationFrame(animate);
    const dt=clock.getDelta();
    const el=clock.getElapsedTime();
    totalT+=dt;

    skyMat.uniforms.uTime.value=el;

    const bp=Math.min(totalT/BUILD_DUR,1.0);
    pbar.style.width=(bp*100).toFixed(1)+'%';
    if(bp>=1) pwrap.classList.add('hidden');

    // Build each part
    buildParts.forEach(p=>{
      const t=Math.max(0,Math.min(1,(bp-p.userData.d)/p.userData.dur));
      const sy=easeInOut(t);
      if(!p.userData.skipScale){
        p.scale.y=Math.max(.001,sy);
      } else {
        p.scale.y=1;
      }
      if(p.userData.startY!==undefined && p.userData.targetY!==undefined){
        p.position.y = p.userData.startY + sy * (p.userData.targetY - p.userData.startY);
      }
      if(p.userData.startX!==undefined && p.userData.targetX!==undefined && p.userData.openDelay===undefined){
        p.rotation.x = p.userData.startX + sy * (p.userData.targetX - p.userData.startX);
      }
      if(p.userData.startZ!==undefined && p.userData.targetZ!==undefined && p.userData.openDelay===undefined){
        p.position.z = p.userData.startZ + sy * (p.userData.targetZ - p.userData.startZ);
      }
    });

    roofPanels.forEach(p=>{
      const t=Math.max(0,Math.min(1,(bp-p.userData.d)/p.userData.dur));
      if(p.userData.openDelay!==undefined){
        const openT=Math.max(0,Math.min(1,(t-p.userData.openDelay)/(1-p.userData.openDelay)));
        const rot=easeInOut(openT);
        if(p.userData.startX!==undefined && p.userData.targetX!==undefined){
          p.rotation.x = p.userData.startX + rot * (p.userData.targetX - p.userData.startX);
        }
        if(p.userData.startZ!==undefined && p.userData.targetZ!==undefined){
          p.position.z = p.userData.startZ + rot * (p.userData.targetZ - p.userData.startZ);
        }
      }
    });

    // Smoke
    smokes.forEach((sm,i)=>{
      const showProgress = Math.max(0, Math.min(1, (totalT - smokeStartT) / SMOKE_FADE_DUR));
      if(showProgress <= 0){
        sm.visible=false;
        return;
      }
      sm.visible=true;
      const raw=(el*sm.userData.spd+sm.userData.off)%5;
      const t=raw/5;
      sm.position.set(
        2.8+sm.userData.ox+Math.sin(el*.8+i)*.15,
        10.2+t*6,
        -1.8
      );
      const fade = easeInOut(showProgress);
      sm.material.opacity = .35 * fade * (1-t);
      sm.scale.setScalar((.4+t*2.5) * (0.8 + 0.2 * fade));
    });

    // Dust drift
    const dp=dgeo.attributes.position.array;
    for(let i=0;i<dcount;i++){
      dp[i*3+1]+=.004; dp[i*3]+=Math.sin(el*.4+i)*.0015;
      if(dp[i*3+1]>10)dp[i*3+1]=0;
    }
    dgeo.attributes.position.needsUpdate=true;

    // Crane sway
    craneG.rotation.y=Math.sin(el*.22)*.22;
    cable.position.y=10.5+Math.sin(el*.7)*.4;
    hk.position.y=7+Math.sin(el*.7)*.4;
    pallet.position.y=6.1+Math.sin(el*.7)*.4;

    // Welding flicker
    fill.intensity=1.2+Math.sin(el*15)*.2;

    // Camera follows cursor only
    const targetX=Math.sin(baseCamAngle+mouseX*.35)*camRadius;
    const targetZ=Math.cos(baseCamAngle+mouseX*.35)*camRadius;
    const targetY=8+mouseY*2+Math.sin(el*.12)*.6;
    camera.position.x+=(targetX-camera.position.x)*.04;
    camera.position.z+=(targetZ-camera.position.z)*.04;
    camera.position.y+=(targetY-camera.position.y)*.04;
    camera.lookAt(0,3.5,0);

    sunHalo.material.opacity=.12+Math.sin(el*.5)*.04;

    renderer.render(scene,camera);
  }
  animate();

  window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
  });
})();
