import { useState, useRef, useCallback, useEffect } from "react";

const CW = 1080, CH = 1920;

const PH = {
  bx:195, by:110, bw:690, bh:1500, br:70,
  sx:213, sy:168, sw:654, sh:1390, sr:58,
  camCX:540, camCY:208, camR:19,
};

const GRADIENTS = [
  {id:"g1",label:"Ocean",  stops:["#0f2027","#203a43","#2c5364"]},
  {id:"g2",label:"Sunset", stops:["#1a1a2e","#16213e","#e94560"]},
  {id:"g3",label:"Forest", stops:["#0f3443","#1a4a3a","#0f3443"]},
  {id:"g4",label:"Purple", stops:["#2d1b69","#11998e","#2d1b69"]},
  {id:"g5",label:"Rose",   stops:["#1f1c2c","#928dab","#1f1c2c"]},
  {id:"g6",label:"Dark",   stops:["#080810","#111122","#080810"]},
  {id:"g7",label:"Indigo", stops:["#141e30","#243b55","#141e30"]},
  {id:"g8",label:"Mint",   stops:["#003322","#00b09b","#003322"]},
];

const FONTS = [
  {id:"f1",label:"Montserrat",css:"'Montserrat',sans-serif",gfont:"Montserrat:wght@400;700"},
  {id:"f2",label:"Raleway",   css:"'Raleway',sans-serif",   gfont:"Raleway:wght@400;700"},
  {id:"f3",label:"Nunito",    css:"'Nunito',sans-serif",    gfont:"Nunito:wght@400;800"},
  {id:"f4",label:"Poppins",   css:"'Poppins',sans-serif",   gfont:"Poppins:wght@400;700"},
];

function rr(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}
function hx(c){return[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];}
function th(r,g,b){return"#"+[r,g,b].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,"0")).join("");}
function lighten(c,a){const[r,g,b]=hx(c);return th(r+a,g+a,b+a);}
function darken(c,a){const[r,g,b]=hx(c);return th(r-a,g-a,b-a);}

let _tid=3;

export default function App(){
  const [screenshot,setScreenshot]=useState(null);
  const [bgImg,setBgImg]=useState(null);
  const [bgFit,setBgFit]=useState("center");
  const [useBgImg,setUseBgImg]=useState(false);
  const [gradient,setGradient]=useState(GRADIENTS[0]);
  const [phoneColor,setPhoneColor]=useState("#1a1a28");
  const [font,setFont]=useState(FONTS[0]);
  const [texts,setTexts]=useState([
    {id:1,content:"Dosya Yöneticisi",x:0.5,y:0.062,size:76,color:"#ffffff",weight:700},
    {id:2,content:"Hızlı, güvenli ve şık",x:0.5,y:0.108,size:48,color:"#b8d4ff",weight:400},
  ]);
  const [selId,setSelId]=useState(null);
  const [dragging,setDragging]=useState(false);
  const [exporting,setExporting]=useState(false);

  const canvasRef=useRef(null);
  const ssRef=useRef(null);
  const bgRef=useRef(null);
  const dragRef=useRef(null);

  useEffect(()=>{
    const q=FONTS.map(f=>f.gfont).join("&family=");
    const el=document.createElement("link");
    el.rel="stylesheet";
    el.href=`https://fonts.googleapis.com/css2?family=${q}&display=swap`;
    document.head.appendChild(el);
  },[]);

  const loadImg=(file,cb)=>{const img=new Image();img.onload=()=>cb(img);img.src=URL.createObjectURL(file);};
  const onSS=e=>{const f=e.target.files[0];if(f)loadImg(f,setScreenshot);};
  const onBg=e=>{const f=e.target.files[0];if(f)loadImg(f,img=>{setBgImg(img);setUseBgImg(true);});};

  const render=useCallback((canvas,isExport=false)=>{
    const ctx=canvas.getContext("2d");
    canvas.width=CW;canvas.height=CH;

    // background
    if(useBgImg&&bgImg){
      const iw=bgImg.width,ih=bgImg.height;
      if(bgFit==="cover"){
        const sc=CH/ih,dw=iw*sc,dh=CH;
        ctx.fillStyle="#0a0a10";ctx.fillRect(0,0,CW,CH);
        ctx.drawImage(bgImg,(CW-dw)/2,0,dw,dh);
      }else{
        const sc=CW/iw,dh=ih*sc;
        const g=ctx.createLinearGradient(0,0,0,CH);
        g.addColorStop(0,gradient.stops[0]);
        g.addColorStop(0.5,gradient.stops[1]);
        g.addColorStop(1,gradient.stops[2]);
        ctx.fillStyle=g;ctx.fillRect(0,0,CW,CH);
        ctx.drawImage(bgImg,0,(CH-dh)/2,CW,dh);
      }
      const vig=ctx.createRadialGradient(CW/2,CH/2,200,CW/2,CH/2,1000);
      vig.addColorStop(0,"rgba(0,0,0,0)");vig.addColorStop(1,"rgba(0,0,0,0.45)");
      ctx.fillStyle=vig;ctx.fillRect(0,0,CW,CH);
    }else{
      const g=ctx.createLinearGradient(0,0,CW*0.4,CH);
      g.addColorStop(0,gradient.stops[0]);
      g.addColorStop(0.5,gradient.stops[1]);
      g.addColorStop(1,gradient.stops[2]);
      ctx.fillStyle=g;ctx.fillRect(0,0,CW,CH);
      const glow=ctx.createRadialGradient(CW/2,CH/2,0,CW/2,CH/2,700);
      glow.addColorStop(0,"rgba(255,255,255,0.05)");
      glow.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle=glow;ctx.fillRect(0,0,CW,CH);
    }

    // texts
    texts.forEach(t=>{
      ctx.save();
      ctx.font=`${t.weight} ${t.size}px ${font.css}`;
      ctx.fillStyle=t.color;
      ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.shadowColor="rgba(0,0,0,0.65)";ctx.shadowBlur=20;
      ctx.fillText(t.content,t.x*CW,t.y*CH);
      ctx.restore();
      if(!isExport&&t.id===selId){
        ctx.save();
        ctx.font=`${t.weight} ${t.size}px ${font.css}`;
        const tw=ctx.measureText(t.content).width;
        const th2=t.size*1.15;
        ctx.strokeStyle="rgba(90,180,255,0.9)";ctx.lineWidth=3;ctx.setLineDash([12,6]);
        ctx.shadowColor="rgba(74,158,255,0.5)";ctx.shadowBlur=12;
        ctx.strokeRect(t.x*CW-tw/2-14,t.y*CH-th2/2-10,tw+28,th2+20);
        ctx.restore();
      }
    });

    // phone
    const{bx,by,bw,bh,br,sx,sy,sw,sh,sr,camCX,camCY,camR}=PH;

    ctx.save();
    ctx.shadowColor="rgba(0,0,0,0.82)";ctx.shadowBlur=110;ctx.shadowOffsetY=55;
    rr(ctx,bx,by,bw,bh,br);ctx.fillStyle=phoneColor;ctx.fill();
    ctx.restore();

    rr(ctx,bx,by,bw,bh,br);
    const bg2=ctx.createLinearGradient(bx,by,bx+bw,by+bh);
    bg2.addColorStop(0,lighten(phoneColor,30));
    bg2.addColorStop(0.15,lighten(phoneColor,14));
    bg2.addColorStop(0.55,phoneColor);
    bg2.addColorStop(1,darken(phoneColor,24));
    ctx.fillStyle=bg2;ctx.fill();

    rr(ctx,bx,by,bw,bh,br);
    const sp=ctx.createLinearGradient(bx,by,bx+bw*0.55,by+bh*0.2);
    sp.addColorStop(0,"rgba(255,255,255,0.2)");
    sp.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=sp;ctx.fill();

    rr(ctx,bx+1,by+1,bw-2,bh-2,br);
    ctx.strokeStyle="rgba(255,255,255,0.14)";ctx.lineWidth=2;ctx.stroke();
    rr(ctx,bx+4,by+4,bw-8,bh-8,br-2);
    ctx.strokeStyle="rgba(0,0,0,0.28)";ctx.lineWidth=3;ctx.stroke();

    // screen clip
    ctx.save();
    rr(ctx,sx,sy,sw,sh,sr);ctx.clip();
    ctx.fillStyle="#000";ctx.fillRect(sx,sy,sw,sh);

    if(screenshot){
      const img=screenshot;
      const ratio=img.width/img.height,scR=sw/sh;
      let dw,dh,dx,dy;
      if(ratio>scR){dh=sh;dw=sh*ratio;dx=sx+(sw-dw)/2;dy=sy;}
      else{dw=sw;dh=sw/ratio;dx=sx;dy=sy+(sh-dh)/2;}
      ctx.drawImage(img,dx,dy,dw,dh);
    }else{
      const pg=ctx.createLinearGradient(sx,sy,sx+sw,sy+sh);
      pg.addColorStop(0,"#111120");pg.addColorStop(1,"#0d0d1e");
      ctx.fillStyle=pg;ctx.fillRect(sx,sy,sw,sh);
      ctx.font="bold 36px sans-serif";ctx.fillStyle="rgba(255,255,255,0.18)";
      ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText("Ekran görüntüsü yükleyin",sx+sw/2,sy+sh/2);
    }

    const rf=ctx.createLinearGradient(sx,sy,sx+sw*0.65,sy+sh*0.28);
    rf.addColorStop(0,"rgba(255,255,255,0.075)");
    rf.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=rf;ctx.fillRect(sx,sy,sw,sh);
    ctx.restore();

    rr(ctx,sx,sy,sw,sh,sr);
    ctx.strokeStyle="rgba(255,255,255,0.07)";ctx.lineWidth=2;ctx.stroke();

    // status bar
    ctx.save();
    ctx.font="bold 27px sans-serif";ctx.fillStyle="rgba(255,255,255,0.72)";
    ctx.textAlign="left";ctx.textBaseline="top";
    ctx.fillText("9:41",sx+28,sy+22);
    ctx.textAlign="right";
    ctx.fillText("▪▪▪  WiFi  ▮",sx+sw-28,sy+22);
    ctx.restore();

    // camera
    ctx.save();
    ctx.beginPath();ctx.arc(camCX,camCY,camR+3,0,Math.PI*2);
    ctx.fillStyle="#000";ctx.fill();
    ctx.beginPath();ctx.arc(camCX,camCY,camR,0,Math.PI*2);
    const cg=ctx.createRadialGradient(camCX-4,camCY-4,1,camCX,camCY,camR);
    cg.addColorStop(0,"#252540");cg.addColorStop(0.6,"#0d0d1a");cg.addColorStop(1,"#000");
    ctx.fillStyle=cg;ctx.fill();
    ctx.beginPath();ctx.arc(camCX-5,camCY-5,4.5,0,Math.PI*2);
    ctx.fillStyle="rgba(255,255,255,0.18)";ctx.fill();
    ctx.restore();

    // buttons
    const bc=lighten(phoneColor,20);ctx.fillStyle=bc;
    ctx.beginPath();ctx.roundRect(bx+bw-5,by+330,9,115,4);ctx.fill();
    ctx.beginPath();ctx.roundRect(bx-4,by+250,9,95,4);ctx.fill();
    ctx.beginPath();ctx.roundRect(bx-4,by+375,9,95,4);ctx.fill();

    // home bar
    ctx.save();
    rr(ctx,sx,sy,sw,sh,sr);ctx.clip();
    ctx.beginPath();ctx.roundRect(sx+sw/2-65,sy+sh-26,130,7,4);
    ctx.fillStyle="rgba(255,255,255,0.32)";ctx.fill();
    ctx.restore();

  },[screenshot,bgImg,bgFit,useBgImg,gradient,phoneColor,font,texts,selId]);

  useEffect(()=>{
    const c=canvasRef.current;if(!c)return;
    render(c,false);
  },[render]);

  const canvasCoords=useCallback(e=>{
    const c=canvasRef.current;
    const rect=c.getBoundingClientRect();
    const cx=e.touches?e.touches[0].clientX:e.clientX;
    const cy=e.touches?e.touches[0].clientY:e.clientY;
    return{x:(cx-rect.left)/rect.width,y:(cy-rect.top)/rect.height};
  },[]);

  const onMouseDown=useCallback(e=>{
    const{x,y}=canvasCoords(e);
    const c=canvasRef.current,ctx=c.getContext("2d");
    let hit=null;
    [...texts].reverse().forEach(t=>{
      if(hit)return;
      ctx.font=`${t.weight} ${t.size}px ${font.css}`;
      const tw=ctx.measureText(t.content).width/CW;
      const th2=t.size/CH*1.4;
      if(x>=t.x-tw/2-0.025&&x<=t.x+tw/2+0.025&&y>=t.y-th2/2-0.015&&y<=t.y+th2/2+0.015)hit=t;
    });
    if(hit){setSelId(hit.id);dragRef.current={id:hit.id,sx:x,sy:y,ox:hit.x,oy:hit.y};setDragging(true);}
    else setSelId(null);
  },[texts,font,canvasCoords]);

  const onMouseMove=useCallback(e=>{
    if(!dragRef.current)return;
    const{x,y}=canvasCoords(e);
    const{id,sx,sy,ox,oy}=dragRef.current;
    setTexts(p=>p.map(t=>t.id===id?{...t,
      x:Math.max(0.02,Math.min(0.98,ox+(x-sx))),
      y:Math.max(0.02,Math.min(0.98,oy+(y-sy)))
    }:t));
  },[canvasCoords]);

  const onMouseUp=useCallback(()=>{dragRef.current=null;setDragging(false);},[]);

  const selText=texts.find(t=>t.id===selId);
  const updText=(key,val)=>setTexts(p=>p.map(t=>t.id===selId?{...t,[key]:val}:t));
  const addText=()=>{const id=_tid++;setTexts(p=>[...p,{id,content:"Yeni metin",x:0.5,y:0.5,size:56,color:"#ffffff",weight:700}]);setSelId(id);};
  const delText=id=>{setTexts(p=>p.filter(t=>t.id!==id));if(selId===id)setSelId(null);};

  const doExport=()=>{
    setExporting(true);
    setTimeout(()=>{
      const c=document.createElement("canvas");
      render(c,true);
      c.toBlob(blob=>{
        const url=URL.createObjectURL(blob);
        const a=document.createElement("a");
        a.href=url;a.download=`play-screenshot-${Date.now()}.png`;a.click();
        URL.revokeObjectURL(url);setExporting(false);
      },"image/png");
    },50);
  };

  return(
    <div style={{display:"flex",height:"100vh",background:"#0c0c14",color:"#e4e4ef",fontFamily:"system-ui,sans-serif",overflow:"hidden"}}>

      {/* sidebar */}
      <div style={{width:286,flexShrink:0,background:"#111119",borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",overflowY:"auto"}}>

        <div style={{padding:"18px 18px 12px",background:"linear-gradient(160deg,#181826,#111119)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{fontSize:10,letterSpacing:3,color:"#5a9fff",textTransform:"uppercase",marginBottom:3}}>Google Play</div>
          <div style={{fontSize:17,fontWeight:700,letterSpacing:-0.4}}>Screenshot Maker</div>
        </div>

        <div style={{padding:14,display:"flex",flexDirection:"column",gap:18}}>

          <Sec label="📱 Ekran Görüntüsü">
            <input ref={ssRef} type="file" accept="image/*" onChange={onSS} style={{display:"none"}}/>
            <Btn active={!!screenshot} onClick={()=>ssRef.current.click()}>
              {screenshot?"✓ Yüklendi — değiştir":"+ Ekran görüntüsü yükle"}
            </Btn>
          </Sec>

          <Sec label="🖼️ Arka Plan">
            <input ref={bgRef} type="file" accept="image/*" onChange={onBg} style={{display:"none"}}/>
            <Btn active={useBgImg} onClick={()=>bgRef.current.click()}>
              {bgImg?"✓ 1:1 görsel yüklendi":"+ 1:1 arka plan görseli yükle"}
            </Btn>
            {bgImg&&(
              <div style={{marginTop:8,display:"flex",gap:5}}>
                {[["center","Ortala"],["cover","Kapla"]].map(([v,l])=>(
                  <Tog key={v} active={bgFit===v&&useBgImg} onClick={()=>{setBgFit(v);setUseBgImg(true);}}>{l}</Tog>
                ))}
                <Tog active={!useBgImg} onClick={()=>setUseBgImg(false)}>Gizle</Tog>
              </div>
            )}
            {!useBgImg&&(
              <>
                <div style={{fontSize:9.5,color:"#444",margin:"8px 0 5px",letterSpacing:1,textTransform:"uppercase"}}>Gradient</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                  {GRADIENTS.map(g=>(
                    <button key={g.id} onClick={()=>setGradient(g)} style={{
                      padding:"8px 4px",cursor:"pointer",fontSize:11,
                      background:`linear-gradient(135deg,${g.stops[0]},${g.stops[1]},${g.stops[2]})`,
                      border:`2px solid ${gradient.id===g.id?"#5a9fff":"transparent"}`,
                      borderRadius:7,color:"#fff",fontWeight:gradient.id===g.id?700:400,
                    }}>{g.label}</button>
                  ))}
                </div>
              </>
            )}
          </Sec>

          <Sec label="✏️ Metin Katmanları">
            <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:8}}>
              {texts.map(t=>(
                <div key={t.id} onClick={()=>setSelId(t.id)} style={{
                  display:"flex",alignItems:"center",gap:6,padding:"7px 10px",cursor:"pointer",borderRadius:7,
                  background:selId===t.id?"rgba(90,159,255,0.1)":"rgba(255,255,255,0.04)",
                  border:`1px solid ${selId===t.id?"#5a9fff":"rgba(255,255,255,0.07)"}`,
                }}>
                  <span style={{flex:1,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                    color:selId===t.id?"#fff":"#999"}}>{t.content||"(boş)"}</span>
                  <button onClick={e=>{e.stopPropagation();delText(t.id);}}
                    style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:13,padding:"0 2px"}}>✕</button>
                </div>
              ))}
            </div>
            <Btn onClick={addText}>+ Katman ekle</Btn>
          </Sec>

          {selText&&(
            <Sec label="⚙️ Katman Ayarları">
              <label style={lbl}>İçerik</label>
              <input value={selText.content} onChange={e=>updText("content",e.target.value)} style={inp}/>

              <div style={{display:"flex",gap:8,marginTop:8}}>
                <div style={{flex:1}}>
                  <label style={lbl}>Boyut</label>
                  <input type="number" value={selText.size} min={16} max={200}
                    onChange={e=>updText("size",parseInt(e.target.value)||48)} style={{...inp,width:"100%"}}/>
                </div>
                <div style={{flex:1}}>
                  <label style={lbl}>Renk</label>
                  <input type="color" value={selText.color}
                    onChange={e=>updText("color",e.target.value)} style={{...inp,padding:3,height:34}}/>
                </div>
              </div>

              <label style={{...lbl,marginTop:8}}>Kalınlık</label>
              <div style={{display:"flex",gap:5}}>
                {[[400,"Normal"],[700,"Bold"],[800,"Heavy"]].map(([w,l])=>(
                  <Tog key={w} active={selText.weight===w} onClick={()=>updText("weight",w)}
                    style={{fontWeight:w}}>{l}</Tog>
                ))}
              </div>

              <label style={{...lbl,marginTop:10}}>Konum X: <b style={{color:"#5a9fff"}}>{Math.round(selText.x*100)}%</b></label>
              <input type="range" min={2} max={98} value={Math.round(selText.x*100)}
                onChange={e=>updText("x",e.target.value/100)} style={{width:"100%",accentColor:"#5a9fff"}}/>

              <label style={{...lbl,marginTop:6}}>Konum Y: <b style={{color:"#5a9fff"}}>{Math.round(selText.y*100)}%</b></label>
              <input type="range" min={2} max={98} value={Math.round(selText.y*100)}
                onChange={e=>updText("y",e.target.value/100)} style={{width:"100%",accentColor:"#5a9fff"}}/>

              <div style={{fontSize:10,color:"#444",marginTop:5,lineHeight:1.5}}>
                💡 Önizlemede metni sürükleyerek de konumlandırabilirsin
              </div>
            </Sec>
          )}

          <Sec label="🔤 Yazı Tipi">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              {FONTS.map(f=>(
                <button key={f.id} onClick={()=>setFont(f)} style={{
                  padding:"7px 4px",cursor:"pointer",fontFamily:f.css,fontSize:12,
                  background:font.id===f.id?"rgba(90,159,255,0.14)":"rgba(255,255,255,0.04)",
                  border:`1px solid ${font.id===f.id?"#5a9fff":"rgba(255,255,255,0.07)"}`,
                  borderRadius:6,color:font.id===f.id?"#7bb8ff":"#888",
                }}>{f.label}</button>
              ))}
            </div>
          </Sec>

          <Sec label="📱 Telefon Rengi">
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <input type="color" value={phoneColor} onChange={e=>setPhoneColor(e.target.value)}
                style={{width:34,height:34,padding:2,cursor:"pointer",borderRadius:6,
                  background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)"}}/>
              {["#1a1a28","#262626","#f0f0f0","#0f0f0f"].map(c=>(
                <div key={c} onClick={()=>setPhoneColor(c)} style={{
                  width:24,height:24,borderRadius:6,background:c,cursor:"pointer",
                  border:`2px solid ${phoneColor===c?"#5a9fff":"rgba(255,255,255,0.08)"}`,
                }}/>
              ))}
            </div>
          </Sec>

          <button onClick={doExport} disabled={exporting} style={{
            width:"100%",padding:"12px 0",
            background:exporting?"rgba(90,159,255,0.25)":"linear-gradient(135deg,#1a5ef0,#5a9fff)",
            border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,
            cursor:exporting?"wait":"pointer",
            boxShadow:"0 4px 22px rgba(90,159,255,0.22)",
          }}>
            {exporting?"⏳ İşleniyor...":"⬇️  PNG İndir (1080 × 1920)"}
          </button>

          <div style={{fontSize:10,color:"#333",textAlign:"center",lineHeight:1.6}}>
            Google Play · Telefon ekran görseli<br/>1080 × 1920 px · PNG
          </div>
        </div>
      </div>

      {/* preview */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
        background:"#090910",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",inset:0,
          backgroundImage:"radial-gradient(circle at 50% 50%,rgba(90,159,255,0.04) 0%,transparent 55%)"}}/>
        <canvas ref={canvasRef}
          style={{maxHeight:"calc(100vh - 32px)",maxWidth:"calc(100% - 32px)",
            borderRadius:14,boxShadow:"0 24px 90px rgba(0,0,0,0.85)",
            cursor:dragging?"grabbing":"default"}}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onTouchStart={onMouseDown} onTouchMove={onMouseMove} onTouchEnd={onMouseUp}
        />
        <div style={{position:"absolute",bottom:14,right:16,fontSize:10,color:"#282838",letterSpacing:1}}>
          1080 × 1920
        </div>
      </div>
    </div>
  );
}

function Sec({label,children}){
  return(
    <div>
      <div style={{fontSize:9.5,letterSpacing:2.2,color:"#5a9fff",textTransform:"uppercase",marginBottom:9,fontWeight:600}}>{label}</div>
      {children}
    </div>
  );
}
function Btn({active,onClick,children}){
  return(
    <button onClick={onClick} style={{
      width:"100%",padding:"9px 0",cursor:"pointer",fontSize:12,
      background:active?"rgba(90,159,255,0.1)":"rgba(255,255,255,0.04)",
      border:`1px dashed ${active?"#5a9fff":"rgba(255,255,255,0.18)"}`,
      borderRadius:8,color:active?"#7bbfff":"#888",
    }}>{children}</button>
  );
}
function Tog({active,onClick,children,style:s={}}){
  return(
    <button onClick={onClick} style={{
      flex:1,padding:"5px 0",cursor:"pointer",fontSize:11,
      background:active?"rgba(90,159,255,0.18)":"rgba(255,255,255,0.04)",
      border:`1px solid ${active?"#5a9fff":"rgba(255,255,255,0.08)"}`,
      borderRadius:6,color:active?"#7bbfff":"#888",...s,
    }}>{children}</button>
  );
}

const lbl={display:"block",fontSize:10.5,color:"#555",marginBottom:4};
const inp={
  width:"100%",padding:"7px 10px",boxSizing:"border-box",
  background:"rgba(255,255,255,0.05)",
  border:"1px solid rgba(255,255,255,0.09)",
  borderRadius:7,color:"#e4e4ef",fontSize:13,outline:"none",
};
