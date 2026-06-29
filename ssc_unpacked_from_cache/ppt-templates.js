/* PPT 模板库 · Canva 风格 — 每套模板是一个完整可编辑的 HTML 幻灯片 deck */
(function(global){
'use strict';

var GFONT='<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet">';

/* 共用脚本：导航 + 编辑文字(字体/加粗/斜体/下划线) + 移动/缩放元素 + 复制粘贴 + 整页排序 + 插图 + 撤销 + 全屏 */
function deckScript(){
return '<script>(function(){'
+'var deck=document.querySelector(".deck");'
+'var slides=[].slice.call(document.querySelectorAll(".slide"));'
+'var cur=0,tot=slides.length;document.getElementById("tot").textContent=tot;'
+'function refreshSlides(){slides=[].slice.call(document.querySelectorAll(".slide"));tot=slides.length;document.getElementById("tot").textContent=tot;if(cur>=tot)cur=tot-1;if(cur<0)cur=0;}'
+'function render(){slides.forEach(function(s,i){s.classList.toggle("active",i===cur);});document.getElementById("cur").textContent=cur+1;document.getElementById("prog").style.width=((cur+1)/tot*100)+"%";document.getElementById("prev").disabled=cur===0;document.getElementById("next").disabled=cur===tot-1;}'
+'function go(d){var n=cur+d;if(n>=0&&n<tot){cur=n;render();syncSorter();}}'
+'document.getElementById("prev").onclick=function(){go(-1);};document.getElementById("next").onclick=function(){go(1);};'
+'document.addEventListener("keydown",function(e){'
+'if((e.ctrlKey||e.metaKey)&&e.key==="c"&&sel){e.preventDefault();copyEl();return;}'
+'if((e.ctrlKey||e.metaKey)&&e.key==="v"&&clip){e.preventDefault();pasteEl();return;}'
+'if((e.ctrlKey||e.metaKey)&&e.key==="z"){e.preventDefault();doUndo();return;}'
+'if((e.key==="Delete"||e.key==="Backspace")&&sel){e.preventDefault();snapshot();sel.remove();clearSel();return;}'
+'if(editing||resizing)return;'
+'if(e.key==="ArrowRight"){e.preventDefault();go(1);}else if(e.key==="ArrowLeft"){e.preventDefault();go(-1);}});'
/* ===== 撤销 ===== */
+'var undoStack=[];function snapshot(){undoStack.push(deck.innerHTML);if(undoStack.length>40)undoStack.shift();}'
+'function doUndo(){if(!undoStack.length)return;deck.innerHTML=undoStack.pop();refreshSlides();render();rebindAll();}'
+'document.getElementById("btnUndo").onclick=doUndo;'
/* ===== 编辑文字 ===== */
+'var editing=false;'
+'document.getElementById("btnEdit").onclick=function(){editing=!editing;this.classList.toggle("on",editing);document.body.classList.toggle("edit-mode",editing);var els=document.querySelectorAll(".slide h1,.slide h2,.slide h3,.slide h4,.slide p,.slide li,.slide span.editable,.slide div.editable,.slide .editable");els.forEach(function(el){if(editing){el.setAttribute("contenteditable","true");}else{el.removeAttribute("contenteditable");}});document.getElementById("fmtbar").style.display=editing?"flex":"none";if(editing)snapshot();else clearSel();};'
/* 文字格式工具条 */
+'document.getElementById("fmtBold").onmousedown=function(e){e.preventDefault();snapshot();document.execCommand("bold");};'
+'document.getElementById("fmtItalic").onmousedown=function(e){e.preventDefault();snapshot();document.execCommand("italic");};'
+'document.getElementById("fmtUnder").onmousedown=function(e){e.preventDefault();snapshot();document.execCommand("underline");};'
+'document.getElementById("fmtFont").onchange=function(){snapshot();document.execCommand("fontName",false,this.value);};'
+'document.getElementById("fmtSize").onchange=function(){snapshot();document.execCommand("fontSize",false,this.value);};'
+'document.getElementById("fmtColor").oninput=function(){snapshot();document.execCommand("foreColor",false,this.value);};'
/* ===== 选中元素（用于移动/缩放/复制） ===== */
+'var sel=null,clip=null;'
+'function clearSel(){if(sel){sel.classList.remove("el-selected");}sel=null;updTools();}'
+'function selectEl(el){if(sel)sel.classList.remove("el-selected");sel=el;el.classList.add("el-selected");updTools();}'
+'function updTools(){var on=!!sel;document.getElementById("btnCopy").disabled=!on;document.getElementById("btnDel").disabled=!on;}'
+'function copyEl(){if(!sel)return;clip=sel.outerHTML;document.getElementById("btnPaste").disabled=false;flash("已复制元素");}'
+'function pasteEl(){if(!clip)return;snapshot();var tmp=document.createElement("div");tmp.innerHTML=clip;var node=tmp.firstChild;node.classList.add("movable");var r=node.getBoundingClientRect?null:null;node.style.position="absolute";var pl=parseFloat(node.style.left)||80;var pt=parseFloat(node.style.top)||80;node.style.left=(pl+24)+"px";node.style.top=(pt+24)+"px";node.style.right="auto";node.style.bottom="auto";node.classList.remove("el-selected");slides[cur].appendChild(node);node._mv=false;node._rz=false;bindOne(node);flash("已粘贴到当前页");}'
+'document.getElementById("btnCopy").onclick=copyEl;'
+'document.getElementById("btnPaste").onclick=pasteEl;'
+'document.getElementById("btnDel").onclick=function(){if(!sel)return;snapshot();sel.remove();clearSel();};'
+'document.getElementById("btnText").onclick=function(){snapshot();var t=document.createElement("div");t.className="movable";t.setAttribute("contenteditable","true");t.style.cssText="position:absolute;left:10%;top:50%;min-width:280px;min-height:60px;padding:16px 20px;background:rgba(255,255,255,.92);border-radius:8px;font-size:18px;line-height:1.5;color:inherit;z-index:30;";t.innerHTML="双击编辑文字";slides[cur].appendChild(t);t._mv=false;bindOne(t);if(!moving){moving=true;document.getElementById("btnMove").classList.add("on");document.body.classList.add("move-mode");}selectEl(t);flash("文本框已插入");};'
/* ===== 移动 + 缩放 模式 ===== */
+'var moving=false,resizing=false;'
+'document.getElementById("btnMove").onclick=function(){moving=!moving;this.classList.toggle("on",moving);document.body.classList.toggle("move-mode",moving);if(moving){if(editing){editing=false;document.getElementById("btnEdit").classList.remove("on");document.body.classList.remove("edit-mode");document.getElementById("fmtbar").style.display="none";}document.querySelectorAll("[contenteditable]").forEach(function(el){el.removeAttribute("contenteditable");});}if(!moving)clearSel();};'
+'function ensureHandle(el){if(el.querySelector(":scope > .rz-handle"))return;var h=document.createElement("span");h.className="rz-handle";el.appendChild(h);h.addEventListener("mousedown",function(e){if(!moving)return;e.preventDefault();e.stopPropagation();resizing=true;snapshot();selectEl(el);var sx=e.clientX,sy=e.clientY;var r=el.getBoundingClientRect();var w0=r.width,h0=r.height;function mm(ev){el.style.width=Math.max(40,w0+ev.clientX-sx)+"px";el.style.height=Math.max(24,h0+ev.clientY-sy)+"px";}function mu(){document.removeEventListener("mousemove",mm);document.removeEventListener("mouseup",mu);resizing=false;}document.addEventListener("mousemove",mm);document.addEventListener("mouseup",mu);});}'
+'function bindOne(el){if(el._mv)return;el._mv=true;ensureHandle(el);el.addEventListener("mousedown",function(e){if(!moving)return;if(e.target.classList&&e.target.classList.contains("rz-handle"))return;e.preventDefault();e.stopPropagation();snapshot();var ed=el.querySelector("[contenteditable]");if(ed){ed.removeAttribute("contenteditable");}selectEl(el);var sx=e.clientX,sy=e.clientY;var r=el.getBoundingClientRect();var pp=el.offsetParent.getBoundingClientRect();var ol=r.left-pp.left,ot=r.top-pp.top;el.style.position="absolute";function mm(ev){el.style.left=(ol+ev.clientX-sx)+"px";el.style.top=(ot+ev.clientY-sy)+"px";el.style.right="auto";el.style.bottom="auto";}function mu(){document.removeEventListener("mousemove",mm);document.removeEventListener("mouseup",mu);}document.addEventListener("mousemove",mm);document.addEventListener("mouseup",mu);});}'
+'function bindMovable(){document.querySelectorAll(".movable").forEach(bindOne);}'
/* ===== 图片占位 + 插图 ===== */
+'var phTarget=null;'
+'function bindPh(){document.querySelectorAll(".img-ph").forEach(function(p){if(p._ph)return;p._ph=true;p.addEventListener("click",function(){if(moving)return;phTarget=p;document.getElementById("imgInput").click();});});}'
+'document.getElementById("btnImg").onclick=function(){phTarget=null;document.getElementById("imgInput").click();};'
+'document.getElementById("imgInput").onchange=function(e){var f=e.target.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(ev){snapshot();if(phTarget){phTarget.style.backgroundImage="url("+ev.target.result+")";phTarget.style.backgroundSize="cover";phTarget.style.backgroundPosition="center";phTarget.classList.add("filled");phTarget=null;}else{var w=document.createElement("div");w.className="ins-img-wrap movable";w.style.cssText="position:absolute;left:38%;top:32%;width:24%;height:30%;z-index:40;";w.innerHTML="<div class=\\"img-tool\\"><button class=\\"del\\">X</button></div><img src=\\""+ev.target.result+"\\" style=\\"width:100%;height:100%;object-fit:cover;border-radius:6px;pointer-events:none;\\">";slides[cur].appendChild(w);w._mv=false;bindOne(w);w.querySelector(".del").onclick=function(ev2){ev2.stopPropagation();w.remove();};}};rd.readAsDataURL(f);e.target.value="";};'
/* ===== 整页排序面板 ===== */
+'var sorterOpen=false;'
+'document.getElementById("btnSort").onclick=function(){sorterOpen=!sorterOpen;this.classList.toggle("on",sorterOpen);var sp=document.getElementById("sorter");sp.style.display=sorterOpen?"flex":"none";if(sorterOpen)buildSorter();};'
+'function buildSorter(){var sp=document.getElementById("sorter");sp.innerHTML="";slides.forEach(function(s,i){var chip=document.createElement("div");chip.className="sort-chip"+(i===cur?" cur":"");chip.draggable=true;chip.dataset.idx=i;chip.innerHTML="<span class=\\"sc-n\\">"+(i+1)+"</span>";chip.onclick=function(){cur=i;render();syncSorter();};chip.addEventListener("dragstart",function(e){e.dataTransfer.setData("text/plain",i);chip.classList.add("drag");});chip.addEventListener("dragend",function(){chip.classList.remove("drag");});chip.addEventListener("dragover",function(e){e.preventDefault();chip.classList.add("over");});chip.addEventListener("dragleave",function(){chip.classList.remove("over");});chip.addEventListener("drop",function(e){e.preventDefault();chip.classList.remove("over");var from=parseInt(e.dataTransfer.getData("text/plain"),10);var to=i;if(from===to)return;snapshot();var arr=[].slice.call(document.querySelectorAll(".slide"));var node=arr[from];if(from<to){deck.insertBefore(node,arr[to].nextSibling);}else{deck.insertBefore(node,arr[to]);}refreshSlides();cur=to;render();buildSorter();});sp.appendChild(chip);});var add=document.createElement("div");add.className="sort-chip add";add.innerHTML="+";add.title="复制当前页";add.onclick=function(){snapshot();var clone=slides[cur].cloneNode(true);clone.classList.remove("active");slides[cur].parentNode.insertBefore(clone,slides[cur].nextSibling);refreshSlides();rebindAll();cur=cur+1;render();buildSorter();};sp.appendChild(add);}'
+'function syncSorter(){if(sorterOpen)buildSorter();}'
/* ===== 全屏 ===== */
+'document.getElementById("btnFull").onclick=function(){if(!document.fullscreenElement){document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();}else{document.exitFullscreen&&document.exitFullscreen();}};'
/* 点空白处取消选中 */
+'document.addEventListener("mousedown",function(e){if(!moving)return;if(e.target.closest&&(e.target.closest(".movable")||e.target.closest(".deck-toolbar")||e.target.closest(".fmt-bar")||e.target.closest(".sorter")))return;clearSel();});'
/* 提示气泡 */
+'var flashT;function flash(msg){var f=document.getElementById("flash");f.textContent=msg;f.style.opacity="1";clearTimeout(flashT);flashT=setTimeout(function(){f.style.opacity="0";},1400);}'
+'function rebindAll(){document.querySelectorAll(".movable").forEach(function(el){el._mv=false;});document.querySelectorAll(".img-ph").forEach(function(el){el._ph=false;});bindMovable();bindPh();}'
+'bindMovable();bindPh();render();'
+'})();<\/script>';
}

/* deck 外壳 */
function shell(opts){
return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1.0">\n<title>'+(opts.title||'Presentation')+'</title>\n'+GFONT+'\n<style>\n'
+':root{'+(opts.vars||'')+'}\n'
+'*{margin:0;padding:0;box-sizing:border-box;}\n'
+'html,body{width:100%;height:100%;overflow:hidden;font-family:'+(opts.bodyFont||"'Inter',-apple-system,'PingFang SC','Microsoft YaHei',sans-serif")+';background:#222;}\n'
+'.deck{width:100vw;height:100vh;position:relative;overflow:hidden;}\n'
+'.slide{position:absolute;inset:0;width:100vw;height:100vh;opacity:0;pointer-events:none;transition:opacity .45s ease;overflow:hidden;display:flex;flex-direction:column;}\n'
+'.slide.active{opacity:1;pointer-events:all;z-index:10;}\n'
+'h1,h2,h3,h4{line-height:1.12;}\n'
+(opts.css||'')+'\n'
+'.edit-mode [contenteditable]{outline:1px dashed rgba(120,120,120,.5);outline-offset:3px;cursor:text;}\n'
+'.edit-mode [contenteditable]:hover{outline-color:#0052d9;background:rgba(0,82,217,.05);}\n'
+'.move-mode .movable{cursor:move;outline:1px dashed rgba(0,82,217,.45);}\n'
+'.move-mode .movable:hover{outline:2px solid #0052d9;}\n'
+'.move-mode .el-selected{outline:2px solid #0052d9 !important;box-shadow:0 0 0 3px rgba(0,82,217,.12);}\n'
+'.rz-handle{display:none;position:absolute;right:-7px;bottom:-7px;width:14px;height:14px;background:#0052d9;border:2px solid #fff;border-radius:50%;cursor:nwse-resize;z-index:60;}\n'
+'.move-mode .movable > .rz-handle{display:block;}\n'
+'.deck-toolbar{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:200;display:flex;gap:6px;background:rgba(20,22,30,.88);backdrop-filter:blur(8px);padding:6px 8px;border-radius:999px;box-shadow:0 6px 20px rgba(0,0,0,.25);max-width:94vw;flex-wrap:wrap;justify-content:center;}\n'
+'.deck-toolbar button{border:none;background:rgba(255,255,255,.12);color:#fff;font-size:12px;padding:6px 11px;border-radius:999px;cursor:pointer;white-space:nowrap;}\n'
+'.deck-toolbar button:hover{background:rgba(255,255,255,.28);}\n'
+'.deck-toolbar button.on{background:#0052d9;}\n'
+'.deck-toolbar button:disabled{opacity:.35;cursor:not-allowed;}\n'
/* 文字格式工具条 */
+'.fmt-bar{position:fixed;top:58px;left:50%;transform:translateX(-50%);z-index:200;display:none;align-items:center;gap:6px;background:#fff;padding:6px 10px;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.22);}\n'
+'.fmt-bar select,.fmt-bar button,.fmt-bar input{border:1px solid #dcdfe6;background:#fff;border-radius:6px;font-size:13px;height:30px;cursor:pointer;}\n'
+'.fmt-bar button{width:32px;font-weight:700;}\n'
+'.fmt-bar button:hover{background:#f0f3fa;}\n'
+'.fmt-bar select{padding:0 6px;}\n'
+'.fmt-bar input[type=color]{width:32px;padding:2px;}\n'
+'.fmt-bar .fb-i{font-style:italic;}.fmt-bar .fb-u{text-decoration:underline;}\n'
/* 整页排序面板 */
+'.sorter{position:fixed;left:50%;transform:translateX(-50%);bottom:70px;z-index:200;display:none;gap:8px;background:rgba(20,22,30,.9);backdrop-filter:blur(8px);padding:10px 12px;border-radius:12px;max-width:92vw;overflow-x:auto;box-shadow:0 8px 24px rgba(0,0,0,.3);}\n'
+'.sort-chip{flex:0 0 auto;width:54px;height:40px;border-radius:6px;background:rgba(255,255,255,.14);color:#fff;display:grid;place-items:center;cursor:pointer;font-size:13px;font-weight:700;border:2px solid transparent;}\n'
+'.sort-chip.cur{border-color:#4d8dff;background:rgba(77,141,255,.3);}\n'
+'.sort-chip.over{border-color:#fff;}\n'
+'.sort-chip.drag{opacity:.4;}\n'
+'.sort-chip.add{background:rgba(0,168,112,.35);font-size:18px;}\n'
+'.deck-nav{position:fixed;bottom:18px;right:24px;z-index:200;display:flex;gap:10px;}\n'
+'.deck-nav button{width:40px;height:40px;border-radius:50%;border:none;background:rgba(20,22,30,.85);color:#fff;cursor:pointer;font-size:16px;display:grid;place-items:center;}\n'
+'.deck-nav button:hover{background:#0052d9;}\n'
+'.deck-nav button:disabled{opacity:.3;cursor:not-allowed;}\n'
+'.deck-counter{position:fixed;bottom:24px;left:24px;z-index:200;font-size:13px;color:rgba(20,22,30,.5);font-weight:600;background:rgba(255,255,255,.7);padding:3px 10px;border-radius:999px;}\n'
+'.deck-progress{position:fixed;bottom:0;left:0;height:3px;background:#0052d9;z-index:200;transition:width .4s ease;}\n'
+'.flash-tip{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:300;background:rgba(20,22,30,.92);color:#fff;font-size:13px;padding:8px 16px;border-radius:999px;opacity:0;transition:opacity .3s;pointer-events:none;}\n'
+'.img-tool{position:absolute;top:-28px;left:0;z-index:50;}\n'
+'.img-tool button{font-size:11px;padding:2px 7px;border-radius:4px;border:none;background:#1d2733;color:#fff;cursor:pointer;}\n'
+'</style>\n</head>\n<body>\n<div class="deck">\n'+opts.slides+'\n</div>\n'
+'<div class="deck-toolbar">'
+'<button id="btnEdit">编辑文字</button>'
+'<button id="btnMove">移动/缩放</button>'
+'<button id="btnCopy" disabled>复制元素</button>'
+'<button id="btnPaste" disabled>粘贴</button>'
+'<button id="btnDel" disabled>删除</button>'
+'<button id="btnText">+ 文本框</button>'
+'<button id="btnImg">插入图片</button>'
+'<button id="btnSort">页面排序</button>'
+'<button id="btnUndo">撤销</button>'
+'<button id="btnFull">全屏</button></div>\n'
+'<div class="fmt-bar" id="fmtbar">'
+'<select id="fmtFont" title="字体"><option value="Inter, sans-serif">Inter</option><option value="Space Grotesk, sans-serif">Space Grotesk</option><option value="Playfair Display, serif">Playfair (衬线)</option><option value="PingFang SC, Microsoft YaHei, sans-serif">苹方/雅黑</option><option value="Georgia, serif">Georgia</option><option value="Courier New, monospace">Courier</option></select>'
+'<select id="fmtSize" title="字号"><option value="2">小</option><option value="3" selected>正常</option><option value="4">中</option><option value="5">大</option><option value="6">特大</option><option value="7">超大</option></select>'
+'<button id="fmtBold" title="加粗">B</button>'
+'<button id="fmtItalic" class="fb-i" title="斜体">I</button>'
+'<button id="fmtUnder" class="fb-u" title="下划线">U</button>'
+'<input type="color" id="fmtColor" value="#1d2733" title="文字颜色">'
+'</div>\n'
+'<div class="sorter" id="sorter"></div>\n'
+'<div class="flash-tip" id="flash"></div>\n'
+'<input type="file" id="imgInput" accept="image/*" style="display:none">\n'
+'<div class="deck-counter"><span id="cur">1</span> / <span id="tot">1</span></div>\n'
+'<div class="deck-progress" id="prog"></div>\n'
+'<div class="deck-nav"><button id="prev">&lsaquo;</button><button id="next">&rsaquo;</button></div>\n'
+deckScript()+'\n</body>\n</html>';
}

var T=[];
/* ===== 1. Cream Basic（米灰基础 · The Anatomy of an Excellent Presentation）10页 ===== */
T.push({id:'cream-basic',name:'米灰基础',en:'Cream Basic',accent:'#b7ac96',bg:'#cbc1b0',build:function(){
var vars='--taupe:#cbc1b0;--gray:#e6e7e3;--ink:#2b2b2b;--muted:#5a5a52;--white:#fff;';
var css=
'.slide{background:var(--gray);color:var(--ink);font-family:"Inter",sans-serif;}'
+'.pad{position:absolute;inset:0;}'
+'.pn{position:absolute;top:5%;font-size:1rem;color:var(--muted);font-family:Georgia,serif;}'
+'.pn.l{left:5.5%;}.pn.r{right:5.5%;}'
+'.vcap{position:absolute;right:3%;top:50%;transform:translateY(-50%) rotate(180deg);writing-mode:vertical-rl;font-family:Georgia,serif;font-size:.82rem;color:var(--muted);letter-spacing:.04em;}'
+'h1.bold{font-weight:800;font-size:clamp(2.4rem,5vw,4rem);line-height:1.08;letter-spacing:-.01em;color:var(--ink);}'
+'.serif{font-family:Georgia,"Times New Roman",serif;}'
+'.sub{font-family:Georgia,serif;font-size:clamp(1rem,1.5vw,1.35rem);color:var(--muted);line-height:1.5;}'
/* 封面：左照片(顶左切角) + 右taupe块 */
+'.cover{display:grid;grid-template-columns:.42fr 1fr;background:var(--taupe);}'
+'.cover .photocol{position:relative;background:var(--white);}'
+'.cover .img-ph{position:absolute;left:14%;top:6%;width:78%;height:88%;clip-path:polygon(22% 0,100% 0,100% 100%,0 100%,0 14%);}'
+'.cover .right{display:flex;flex-direction:column;justify-content:center;padding:0 7% 0 5%;}'
+'.cover h1{color:var(--white);font-weight:800;}'
+'.cover .sub{color:rgba(255,255,255,.85);margin-top:1.6rem;}'
/* 左字右照片(切角) */
+'.lt{display:grid;grid-template-columns:1fr 1fr;align-items:center;height:100%;}'
+'.lt .txt{padding:0 4% 0 6%;}'
+'.lt .img-ph{height:84%;align-self:center;justify-self:end;width:88%;clip-path:polygon(18% 0,100% 0,100% 100%,0 100%,0 12%);}'
/* 左照片右字 */
+'.rt{display:grid;grid-template-columns:1fr 1fr;align-items:center;height:100%;}'
+'.rt .img-ph{height:100%;width:100%;}'
+'.rt .txt{padding:0 6% 0 5%;}'
/* 三标注 */
+'.headings{display:flex;flex-direction:column;gap:2.4rem;justify-content:center;}'
+'.hrow{display:grid;grid-template-columns:auto 1fr;gap:1rem;align-items:start;}'
+'.flag{width:0;height:0;border-top:14px solid var(--ink);border-right:14px solid transparent;margin-top:3px;}'
+'.hrow h3{font-family:Georgia,serif;font-weight:700;font-size:clamp(1rem,1.4vw,1.25rem);color:var(--ink);}'
/* 两栏底部 */
+'.tc-top{padding:7% 6% 0;}'
+'.tc-bot{position:absolute;bottom:0;left:0;right:0;height:46%;background:#f2f1ec;display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;padding:0 10%;}'
/* quote 切角块 */
+'.quote-box{position:absolute;inset:9% 6%;background:rgba(255,255,255,.18);clip-path:polygon(6% 0,100% 0,100% 100%,0 100%,0 14%);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:6%;}'
+'.quote-box .q{font-family:Georgia,serif;font-size:clamp(1.2rem,2vw,1.7rem);line-height:1.5;color:var(--white);text-align:center;}'
+'.quote-box .by{font-weight:700;color:var(--white);margin-top:1.5rem;align-self:flex-end;}'
/* statement 大字 */
+'.huge{font-weight:800;font-size:clamp(2.2rem,4.6vw,3.6rem);line-height:1.12;color:var(--white);}'
+'.tag-caps{font-family:Georgia,serif;font-size:clamp(.95rem,1.3vw,1.2rem);color:rgba(255,255,255,.85);line-height:1.5;}';
var P='<div class="vcap editable">The Anatomy of an Excellent Presentation</div>';
var s=
/* 1 封面 */
'<div class="slide active cover"><span class="pn l" style="color:rgba(255,255,255,.6)">01</span><div class="photocol"><div class="img-ph"></div></div><div class="right"><h1 class="bold editable">The Anatomy of<br>an Excellent<br>Presentation</h1><div class="sub editable">Secrets for an impressive and informative talk</div></div></div>'
/* 2 左字右照片 Highlight */
+'<div class="slide"><span class="pn r">02</span>'+P+'<div class="lt"><div class="txt"><h1 class="bold editable">Highlight<br>what\'s<br>important</h1><div class="sub editable" style="margin-top:1.4rem">Identify what you want your audience to remember</div></div><div class="img-ph"></div></div></div>'
/* 3 左照片(切角)右字 Limit */
+'<div class="slide" style="background:var(--white)"><span class="pn r">03</span>'+P+'<div class="lt"><div class="img-ph" style="justify-self:start;margin-left:8%;background:#fff;clip-path:polygon(18% 0,100% 0,100% 100%,0 100%,0 12%)"></div><div class="txt"><h1 class="bold editable">Limit your<br>words</h1><div class="sub editable" style="margin-top:1.4rem">Don\'t overload your slides with text</div></div></div></div>'
/* 4 两栏 Select */
+'<div class="slide" style="background:var(--white)"><span class="pn r">04</span><div class="tc-top"><h1 class="bold editable">Select high-quality<br>images and graphics</h1><div class="sub editable" style="margin-top:1rem">Choose from a well-curated library</div></div><div class="tc-bot"><div class="hrow"><span class="flag"></span><div><h3 class="editable">Your audience will take you more seriously</h3></div></div><div class="hrow"><span class="flag"></span><div><h3 class="editable">They can perceive the presentation as effective</h3></div></div></div></div>'
/* 5 左照片右字 Keep it simple */
+'<div class="slide" style="background:var(--white)"><span class="pn l">08</span><div class="vcap editable" style="right:auto;left:3%;transform:translateY(-50%)">The Anatomy of an Excellent Presentation</div><div class="rt"><div class="img-ph" style="margin-left:18%;width:64%"></div><div class="txt"><h1 class="bold editable">Keep it simple</h1><div class="sub editable" style="margin-top:1rem">Less is more effective</div></div></div></div>'
/* 6 文字+大字 Drop */
+'<div class="slide" style="background:var(--taupe)"><span class="pn l" style="color:rgba(255,255,255,.6)">06</span><div class="vcap editable" style="color:rgba(255,255,255,.7)">The Anatomy of an Excellent Presentation</div><div style="position:absolute;left:6%;top:48%;transform:translateY(-50%);max-width:30%"><div class="hrow"><span class="flag" style="border-top-color:#fff"></span><div class="tag-caps editable">Emphasize your points through your dialogue instead</div></div></div><div style="position:absolute;right:7%;top:50%;transform:translateY(-50%);max-width:46%"><div class="huge editable">Drop the exclamation marks (unless it\'s super necessary)</div></div></div>'
/* 7 文字+三标注 Apply */
+'<div class="slide"><span class="pn l">07</span><div style="position:absolute;left:6%;bottom:14%"><h1 class="bold editable">Apply a<br>fresh layout<br>and design</h1></div><div class="headings" style="position:absolute;right:8%;top:18%;width:42%"><div class="hrow"><span class="flag"></span><h3 class="editable">Clean formatting is best</h3></div><div class="hrow"><span class="flag"></span><h3 class="editable">Ensure ample negative space</h3></div></div><div class="vcap editable" style="font-size:.72rem">The Anatomy of an Excellent Presentation</div></div>'
/* 8 photo+text multiple headings 切角照片 */
+'<div class="slide" style="background:var(--white)"><div class="rt"><div class="img-ph" style="clip-path:polygon(0 0,100% 0,82% 100%,0 100%)"></div><div class="txt"><h1 class="bold editable" style="font-size:clamp(2rem,4vw,3.2rem)">Use relevant charts and graphs</h1><div class="headings" style="margin-top:1.5rem;gap:1.6rem"><div class="hrow"><span class="flag"></span><h3 class="editable">Makes data more memorable</h3></div><div class="hrow"><span class="flag"></span><h3 class="editable">Adds more context to the topic</h3></div><div class="hrow"><span class="flag"></span><h3 class="editable">Supports your claims</h3></div></div></div></div></div>'
/* 9 statement photo overlay Remember */
+'<div class="slide" style="background:var(--taupe)"><span class="pn l" style="color:rgba(255,255,255,.7);z-index:5">09</span><div class="img-ph" style="position:absolute;inset:6% 4%;clip-path:polygon(6% 0,100% 0,100% 100%,0 100%,0 14%);opacity:.92"></div><div style="position:absolute;left:10%;top:42%;transform:translateY(-50%);z-index:5;max-width:55%"><div class="huge editable" style="font-size:clamp(2rem,4vw,3rem)">Remember:</div><div class="tag-caps editable serif" style="margin-top:.8rem;color:#fff;font-weight:700">Presentation slides are only made meaningful with your narration.</div></div><div class="vcap editable">The Anatomy of an Excellent Presentation</div></div>'
/* 10 Quote 切角块 */
+'<div class="slide" style="background:var(--taupe)"><span class="pn l" style="color:rgba(255,255,255,.7);z-index:5">10</span><div class="quote-box"><div class="q editable">If you have an important point to make, don\'t try to be subtle or clever. Use a pile driver. Hit the point once. Then come back and hit it again. Then hit it a third time &ndash; a tremendous whack.</div><div class="by editable">- Winston Churchill</div></div></div>';
return shell({title:'Cream Basic',vars:vars,css:css,slides:s});
}});

/* ===== 2. Pink Cream（粉米优雅 · 13页）===== */
T.push({id:'pink-cream',name:'粉米优雅',en:'Pink Cream Elegant',accent:'#f0c9cf',bg:'#fdf4ef',build:function(){
var vars='--cream:#fdf4ef;--pink:#f6d4d9;--ink:#5a4848;--muted:#6d5b5b;--line:#5a4848;';
var css=
'.slide{background:var(--cream);color:var(--ink);font-family:Georgia,"Times New Roman",serif;}'
+'h1,h2,h3{font-family:Georgia,"Times New Roman",serif;font-weight:400;}'
+'h1{font-size:clamp(2.6rem,5.4vw,4.4rem);line-height:1.1;color:var(--ink);}'
+'.caps{font-family:"Inter",sans-serif;font-size:clamp(.78rem,1.05vw,1rem);line-height:2;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);}'
+'.sub{font-family:"Inter",sans-serif;font-size:clamp(.9rem,1.2vw,1.1rem);color:var(--muted);}'
+'.vcap{position:absolute;left:4%;top:50%;transform:translateY(-50%) rotate(180deg);writing-mode:vertical-rl;font-size:.82rem;color:var(--muted);letter-spacing:.04em;}'
+'.tick{position:absolute;width:1.5px;background:var(--line);}'
+'.img-ph{background:#e6ddd6 center/cover no-repeat;}'
+'.pinkblock{background:var(--pink);}'
+'.smallpink{position:absolute;background:var(--pink);width:8%;height:7%;}'
+'.connector{position:absolute;height:1.5px;background:var(--line);}'
/* 封面 */
+'.cover{position:relative;}'
+'.cover .pinkR{position:absolute;right:0;top:0;width:62%;height:100%;background:var(--pink);}'
+'.cover .img-ph{position:absolute;left:6%;top:14%;width:30%;height:72%;}'
+'.cover .tline{position:absolute;left:20%;top:8%;height:14%;}'
+'.cover .ct{position:absolute;right:7%;top:24%;width:46%;}'
/* photo+text 左字右图+竖标注 */
+'.lt{position:absolute;inset:0;}';
var P='<div class="vcap editable">The Anatomy of an Excellent Presentation</div>';
var s=
/* 1 封面 */
'<div class="slide active cover"><div class="pinkR"></div><span class="tick tline"></span><div class="img-ph"></div><div class="ct"><h1 class="editable">The Anatomy<br>of an Excellent<br>Presentation</h1><div class="sub editable" style="margin-top:1.4rem">Secrets for an impressive and informative talk</div></div></div>'
/* 2 Highlight 左字右图 */
+'<div class="slide">'+P+'<h1 class="editable" style="position:absolute;left:7%;top:20%">Highlight<br>what\'s<br>important</h1><div class="caps editable" style="position:absolute;left:7%;bottom:14%;max-width:34%">Identify what you want<br>your audience to remember</div><div class="img-ph" style="position:absolute;right:7%;top:11%;width:38%;height:78%"></div><span class="smallpink" style="left:48%;top:30%"></span></div>'
/* 3 Limit 双图左下 */
+'<div class="slide"><h1 class="editable" style="position:absolute;left:6%;top:14%">Limit<br>your words</h1><div class="img-ph" style="position:absolute;left:6%;bottom:6%;width:19%;height:46%"></div><div class="img-ph" style="position:absolute;left:26%;bottom:6%;width:19%;height:46%"></div><div class="img-ph" style="position:absolute;right:6%;top:6%;width:35%;height:62%"></div><span class="connector" style="left:50%;top:46%;width:6%"></span><span class="smallpink" style="right:6%;top:10%"></span><div class="caps editable" style="position:absolute;right:6%;bottom:10%;text-align:left">Don\'t overload<br>your slides with text</div></div>'
/* 4 Keep it simple 左双图右字 */
+'<div class="slide"><div class="vcap editable">The Anatomy of an Excellent Presentation</div><div class="img-ph" style="position:absolute;left:11%;top:6%;width:38%;height:42%"></div><div class="img-ph" style="position:absolute;left:11%;bottom:6%;width:38%;height:42%"></div><span class="smallpink" style="left:45%;top:22%"></span><h1 class="editable" style="position:absolute;right:7%;top:18%;width:40%">Keep it simple</h1><div class="caps editable" style="position:absolute;right:7%;top:44%;width:40%">Less is more effective</div><div class="sub editable" style="position:absolute;right:7%;top:54%;width:38%;line-height:1.7">Avoid overloading a slide with too many words and choose a color palette that won\'t distract the audience.</div></div>'
/* 5 Use relevant charts 左粉块右图三标注 */
+'<div class="slide"><div class="pinkblock" style="position:absolute;left:5%;top:11%;width:28%;height:78%;display:flex;align-items:center"><h1 class="editable" style="color:#fff;padding-left:9%;font-size:clamp(1.8rem,3.4vw,2.8rem)">Use<br>relevant<br>charts<br>and<br>graphs</h1></div><div class="img-ph" style="position:absolute;left:35%;top:11%;width:25%;height:78%"></div><div style="position:absolute;right:5%;top:22%;width:30%"><div class="caps editable">Makes data more memorable</div></div><div style="position:absolute;right:5%;top:46%;width:30%"><div class="caps editable">Adds more context to the topic</div></div><div style="position:absolute;right:5%;top:70%;width:30%"><div class="caps editable">Supports your claims</div></div><span class="connector" style="left:60%;top:26%;width:8%"></span><span class="connector" style="left:60%;top:50%;width:8%"></span><span class="connector" style="left:60%;top:74%;width:8%"></span></div>'
/* 6 Big Photo Remember(narration) */
+'<div class="slide"><div class="pinkblock" style="position:absolute;left:0;top:0;width:5%;height:100%"></div><div class="img-ph" style="position:absolute;left:11%;top:5%;width:50%;height:84%"></div><span class="tick" style="left:36%;bottom:6%;height:14%"></span><div class="caps editable" style="position:absolute;right:6%;top:30%;width:30%;line-height:1.9">Presentation slides are only made meaningful with your narration.</div><span class="smallpink" style="right:24%;top:40%"></span></div>'
/* 7 Collage 三图 Select */
+'<div class="slide"><div class="img-ph" style="position:absolute;left:0;top:0;width:28%;height:100%"></div><h1 class="editable" style="position:absolute;left:34%;top:32%;width:28%">Select high-quality images and graphics</h1><span class="smallpink" style="left:24%;top:50%"></span><div class="pinkblock" style="position:absolute;right:0;top:0;width:24%;height:100%"></div><div class="img-ph" style="position:absolute;right:3%;top:6%;width:18%;height:42%"></div><div class="img-ph" style="position:absolute;right:3%;bottom:6%;width:18%;height:42%"></div></div>'
/* 8 Remember: 粉块+连接线+照片+小粉块（招牌页） */
+'<div class="slide"><div class="pinkblock" style="position:absolute;left:4%;top:11%;width:44%;height:78%"></div><h1 class="editable" style="position:absolute;left:10%;top:18%">Remember:</h1><div class="caps editable" style="position:absolute;left:10%;bottom:18%;width:34%">Presentation slides are only made meaningful with your narration.</div><span class="connector" style="left:45%;top:25%;width:9%"></span><div class="img-ph" style="position:absolute;right:6%;top:11%;width:38%;height:78%"></div><span class="smallpink" style="right:6%;bottom:14%"></span></div>'
/* 9 Quote 居中粉块 */
+'<div class="slide"><span class="tick" style="left:50%;top:7%;height:14%"></span><div class="pinkblock" style="position:absolute;inset:16% 6% 8%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:5%"><div class="editable" style="font-size:clamp(1.2rem,2vw,1.7rem);line-height:1.55;text-align:center;color:var(--ink)">If you have an important point to make, don\'t try to be subtle or clever. Use a pile driver. Hit the point once. Then come back and hit it again. Then hit it a third time &ndash; a tremendous whack.</div><div class="caps editable" style="margin-top:1.6rem">- Winston Churchill</div></div></div>'
/* 10 Text Only 右粉块 Drop */
+'<div class="slide"><div class="pinkblock" style="position:absolute;right:0;top:0;width:44%;height:100%"></div><span class="tick" style="left:6%;top:8%;height:14%"></span><div class="caps editable" style="position:absolute;right:6%;top:11%;width:32%;font-weight:700;color:#fff">Emphasize your points through your dialogue</div><h1 class="editable" style="position:absolute;left:6%;bottom:12%;width:42%">Drop the exclamation marks (unless it\'s super necessary)</h1><div class="sub editable" style="position:absolute;right:6%;bottom:6%;color:rgba(90,72,72,.7);font-size:.85rem">The Anatomy of an Excellent Presentation</div></div>'
/* 11 Text multiple headings 左粉块 Apply */
+'<div class="slide"><div class="pinkblock" style="position:absolute;left:5%;top:11%;width:42%;height:78%"></div><h1 class="editable" style="position:absolute;left:11%;top:38%;width:30%">Apply a fresh layout and design</h1><div class="caps editable" style="position:absolute;left:57%;top:33%">Clean formatting is best</div><div class="caps editable" style="position:absolute;left:57%;top:62%">Ensure ample negative space</div><span class="connector" style="left:44%;top:36%;width:9%"></span><span class="connector" style="left:44%;top:65%;width:9%"></span></div>'
/* 12 Section title 左粉块右图 */
+'<div class="slide"><div class="pinkblock" style="position:absolute;left:0;top:11%;width:54%;height:78%"></div><h1 class="editable" style="position:absolute;left:7%;top:26%">Apply<br>a fresh layout<br>and design</h1><div class="caps editable" style="position:absolute;left:7%;bottom:22%">Less is more effective</div><div class="img-ph" style="position:absolute;right:6%;top:11%;width:32%;height:78%"></div><span class="connector" style="right:6%;top:50%;width:6%"></span></div>'
/* 13 Two-Column 粉块居中 Select */
+'<div class="slide"><div class="pinkblock" style="position:absolute;left:0;top:0;width:55%;height:100%;opacity:.5"></div><h1 class="editable" style="position:absolute;left:6%;top:34%;width:26%;font-size:clamp(2rem,3.6vw,3rem)">Select high-quality images and graphics</h1><div class="pinkblock" style="position:absolute;left:41%;top:11%;width:20%;height:78%;display:flex;align-items:center"><div class="caps editable" style="color:#fff;font-weight:700;padding-left:10%">Choose from a well-curated library</div></div><div class="caps editable" style="position:absolute;right:6%;top:22%;width:28%">Your audience will take you more seriously</div><span class="connector" style="right:18%;top:50%;width:8%"></span><div class="caps editable" style="position:absolute;right:6%;bottom:22%;width:28%">They can perceive the presentation as effective</div></div>';
return shell({title:'Pink Cream Elegant',vars:vars,css:css,slides:s});
}});

/* ===== 3. Green Blue SDG（绿蓝可持续报告 · 12页）===== */
T.push({id:'green-blue-sdg',name:'绿蓝可持续报告',en:'Green Blue SDG Report',accent:'#7cab46',bg:'#eeeadb',build:function(){
var vars='--cream:#efeadb;--navy:#1f2d5c;--green:#7cab46;--ink:#1f2d5c;--muted:#41506f;';
var css=
'.slide{background:var(--cream);color:var(--ink);font-family:"Inter",sans-serif;}'
+'h1,h2{font-weight:800;color:var(--navy);letter-spacing:-.01em;}'
+'h1{font-size:clamp(2.4rem,4.8vw,3.8rem);line-height:1.06;}'
+'h2{font-size:clamp(1.8rem,3vw,2.6rem);line-height:1.1;}'
+'p{font-size:clamp(.85rem,1.1vw,1.02rem);line-height:1.55;color:var(--muted);}'
+'.logo{display:flex;align-items:center;gap:.6rem;}'
+'.hexlogo{width:30px;height:34px;background:var(--green);clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);}'
+'.logo .t{font-size:1.05rem;color:var(--navy);font-weight:600;line-height:1.1;}'
/* 页脚 */
+'.foot{position:absolute;left:6%;right:6%;bottom:6%;display:flex;align-items:center;border-top:1px solid rgba(31,45,92,.3);padding-top:.8rem;font-size:.8rem;color:var(--muted);}'
+'.foot .c1{width:18%;}.foot .c2{flex:1;}.foot .c1 b,.foot .c2 b{color:var(--navy);}'
+'.foot .pg{font-weight:800;color:var(--navy);font-size:1rem;}'
/* 封面 diagonal */
+'.cover{position:relative;overflow:hidden;}'
+'.cover .photo{position:absolute;right:0;top:0;width:62%;height:100%;background:linear-gradient(135deg,#9fcb6b,#5e8a3c);clip-path:polygon(28% 0,100% 0,100% 100%,0 100%);}'
+'.cover .photo .img-ph{width:100%;height:100%;clip-path:polygon(28% 0,100% 0,100% 100%,0 100%);}'
+'.cover .navytri{position:absolute;right:0;bottom:0;width:30%;height:60%;background:var(--navy);clip-path:polygon(100% 0,100% 100%,0 100%);}'
+'.cover .greentri{position:absolute;left:0;bottom:0;width:14%;height:24%;background:var(--green);clip-path:polygon(0 100%,0 0,100% 100%);}'
+'.cover .ct{position:absolute;left:6%;top:38%;transform:translateY(-50%);width:48%;}'
+'.cover .meta{position:absolute;left:6%;bottom:14%;display:flex;gap:3rem;font-size:.82rem;color:var(--muted);}'
+'.cover .meta b{display:block;color:var(--navy);font-size:.92rem;}'
/* intro 右切角图 */
+'.intro .img-ph{position:absolute;right:5%;top:8%;width:42%;height:72%;background:#7aa84a center/cover;clip-path:polygon(18% 0,100% 0,100% 78%,82% 100%,0 100%,0 22%);}'
+'.intro .navytri{position:absolute;right:5%;top:8%;width:14%;height:30%;background:var(--navy);clip-path:polygon(100% 0,0 0,100% 100%);}'
/* 17 goals grid */
+'.goals-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;width:48%;}'
+'.gtile{aspect-ratio:1;border-radius:3px;display:flex;flex-direction:column;justify-content:space-between;padding:5px 6px;color:#fff;font-size:.42rem;font-weight:700;line-height:1.1;}'
+'.gtile .num{font-size:.8rem;}'
/* leader green page */
+'.greenpg{background:var(--green);}.greenpg h2{color:var(--navy);}.greenpg p{color:#21305e;}'
+'.greenpg .quotecard{position:absolute;left:11%;top:14%;width:30%;height:62%;background:var(--navy);color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:8%;clip-path:polygon(0 0,86% 0,100% 12%,100% 100%,0 100%);}'
+'.greenpg .quotecard .img-ph{position:absolute;left:8%;top:8%;right:8%;height:52%;background:#cfd8e6 center/cover;}'
+'.greenpg .quotecard .q{font-size:.92rem;font-weight:700;text-align:center;}'
+'.greenpg .quotecard .by{font-size:.82rem;font-style:italic;text-align:center;margin-top:.6rem;}'
/* priority diagonal */
+'.prio{background:var(--green);position:relative;overflow:hidden;}'
+'.prio .creamtri{position:absolute;left:0;top:0;width:100%;height:100%;background:var(--cream);clip-path:polygon(0 36%,100% 86%,0 100%);}'
+'.prio .navytri{position:absolute;left:0;bottom:0;width:34%;height:42%;background:var(--navy);clip-path:polygon(0 100%,0 0,100% 100%);}'
+'.prio h2{position:absolute;right:6%;top:14%;width:42%;text-align:left;}'
+'.prio p.lead{position:absolute;right:6%;top:30%;width:42%;}'
+'.pcol{position:absolute;width:20%;}'
+'.picon{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:1.2rem;margin-bottom:.6rem;}'
+'.pcol h3{font-weight:800;color:var(--navy);font-size:.95rem;margin-bottom:.3rem;}'
+'.pcol p{font-size:.72rem;}'
/* measuring table */
+'.mtable{margin-top:1.5rem;}'
+'.mthead{display:grid;grid-template-columns:1fr 1fr 1fr;background:var(--green);color:var(--navy);font-weight:800;font-size:.82rem;letter-spacing:.04em;padding:.7rem 1.2rem;}'
+'.mtrow{display:grid;grid-template-columns:1fr 1fr 1fr;padding:.9rem 1.2rem;font-size:.8rem;color:var(--muted);}'
+'.mtrow:nth-child(odd){background:rgba(255,255,255,.45);}'
/* chart infographic */
+'.bignum{font-size:clamp(2.6rem,5vw,4rem);font-weight:800;color:var(--navy);line-height:1;}'
+'.numcard{background:var(--green);color:var(--navy);font-size:.78rem;font-weight:600;padding:.5rem .8rem;border-radius:3px;max-width:160px;margin-top:.4rem;}'
/* methods numbered */
+'.mnum{width:34px;height:34px;border-radius:50%;background:var(--green);color:var(--navy);display:grid;place-items:center;font-weight:800;flex-shrink:0;}'
+'.mitem{display:flex;gap:.8rem;}'
+'.mitem h3{font-weight:800;color:var(--navy);font-size:.95rem;letter-spacing:.03em;}'
+'.mitem p{font-size:.78rem;}'
+'.greenflag{background:var(--green);color:var(--navy);font-weight:700;text-align:center;padding:.9rem;clip-path:polygon(4% 0,96% 0,100% 50%,96% 100%,4% 100%,0 50%);}'
/* acknowledgements */
+'.ack .navytri{position:absolute;left:0;top:0;width:34%;height:36%;background:var(--navy);clip-path:polygon(0 0,100% 0,0 100%);}'
+'.ack .creamtri{position:absolute;left:0;bottom:6%;width:8%;height:14%;}'
+'.ack .img-ph{position:absolute;left:9%;top:18%;width:30%;height:64%;background:#b9b0a0 center/cover;}'
+'.ack .greentri{position:absolute;left:30%;top:64%;width:10%;height:18%;background:var(--green);clip-path:polygon(0 100%,100% 0,100% 100%);}'
+'.ack ul{margin-top:1rem;padding-left:1.1rem;}.ack li{font-size:.85rem;color:var(--muted);margin-bottom:.7rem;}.ack li b{color:var(--navy);}'
/* resource circles */
+'.circ-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;width:48%;}'
+'.circ{aspect-ratio:1;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:1.3rem;}';
var SDGCOLORS=['#e5243b','#dda63a','#4c9f38','#c5192d','#ff3a21','#26bde2','#fcc30b','#a21942','#fd6925','#dd1367','#fd9d24','#bf8b2e','#3f7e44','#0a97d9','#56c02b','#00689d','#19486a'];
var SDGNAMES=['NO POVERTY','ZERO HUNGER','GOOD HEALTH','QUALITY EDUCATION','GENDER EQUALITY','CLEAN WATER','CLEAN ENERGY','DECENT WORK','INNOVATION','REDUCED INEQUALITIES','SUSTAINABLE CITIES','RESPONSIBLE CONSUMPTION','CLIMATE ACTION','LIFE BELOW WATER','LIFE ON LAND','PEACE & JUSTICE','PARTNERSHIPS'];
var goals='';for(var i=0;i<17;i++){goals+='<div class="gtile" style="background:'+SDGCOLORS[i]+'"><span class="num">'+(i+1)+'</span><span class="editable">'+SDGNAMES[i]+'</span></div>';}
var circs='';for(var j=0;j<17;j++){circs+='<div class="circ" style="background:'+SDGCOLORS[j]+'">&#9679;</div>';}
function foot(pg){return '<div class="foot"><div class="c1"><span class="editable">Your Business<br>Name Here</span></div><div class="c2"><span class="editable">SDG Progress</span><br><b class="editable">Report 2025</b></div><span class="pg editable">'+pg+'</span></div>';}
var s=
/* 1 cover */
'<div class="slide active cover"><div class="photo"><div class="img-ph"></div></div><div class="navytri"></div><div class="greentri"></div><div class="logo" style="position:absolute;left:6%;top:9%"><span class="hexlogo"></span><span class="t editable">Business<br>Name</span></div><div class="ct"><h1 class="editable">Sustainable<br>Development<br>Goal Progress</h1></div><div class="meta"><div><span class="editable">SDG Progress</span><b class="editable">Report 2025</b></div><div><span class="editable">Presented By</span><b class="editable">Henrietta Mitchell</b></div><div><span class="editable">Date of</span><b class="editable">the Report</b></div></div></div>'
/* 2 intro */
+'<div class="slide intro"><div class="logo" style="position:absolute;left:6%;top:9%"><span class="hexlogo"></span><span class="t editable">Business<br>Name</span></div><div class="img-ph"></div><div class="navytri"></div><h1 class="editable" style="position:absolute;left:6%;top:30%">Introduction</h1><p class="editable" style="position:absolute;left:6%;top:46%;width:40%">Your SDG progress report can start with a brief review of your organization\'s alignment to the Global Goals. It can include the social responsibility and business case for taking action on the SDGs.<br><br>Creating a good SDG progress report means being transparent with your audience. Back up your claims with relevant data.</p>'+foot('04')+'</div>'
/* 3 17 goals */
+'<div class="slide"><div style="position:absolute;left:6%;top:14%;display:flex;align-items:center;gap:1rem"><div style="width:50px;height:50px;background:conic-gradient(#e5243b,#dda63a,#4c9f38,#26bde2,#fcc30b,#fd6925);border-radius:50%"></div><b class="editable" style="font-size:1.3rem;color:#222">THE GLOBAL GOALS</b></div><div class="goals-grid" style="position:absolute;left:6%;top:26%">'+goals+'</div><h1 class="editable" style="position:absolute;right:6%;top:14%;width:42%">The 17 Sustainable Development Goals</h1><p class="editable" style="position:absolute;right:6%;top:42%;width:42%">The Sustainable Development Goals (SDGs), also known as Global Goals, are a set of 17 integrated and interrelated goals to end poverty, protect the planet and ensure prosperity by 2030.</p>'+foot('03')+'</div>'
/* 4 leader green */
+'<div class="slide greenpg"><div class="quotecard"><div class="img-ph"></div><div class="q editable" style="margin-bottom:1.2rem">"Catch your reader\'s eye by highlighting one of your main points in this space."</div><div class="by editable">- Name Here</div></div><h2 class="editable" style="position:absolute;right:6%;top:16%;width:42%">Message from our leaders</h2><p class="editable" style="position:absolute;right:6%;top:40%;width:42%">This section is an opportunity to demonstrate how top management is taking the lead and giving direction to the company\'s sustainability efforts. An authentic, mission-driven statement sets the tone for the rest of the report.</p></div>'
/* 5 priority diagonal */
+'<div class="slide prio"><div class="creamtri"></div><div class="navytri"></div><h2 class="editable">Priority SDGs</h2><p class="lead editable">There are 17 SDGs and 169 targets in total. While they are all important, some will be more relevant to your business. This section can identify the specific SDGs your organization is prioritizing.</p><div class="pcol" style="left:9%;top:30%"><div class="picon" style="background:#26bde2">&#9874;</div><h3 class="editable">PRIORITY SDG</h3><p class="editable">To help give your audience an overview, include a brief description of the goal and its relevance to your sector.</p></div><div class="pcol" style="left:33%;top:44%"><div class="picon" style="background:#0a97d9">&#9992;</div><h3 class="editable">PRIORITY SDG</h3><p class="editable">To help give your audience an overview, include a brief description of the goal and its relevance.</p></div><div class="pcol" style="left:57%;top:58%"><div class="picon" style="background:#19486a">&#10058;</div><h3 class="editable">PRIORITY SDG</h3><p class="editable">To help give your audience an overview, include a brief description of the goal.</p></div></div>'
/* 6 measuring table */
+'<div class="slide"><h2 class="editable" style="position:absolute;left:6%;top:12%;width:32%">Measuring Progress</h2><p class="editable" style="position:absolute;right:6%;top:13%;width:42%">Performance goals are a good way to monitor and measure progress. Reporting performance can include indicators identified, data collected and SDG-related activities accomplished.</p><div class="mtable" style="position:absolute;left:6%;right:6%;top:36%"><div class="mthead"><span class="editable">KEY INDICATOR</span><span class="editable">ACTIVITY / PROJECT</span><span class="editable">DATA / OUTCOME</span></div><div class="mtrow"><span class="editable">Your Key Performance Indicator goes here</span><span class="editable">Add a few details describing the related activities</span><span class="editable">&bull; What results did you obtain?<br>&bull; Write them here.</span></div><div class="mtrow"><span class="editable">Your Key Performance Indicator goes here</span><span class="editable">Add a few details describing the related activities</span><span class="editable">&bull; What results did you obtain?<br>&bull; Write them here.</span></div><div class="mtrow"><span class="editable">Your Key Performance Indicator goes here</span><span class="editable">Add a few details describing the related activities</span><span class="editable">&bull; What results did you obtain?<br>&bull; Write them here.</span></div></div>'+foot('07')+'</div>'
/* 7 chart infographic */
+'<div class="slide"><h2 class="editable" style="position:absolute;left:13%;top:14%;width:28%">What\'s your Infographic Title?</h2><p class="editable" style="position:absolute;right:6%;top:14%;width:38%">Performance goals are a good way to monitor and measure progress over time. Reporting can include indicators identified and data collected.</p><div style="position:absolute;left:13%;top:38%;width:46%;height:42%;border-left:1.5px solid var(--navy);border-bottom:1.5px solid var(--navy)"><svg viewBox="0 0 400 200" preserveAspectRatio="none" style="width:100%;height:100%"><polyline points="20,150 110,90 200,120 290,40 380,30" fill="none" stroke="#1f2d5c" stroke-width="3"/><polyline points="20,190 110,170 200,70 290,110 380,150" fill="none" stroke="#4c9f38" stroke-width="3"/><polyline points="20,160 110,180 200,130 290,140 380,20" fill="none" stroke="#c3e36b" stroke-width="3"/></svg></div><div style="position:absolute;right:9%;top:36%"><div class="bignum editable">100</div><div class="numcard editable">Readers appreciate accurate information</div></div><div style="position:absolute;right:9%;top:60%"><div class="bignum editable">80</div><div class="numcard editable">Readers appreciate accurate information</div></div>'+foot('08')+'</div>'
/* 8 methods numbered */
+'<div class="slide"><p class="editable" style="position:absolute;left:50%;transform:translateX(-50%);top:14%;width:60%;text-align:center;font-weight:800;color:var(--navy);font-size:1rem">What should you be including in your SDG progress report? Here are a few methods to consider when presenting your data:</p><div class="mitem" style="position:absolute;left:14%;top:34%;width:22%"><div class="mnum">1</div><div><h3 class="editable">KEY STATISTICS</h3><p class="editable">your most important quantitative data</p></div></div><div class="mitem" style="position:absolute;left:40%;top:34%;width:22%"><div class="mnum">2</div><div><h3 class="editable">KEY FINDINGS</h3><p class="editable">qualitative results from SDG projects</p></div></div><div class="mitem" style="position:absolute;left:66%;top:34%;width:22%"><div class="mnum">3</div><div><h3 class="editable">REPORT CARDS</h3><p class="editable">criteria and grade assessments</p></div></div><div class="mitem" style="position:absolute;left:27%;top:54%;width:22%"><div class="mnum">4</div><div><h3 class="editable">INFOGRAPHICS</h3><p class="editable">an organized snapshot of relevant data</p></div></div><div class="mitem" style="position:absolute;left:53%;top:54%;width:22%"><div class="mnum">5</div><div><h3 class="editable">TIMELINES</h3><p class="editable">a visual way to track progress over time</p></div></div><div class="greenflag editable" style="position:absolute;left:50%;transform:translateX(-50%);top:72%;width:60%">Catch your reader\'s eye by highlighting one of your main points in this space.</div>'+foot('09')+'</div>'
/* 9 acknowledgements */
+'<div class="slide ack"><div class="navytri"></div><div class="img-ph"></div><div class="greentri"></div><h2 class="editable" style="position:absolute;right:6%;top:14%;width:46%;text-align:left">Acknowledgements</h2><p class="editable" style="position:absolute;right:6%;top:28%;width:46%">Most reports conclude with a page acknowledging the contributions of the people who worked tirelessly on the projects mentioned within:</p><div style="position:absolute;right:6%;top:46%;width:46%"><ul><li class="editable">Those responsible for <b>concept and coordination</b></li><li class="editable">Your <b>group of researchers</b></li><li class="editable">The <b>writers</b> behind the impact report</li><li class="editable">The <b>designers</b> of the impact report</li><li class="editable">Your <b>contributors</b></li></ul></div>'+foot('12')+'</div>'
/* 10 thank you green */
+'<div class="slide greenpg" style="display:flex;flex-direction:column;justify-content:center;align-items:center"><h1 class="editable" style="color:var(--navy);font-size:clamp(3rem,6vw,5rem)">Thank You</h1><p class="editable" style="color:#21305e;font-size:1.2rem;margin-top:1rem">携手共建可持续未来</p></div>'
/* 11 free resource page */
+'<div class="slide"><h1 class="editable" style="position:absolute;left:13%;top:24%">Free<br>Resource<br>Page</h1><p class="editable" style="position:absolute;left:13%;bottom:22%;width:24%">Use these official Sustainable Development Goal elements in your presentation.</p><div class="circ-grid" style="position:absolute;right:6%;top:16%">'+circs+'</div></div>'
/* 12 closing footer page */
+'<div class="slide" style="display:flex;flex-direction:column;justify-content:center;padding:0 6%"><div class="logo" style="margin-bottom:2rem"><span class="hexlogo"></span><span class="t editable">Business Name</span></div><h2 class="editable">Questions &amp; Discussion</h2><p class="editable" style="margin-top:1rem;width:60%">Thank you for reviewing our SDG progress report. We welcome your questions, feedback and ideas for collaboration toward the 2030 goals.</p>'+foot('13')+'</div>';
return shell({title:'Green Blue SDG Report',vars:vars,css:css,slides:s});
}});

/* ===== 4. Blue Red Diagonal Sales（蓝红对角销售报告 · 11页）===== */
T.push({id:'blue-red-sales',name:'蓝红销售报告',en:'Blue Red Sales Report',accent:'#e8431f',bg:'#ffffff',build:function(){
var vars='--blue:#1f33b3;--red:#ea4423;--ink:#16181d;--muted:#555;--white:#fff;';
var css=
'.slide{background:var(--white);color:var(--ink);font-family:"Inter",sans-serif;}'
+'h1{font-weight:800;font-size:clamp(2.6rem,5.4vw,4.4rem);line-height:1.02;letter-spacing:-.02em;}'
+'h2{font-weight:800;font-size:clamp(1.8rem,3vw,2.6rem);}'
+'p{font-size:clamp(.9rem,1.15vw,1.08rem);line-height:1.55;color:var(--muted);}'
+'.brand{display:flex;align-items:center;gap:.5rem;font-weight:800;letter-spacing:.02em;}'
+'.tri{width:0;height:0;border-left:11px solid currentColor;border-top:7px solid transparent;border-bottom:7px solid transparent;}'
/* 封面 */
+'.cover{position:relative;overflow:hidden;}'
+'.cover .bluetri{position:absolute;left:0;top:0;width:42%;height:100%;background:var(--blue);clip-path:polygon(0 0,100% 0,52% 100%,0 100%);}'
+'.cover .redtri{position:absolute;left:0;top:0;width:24%;height:38%;background:var(--red);clip-path:polygon(0 0,100% 0,0 100%);}'
+'.cover .photo{position:absolute;left:18%;top:0;width:40%;height:62%;background:linear-gradient(135deg,#aaa,#444);clip-path:polygon(30% 0,100% 0,70% 100%,0 100%);}'
+'.cover .ct{position:absolute;right:6%;bottom:16%;text-align:right;width:54%;}'
/* major wins */
+'.wins{position:absolute;left:0;top:0;width:100%;height:44%;background:linear-gradient(135deg,#777,#333);display:flex;align-items:center;justify-content:center;}'
+'.wins h2{color:#fff;}'
+'.wincol{position:absolute;width:26%;text-align:center;top:30%;}'
+'.wincirc{width:74px;height:74px;border-radius:50%;background:var(--blue);color:#fff;display:grid;place-items:center;font-size:1.6rem;margin:0 auto 1.2rem;}'
+'.wincol h3{font-weight:800;font-size:1.05rem;margin-bottom:.6rem;}'
/* sales teams 左图右字 */
+'.lt{display:grid;grid-template-columns:.95fr 1.1fr;height:100%;align-items:center;}'
+'.lt .photo{position:relative;height:100%;background:linear-gradient(135deg,#888,#222);overflow:hidden;}'
+'.lt .photo .redtri{position:absolute;bottom:0;left:0;width:60%;height:38%;background:var(--red);clip-path:polygon(0 100%,0 0,100% 100%);}'
+'.lt .txt{padding:0 6%;}'
+'.lt .txt .strong{font-weight:800;color:var(--ink);margin-top:1.6rem;font-size:clamp(.95rem,1.3vw,1.15rem);line-height:1.4;}'
/* big number */
+'.bignum{font-weight:800;font-size:clamp(2.8rem,6vw,5rem);color:var(--ink);line-height:1;letter-spacing:-.02em;}'
/* donut */
+'.donut{width:230px;height:230px;border-radius:50%;background:conic-gradient(#ea4423 0 20%,#f06a4f 20% 40%,#f4978a 40% 60%,#f8c0b8 60% 80%,#fbe0db 80% 100%);position:relative;}'
+'.donut::after{content:"";position:absolute;inset:30%;background:#fff;border-radius:50%;}'
+'.dlabel{position:absolute;font-size:.78rem;text-align:center;color:var(--ink);}'
/* section blue */
+'.sec{background:var(--blue);color:#fff;position:relative;overflow:hidden;}'
+'.sec h1{color:#fff;}.sec .sub{color:rgba(255,255,255,.8);font-size:1.1rem;margin-top:.8rem;}'
+'.sec .browser{position:absolute;right:5%;top:18%;width:42%;height:64%;background:#fff;border-radius:8px;box-shadow:0 14px 40px rgba(0,0,0,.3);overflow:hidden;}'
+'.sec .bbar{height:30px;background:#e8e8e8;display:flex;align-items:center;gap:5px;padding:0 10px;}'
+'.sec .bbar i{width:9px;height:9px;border-radius:50%;background:#bbb;}'
+'.sec .bimg{height:calc(100% - 30px);background:linear-gradient(135deg,#aab,#556);}'
+'.sec .darktri{position:absolute;right:0;top:0;width:30%;height:100%;background:#16181d;clip-path:polygon(40% 0,100% 0,100% 100%,0 100%);}';
var s=
/* 1 cover */
'<div class="slide active cover"><div class="bluetri"></div><div class="redtri"></div><div class="photo"><div class="img-ph" style="width:100%;height:100%;clip-path:polygon(30% 0,100% 0,70% 100%,0 100%)"></div></div><div class="brand editable" style="position:absolute;right:6%;top:8%"><span class="tri"></span> JEFFRIES AND MADISON</div><div class="ct"><h1 class="editable">January 2025<br>Sales Report</h1><p class="editable" style="margin-top:1rem;color:var(--ink);font-size:1.1rem">Monthly recap by Cassandra Lopez</p></div></div>'
/* 2 major wins */
+'<div class="slide"><div class="wins"><h2 class="editable">Major Wins</h2></div><div class="wincol" style="left:6%"><div class="wincirc">&#10003;</div><h3 class="editable">We gained five new clients.</h3><p class="editable">Apply page animations and transitions to emphasize ideas and make them even more memorable.</p></div><div class="wincol" style="left:37%"><div class="wincirc">&#128100;</div><h3 class="editable">Three of these clients are from cold calls.</h3><p class="editable">Apply page animations and transitions to emphasize ideas and make them even more memorable.</p></div><div class="wincol" style="right:6%"><div class="wincirc">&#128203;</div><h3 class="editable">Key client Willifred Industries doubled its order.</h3><p class="editable">Apply page animations and transitions to emphasize ideas and make them even more memorable.</p></div></div>'
/* 3 sales teams left photo */
+'<div class="slide"><div class="lt"><div class="photo"><div class="img-ph" style="width:100%;height:100%"></div><div class="redtri"></div></div><div class="txt"><h1 class="editable">Sales Teams</h1><p class="editable" style="margin-top:1rem">Team Milenna Lane is currently implementing the 2025 digital sales campaign.</p><div class="strong editable">The campaign spans multiple channels, including e-commerce updates, email marketing, and online advertising.</div><p class="editable" style="margin-top:1rem">Visualize complicated and dense information with graphs and charts to add more context.</p></div></div></div>'
/* 4 sales leads donut */
+'<div class="slide"><div style="position:absolute;left:0;top:0;width:38%;height:100%;background:var(--blue);color:#fff;padding:9% 5%;display:flex;flex-direction:column;justify-content:center"><h1 class="editable" style="color:#fff;font-size:clamp(2.2rem,4vw,3.2rem)">Sales Leads</h1><p class="editable" style="color:rgba(255,255,255,.8);margin-top:.6rem;font-size:1rem">By Sales and Event Coordinator</p><p class="editable" style="color:rgba(255,255,255,.7);margin-top:2rem;font-size:.9rem">Visualize complicated and dense information with graphs and charts.</p></div><div style="position:absolute;right:10%;top:50%;transform:translateY(-50%)"><div class="donut"></div></div><p class="editable" style="position:absolute;right:6%;bottom:8%;width:46%;text-align:center;font-weight:800;color:var(--ink)">Keith Shannons had the highest percentage of leads in January at 25%.</p></div>'
/* 5 new customers big number */
+'<div class="slide"><div style="position:absolute;left:6%;top:14%"><h1 class="editable">New Customers</h1></div><div style="position:absolute;left:6%;top:42%;width:44%"><div class="bignum editable">123,456,789</div><p class="editable" style="margin-top:1rem;color:var(--ink);font-weight:600">Newly acquired customers YTD<br>Goal: 150,000,000</p><p class="editable" style="margin-top:1rem">Present with ease and wow any audience. Choose from over a thousand professionally-made templates.</p></div><div style="position:absolute;right:0;top:0;width:42%;height:100%;background:linear-gradient(135deg,#999,#333);clip-path:polygon(28% 0,100% 0,100% 100%,0 100%)"><div class="img-ph" style="width:100%;height:100%;clip-path:polygon(28% 0,100% 0,100% 100%,0 100%)"></div></div><div style="position:absolute;right:30%;bottom:0;width:14%;height:34%;background:var(--red);clip-path:polygon(0 100%,100% 0,100% 100%)"></div></div>'
/* 6 sales forecasts section */
+'<div class="slide sec"><div class="darktri"></div><div style="position:absolute;left:6%;top:50%;transform:translateY(-50%)"><h1 class="editable">Sales<br>Forecasts</h1><div class="sub editable">Where we are headed</div></div><div class="browser"><div class="bbar"><i></i><i></i><i></i></div><div class="bimg"><div class="img-ph" style="width:100%;height:100%"></div></div></div></div>'
/* 7 KPI three blocks */
+'<div class="slide"><h2 class="editable" style="position:absolute;left:6%;top:14%">Key Metrics</h2><div style="position:absolute;left:6%;top:36%;width:26%;border-top:5px solid var(--blue);padding-top:1.2rem"><div class="bignum editable" style="font-size:3rem;color:var(--blue)">1,234</div><p class="editable" style="margin-top:.6rem">本月新增线索 New Leads</p></div><div style="position:absolute;left:37%;top:36%;width:26%;border-top:5px solid var(--red);padding-top:1.2rem"><div class="bignum editable" style="font-size:3rem;color:var(--red)">38%</div><p class="editable" style="margin-top:.6rem">转化率 Conversion</p></div><div style="position:absolute;right:6%;top:36%;width:26%;border-top:5px solid var(--blue);padding-top:1.2rem"><div class="bignum editable" style="font-size:3rem;color:var(--blue)">¥2.4M</div><p class="editable" style="margin-top:.6rem">成交金额 Revenue</p></div></div>'
/* 8 two-col compare */
+'<div class="slide"><h2 class="editable" style="position:absolute;left:6%;top:12%">Pipeline Breakdown</h2><div style="position:absolute;left:6%;top:32%;width:40%;background:#f3f4fb;border-radius:10px;padding:2rem"><h3 class="editable" style="color:var(--blue);font-weight:800;font-size:1.3rem">现状 Current</h3><p class="editable" style="margin-top:.8rem">描述当前管道状态与主要瓶颈。</p></div><div style="position:absolute;right:6%;top:32%;width:40%;background:#fdece8;border-radius:10px;padding:2rem"><h3 class="editable" style="color:var(--red);font-weight:800;font-size:1.3rem">目标 Target</h3><p class="editable" style="margin-top:.8rem">描述目标管道与达成路径。</p></div></div>'
/* 9 selling activities steps */
+'<div class="slide"><h2 class="editable" style="position:absolute;left:6%;top:12%">Selling Activities</h2><div style="position:absolute;left:6%;right:6%;top:46%;display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;text-align:center"><div><div class="wincirc" style="background:var(--red)">1</div><h3 class="editable" style="font-weight:800">触达</h3><p class="editable">初次接触与需求识别</p></div><div><div class="wincirc">2</div><h3 class="editable" style="font-weight:800">培育</h3><p class="editable">方案沟通与价值传递</p></div><div><div class="wincirc" style="background:var(--red)">3</div><h3 class="editable" style="font-weight:800">谈判</h3><p class="editable">商务条款与报价</p></div><div><div class="wincirc">4</div><h3 class="editable" style="font-weight:800">成交</h3><p class="editable">签约与交付启动</p></div></div></div>'
/* 10 summary dark */
+'<div class="slide sec"><div class="darktri" style="clip-path:polygon(0 0,100% 0,60% 100%,0 100%)"></div><div style="position:absolute;right:6%;top:50%;transform:translateY(-50%);width:50%;text-align:right"><h1 class="editable">Summary of Sales KPIs</h1><p class="editable" style="color:rgba(255,255,255,.8);margin-top:1rem">在此总结本月关键销售指标的整体表现与趋势判断，突出亮点与需要关注的风险点。</p></div></div>'
/* 11 thank you cover-style */
+'<div class="slide cover"><div class="bluetri" style="clip-path:polygon(0 0,100% 0,100% 100%,48% 100%);left:auto;right:0"></div><div class="redtri" style="left:auto;right:0;clip-path:polygon(100% 0,0 0,100% 100%)"></div><div style="position:absolute;left:6%;top:50%;transform:translateY(-50%)"><h1 class="editable">Thank You</h1><p class="editable" style="margin-top:1rem;color:var(--ink);font-size:1.1rem">感谢观看 · Questions?</p></div></div>';
return shell({title:'Blue Red Sales Report',vars:vars,css:css,slides:s});
}});

/* ===== 5. Company Internal Deck（企业内部 · 六边形 · 11页）===== */
T.push({id:'company-deck',name:'企业内部',en:'Company Internal Deck',accent:'#1aa179',bg:'#f0f1ef',build:function(){
var vars='--bg:#f0f1ef;--teal:#0d3b3b;--green:#1aa179;--lime:#9ad05a;--ink:#1a1a1a;--muted:#555;';
var css=
'.slide{background:var(--bg);color:var(--ink);font-family:"Inter",sans-serif;}'
+'h1{font-weight:800;font-size:clamp(2.6rem,5.4vw,4.4rem);line-height:1.04;letter-spacing:-.01em;}'
+'h2{font-weight:800;font-size:clamp(1.8rem,3vw,2.6rem);}'
+'p{font-size:clamp(.85rem,1.1vw,1rem);line-height:1.55;color:var(--muted);}'
+'.sub{font-size:clamp(1rem,1.4vw,1.2rem);color:var(--muted);}'
+'.logo{display:flex;align-items:center;gap:.5rem;font-weight:700;}'
+'.hexlogo{width:26px;height:30px;background:var(--green);clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);}'
+'.back{position:absolute;bottom:6%;left:6%;font-size:.78rem;color:var(--muted);}'
+'.hex{clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);}'
/* 封面六边形群 */
+'.hexgroup{position:absolute;right:-2%;top:0;width:42%;height:100%;}'
+'.hexgroup .h{position:absolute;}'
/* timeline */
+'.tl{position:absolute;left:6%;right:6%;bottom:18%;}'
+'.tl-row{display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;}'
+'.tl-row .yr{font-weight:800;color:var(--green);font-size:1.3rem;margin-bottom:.4rem;}'
+'.tl-axis{position:relative;height:2px;background:var(--teal);margin-top:1.5rem;}'
+'.tl-axis .node{position:absolute;top:50%;transform:translate(-50%,-50%);width:14px;height:16px;background:var(--teal);}'
/* dark teal section */
+'.dark{background:var(--teal);color:#fff;}.dark h2{color:#fff;}.dark p{color:rgba(255,255,255,.78);}'
+'.dark .lime-head{position:absolute;left:0;top:0;width:42%;height:18%;background:var(--lime);clip-path:polygon(0 0,100% 0,86% 100%,0 100%);display:flex;align-items:center;padding-left:6%;}'
+'.dark .lime-head h2{color:var(--ink);}'
+'.dark .greenhex{position:absolute;left:40%;top:2%;width:90px;height:104px;background:var(--green);}'
/* goal cards */
+'.gcard{background:#f0f1ef;color:var(--ink);text-align:center;padding:2.2rem 1.5rem;border-radius:2px;}'
+'.gcard .n{font-weight:800;font-size:1.6rem;line-height:1.2;}'
/* calendar */
+'.cal{position:absolute;left:5%;right:5%;top:24%;display:flex;flex-direction:column;gap:1.4rem;}'
+'.cal-row{display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;}'
+'.cal-m{}'
+'.cal-m .mh{background:var(--lime);color:var(--ink);font-weight:700;text-align:center;padding:.4rem;font-size:.85rem;}'
+'.cal-m .mb{font-size:.72rem;color:rgba(255,255,255,.7);text-align:center;margin-top:.6rem;}'
/* agenda */
+'.ag-item{display:grid;grid-template-columns:auto 1fr;gap:1.2rem;align-items:center;padding:1rem 0;border-bottom:1px solid #d6d8d4;}'
+'.ag-item .hexn{width:38px;height:44px;background:var(--green);color:#fff;display:grid;place-items:center;font-weight:800;}';
function back(){return '<div class="back editable">Back to Agenda Page</div>';}
var s=
/* 1 cover hexagons */
'<div class="slide active"><div class="logo" style="position:absolute;left:6%;top:9%"><span class="hexlogo"></span><span class="editable">Add Company Name</span></div><div class="hexgroup"><div class="h hex" style="right:14%;top:6%;width:150px;height:172px;background:var(--green)"></div><div class="h hex" style="right:0;top:24%;width:160px;height:184px;background:var(--teal)"></div><div class="h hex" style="right:30%;top:46%;width:90px;height:104px;background:var(--lime)"></div><div class="h hex" style="right:8%;top:60%;width:150px;height:172px;background:var(--green)"></div></div><h1 class="editable" style="position:absolute;left:6%;top:38%">Company<br>Internal Deck</h1><div class="sub editable" style="position:absolute;left:6%;top:64%">Add a short description here</div></div>'
/* 2 agenda */
+'<div class="slide"><h1 class="editable" style="position:absolute;left:6%;top:12%">Agenda</h1><div style="position:absolute;left:6%;right:8%;top:32%"><div class="ag-item"><span class="hexn">1</span><div><b class="editable" style="font-size:1.1rem">History</b></div></div><div class="ag-item"><span class="hexn">2</span><div><b class="editable" style="font-size:1.1rem">Goals and Strategy</b></div></div><div class="ag-item"><span class="hexn">3</span><div><b class="editable" style="font-size:1.1rem">Calendar and Key Dates</b></div></div><div class="ag-item"><span class="hexn">4</span><div><b class="editable" style="font-size:1.1rem">Team and Roles</b></div></div></div></div>'
/* 3 history timeline */
+'<div class="slide"><h1 class="editable" style="position:absolute;left:6%;top:12%">History</h1><div class="hexgroup" style="width:32%;height:50%"><div class="h hex" style="right:18%;top:0;width:80px;height:92px;background:var(--lime)"></div><div class="h hex" style="right:4%;top:18%;width:140px;height:160px;background:var(--green)"></div><div class="h hex" style="right:0;top:54%;width:90px;height:104px;background:var(--teal)"></div></div><div class="tl"><div class="tl-row"><div><div class="yr editable">2015</div><p class="editable">Briefly elaborate on a milestone the company achieved in this period.</p></div><div><div class="yr editable">2016</div><p class="editable">Briefly elaborate on a milestone the company achieved in this period.</p></div><div><div class="yr editable">2017</div><p class="editable">Briefly elaborate on a milestone the company achieved in this period.</p></div><div><div class="yr editable">Present</div><p class="editable">Briefly elaborate on a milestone the company achieved in this period.</p></div></div><div class="tl-axis"><span class="node hex" style="left:0"></span><span class="node hex" style="left:33.3%"></span><span class="node hex" style="left:66.6%"></span><span class="node hex" style="left:100%"></span></div></div>'+back()+'</div>'
/* 4 goals dark */
+'<div class="slide dark"><div class="lime-head"><h2 class="editable">Goals and Strategy</h2></div><div class="greenhex hex"></div><div class="back editable" style="color:rgba(255,255,255,.7);top:8%;bottom:auto;left:auto;right:6%">Back to Agenda Page</div><div style="position:absolute;left:18%;top:40%;width:28%"><div class="gcard"><div class="n editable">700,000<br>New Users</div></div><ul style="margin-top:1rem;padding-left:1.1rem;color:rgba(255,255,255,.8);font-size:.85rem"><li class="editable">Discuss the strategies your company will take.</li><li class="editable">Elaborate using a bulleted list.</li></ul></div><div style="position:absolute;right:18%;top:40%;width:28%"><div class="gcard"><div class="n editable">$70 B<br>Target Revenue</div></div><ul style="margin-top:1rem;padding-left:1.1rem;color:rgba(255,255,255,.8);font-size:.85rem"><li class="editable">Discuss the strategies your company will take.</li><li class="editable">Elaborate using a bulleted list.</li></ul></div></div>'
/* 5 calendar dark */
+'<div class="slide dark"><h1 class="editable" style="position:absolute;left:50%;transform:translateX(-50%);top:7%;color:#fff;font-size:clamp(2rem,4vw,3rem)">Calendar and Key Dates</h1><div class="cal">'
+'<div class="cal-row"><div class="cal-m"><div class="mh editable">January</div><div class="mb editable">Double click to add task or events</div></div><div class="cal-m"><div class="mh editable">February</div><div class="mb editable">Double click to add task or events</div></div><div class="cal-m"><div class="mh editable">March</div><div class="mb editable">Double click to add task or events</div></div><div class="cal-m"><div class="mh editable">April</div><div class="mb editable">Double click to add task or events</div></div></div>'
+'<div class="cal-row"><div class="cal-m"><div class="mh editable">May</div><div class="mb editable">Double click to add task or events</div></div><div class="cal-m"><div class="mh editable">June</div><div class="mb editable">Double click to add task or events</div></div><div class="cal-m"><div class="mh editable">July</div><div class="mb editable">Double click to add task or events</div></div><div class="cal-m"><div class="mh editable">August</div><div class="mb editable">Double click to add task or events</div></div></div>'
+'<div class="cal-row"><div class="cal-m"><div class="mh editable">September</div><div class="mb editable">Double click to add task or events</div></div><div class="cal-m"><div class="mh editable">October</div><div class="mb editable">Double click to add task or events</div></div><div class="cal-m"><div class="mh editable">November</div><div class="mb editable">Double click to add task or events</div></div><div class="cal-m"><div class="mh editable">December</div><div class="mb editable">Double click to add task or events</div></div></div>'
+'</div><div class="back editable" style="color:rgba(255,255,255,.7)">Back to Agenda Page</div></div>'
/* 6 team roles */
+'<div class="slide"><h1 class="editable" style="position:absolute;left:6%;top:12%">Team and Roles</h1><div style="position:absolute;left:6%;right:6%;top:36%;display:grid;grid-template-columns:repeat(4,1fr);gap:2rem;text-align:center">'
+'<div><div class="hex" style="width:90px;height:104px;background:var(--green);margin:0 auto 1rem"></div><b class="editable">成员姓名</b><p class="editable">职位 Title</p></div>'
+'<div><div class="hex" style="width:90px;height:104px;background:var(--teal);margin:0 auto 1rem"></div><b class="editable">成员姓名</b><p class="editable">职位 Title</p></div>'
+'<div><div class="hex" style="width:90px;height:104px;background:var(--lime);margin:0 auto 1rem"></div><b class="editable">成员姓名</b><p class="editable">职位 Title</p></div>'
+'<div><div class="hex" style="width:90px;height:104px;background:var(--green);margin:0 auto 1rem"></div><b class="editable">成员姓名</b><p class="editable">职位 Title</p></div></div>'+back()+'</div>'
/* 7 metrics */
+'<div class="slide"><h1 class="editable" style="position:absolute;left:6%;top:12%">Key Metrics</h1><div style="position:absolute;left:6%;right:6%;top:40%;display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem">'
+'<div style="background:#fff;border-top:5px solid var(--green);padding:1.8rem;border-radius:2px"><div style="font-weight:800;font-size:2.4rem;color:var(--green)" class="editable">98%</div><p class="editable" style="margin-top:.4rem">满意度 Satisfaction</p></div>'
+'<div style="background:#fff;border-top:5px solid var(--teal);padding:1.8rem;border-radius:2px"><div style="font-weight:800;font-size:2.4rem;color:var(--teal)" class="editable">2.4x</div><p class="editable" style="margin-top:.4rem">效率提升 Efficiency</p></div>'
+'<div style="background:#fff;border-top:5px solid var(--lime);padding:1.8rem;border-radius:2px"><div style="font-weight:800;font-size:2.4rem;color:#5a8a2a" class="editable">1,283</div><p class="editable" style="margin-top:.4rem">累计处理 Total</p></div></div>'+back()+'</div>'
/* 8 strategy two col */
+'<div class="slide dark"><div class="lime-head"><h2 class="editable">Strategy Pillars</h2></div><div class="greenhex hex"></div><div style="position:absolute;left:8%;top:42%;width:38%"><h3 class="editable" style="color:var(--lime);font-weight:800;font-size:1.3rem">支柱一 Growth</h3><p class="editable" style="margin-top:.8rem">描述第一个战略支柱的核心方向与行动。</p></div><div style="position:absolute;right:8%;top:42%;width:38%"><h3 class="editable" style="color:var(--lime);font-weight:800;font-size:1.3rem">支柱二 Efficiency</h3><p class="editable" style="margin-top:.8rem">描述第二个战略支柱的核心方向与行动。</p></div></div>'
/* 9 process flow */
+'<div class="slide"><h1 class="editable" style="position:absolute;left:6%;top:12%">Process</h1><div style="position:absolute;left:6%;right:6%;top:44%;display:flex;align-items:center;gap:1rem">'
+'<div style="flex:1;background:#fff;border-radius:10px;padding:1.4rem;border-left:4px solid var(--green)"><h3 class="editable" style="color:var(--green);font-weight:800">Plan</h3><p class="editable">明确目标与范围</p></div>'
+'<div style="color:var(--green);font-size:1.6rem;font-weight:800">&rarr;</div>'
+'<div style="flex:1;background:#fff;border-radius:10px;padding:1.4rem;border-left:4px solid var(--teal)"><h3 class="editable" style="color:var(--teal);font-weight:800">Build</h3><p class="editable">执行与里程碑管理</p></div>'
+'<div style="color:var(--green);font-size:1.6rem;font-weight:800">&rarr;</div>'
+'<div style="flex:1;background:#fff;border-radius:10px;padding:1.4rem;border-left:4px solid var(--lime)"><h3 class="editable" style="color:#5a8a2a;font-weight:800">Review</h3><p class="editable">复盘与持续优化</p></div></div>'+back()+'</div>'
/* 10 quote dark */
+'<div class="slide dark" style="display:flex;flex-direction:column;justify-content:center;padding:0 12%"><div class="hex" style="position:absolute;left:6%;top:14%;width:70px;height:80px;background:var(--lime)"></div><h2 class="editable" style="font-size:clamp(1.6rem,2.8vw,2.4rem);line-height:1.4">"团队的力量来自于清晰的目标和彼此的信任。"</h2><p class="editable" style="margin-top:1.4rem;color:var(--lime);font-weight:700">— Leadership Team</p></div>'
/* 11 thank you hexagons */
+'<div class="slide"><div class="hexgroup"><div class="h hex" style="right:14%;top:10%;width:140px;height:160px;background:var(--green)"></div><div class="h hex" style="right:0;top:30%;width:150px;height:172px;background:var(--teal)"></div><div class="h hex" style="right:24%;top:52%;width:90px;height:104px;background:var(--lime)"></div></div><h1 class="editable" style="position:absolute;left:6%;top:46%">Thank You</h1><div class="sub editable" style="position:absolute;left:6%;top:62%">感谢观看 · 欢迎讨论</div></div>';
return shell({title:'Company Internal Deck',vars:vars,css:css,slides:s});
}});

/* ===== 6. Marketing Strategy（营销策略 · 暖米橙 · 11页）===== */
T.push({id:'marketing-strategy',name:'营销策略',en:'Marketing Strategy',accent:'#e8814e',bg:'#fdf6ef',build:function(){
var vars='--cream:#fdf6ef;--ink:#2b2926;--muted:#6b6760;--orange:#e8814e;--line:#e2dcd2;';
var css=
'.slide{background:var(--cream);color:var(--ink);font-family:"Inter",sans-serif;}'
+'h1{font-weight:400;font-size:clamp(2.8rem,5.6vw,4.6rem);line-height:1.02;letter-spacing:-.01em;}'
+'h2{font-weight:400;font-size:clamp(2rem,3.6vw,3rem);}'
+'p{font-size:clamp(.82rem,1.05vw,.98rem);line-height:1.5;color:var(--muted);}'
+'.amp{color:var(--orange);}'
+'.brand{display:flex;align-items:center;gap:.7rem;}'
+'.flower{width:30px;height:30px;color:var(--orange);font-size:1.6rem;line-height:1;}'
+'.brand .t{font-weight:700;font-size:.72rem;letter-spacing:.1em;line-height:1.3;}'
+'.back{position:absolute;left:6%;bottom:6%;font-size:.78rem;color:var(--ink);text-decoration:underline;}'
+'.kicker{font-weight:700;font-size:.95rem;}'
/* cover */
+'.cover .img-ph{position:absolute;left:6%;top:12%;width:34%;height:76%;border-radius:16px;background:#cfc6ba center/cover;}'
+'.cover .ct{position:absolute;right:6%;top:28%;width:48%;}'
+'.cover .meta{position:absolute;right:6%;bottom:14%;display:flex;align-items:center;gap:1.5rem;font-size:.85rem;}'
+'.cover .meta b{font-weight:700;}.cover .meta .div{width:1px;height:20px;background:var(--orange);}'
/* vision mission goals */
+'.vmg{display:flex;flex-direction:column;gap:0;}'
+'.vmg-row{display:grid;grid-template-columns:.5fr 1fr;gap:2rem;padding:1.6rem 0;align-items:start;}'
+'.vmg-row+.vmg-row{border-top:1px solid var(--orange);}'
+'.vmg-row h2{font-size:clamp(1.4rem,2.4vw,2rem);}'
/* swot / pricing table */
+'.tbl{position:absolute;left:5%;right:5%;top:30%;}'
+'.tbl .thead{display:grid;border-bottom:1px solid var(--line);}'
+'.tbl .thead.c4{grid-template-columns:repeat(4,1fr);}'
+'.tbl .th{padding:1rem;font-size:1.05rem;font-weight:400;border-right:1px solid var(--orange);}'
+'.tbl .th:last-child{border-right:none;}'
+'.tbl .tbody{display:grid;}'
+'.tbl .tbody.c4{grid-template-columns:repeat(4,1fr);}'
+'.tbl .td{padding:1.2rem 1rem;border-right:1px solid var(--orange);}'
+'.tbl .td:last-child{border-right:none;}'
+'.tbl .td ul{margin:0;padding-left:1rem;}.tbl .td li{font-size:.8rem;color:var(--muted);margin-bottom:.7rem;}'
+'.tbl .td p{font-size:.8rem;text-align:center;}'
+'.orange-note{background:var(--orange);color:#fff;font-size:.72rem;text-align:center;padding:.7rem 1rem;border-radius:4px;max-width:62%;margin:0 auto;}'
/* big quote/number */
+'.bignum{font-weight:400;font-size:clamp(3rem,6vw,5rem);color:var(--ink);}';
function back(){return '<div class="back editable">Back to agenda</div>';}
var s=
/* 1 cover */
'<div class="slide active cover"><div class="brand" style="position:absolute;left:44%;top:10%"><span class="flower">&#10052;</span><span class="t editable">MODERN<br>LIFESTYLE<br>STORE</span></div><div class="img-ph"></div><div class="ct"><h1 class="editable">Marketing<br>Strategy<br>Presentation</h1></div><div class="meta"><b class="editable">Presented By</b><span class="editable">Andrew West</span><span class="div"></span><span class="editable">May 20, 2030</span></div></div>'
/* 2 agenda */
+'<div class="slide"><h1 class="editable" style="position:absolute;left:6%;top:14%">Agenda</h1><div style="position:absolute;left:6%;right:8%;top:36%;display:grid;grid-template-columns:1fr 1fr;gap:1.2rem 4rem">'
+'<div style="display:flex;gap:1rem;border-top:1px solid var(--orange);padding-top:1rem"><b class="amp editable" style="font-size:1.3rem">01</b><div><b class="editable">Vision, Mission &amp; Goals</b></div></div>'
+'<div style="display:flex;gap:1rem;border-top:1px solid var(--orange);padding-top:1rem"><b class="amp editable" style="font-size:1.3rem">02</b><div><b class="editable">SWOT Analysis</b></div></div>'
+'<div style="display:flex;gap:1rem;border-top:1px solid var(--orange);padding-top:1rem"><b class="amp editable" style="font-size:1.3rem">03</b><div><b class="editable">Target Market</b></div></div>'
+'<div style="display:flex;gap:1rem;border-top:1px solid var(--orange);padding-top:1rem"><b class="amp editable" style="font-size:1.3rem">04</b><div><b class="editable">Pricing Model</b></div></div></div></div>'
/* 3 vision mission goals */
+'<div class="slide"><h1 class="editable" style="position:absolute;left:6%;top:16%">Vision<br>mission<br><span class="amp">&amp;</span><br>goals</h1><div class="vmg" style="position:absolute;right:6%;top:10%;width:54%"><div class="vmg-row"><h2 class="editable">Vision</h2><p class="editable">The vision statement expresses the company\'s future direction and ambition. It serves as a guide for its employees and the work they do.</p></div><div class="vmg-row"><h2 class="editable">Mission</h2><p class="editable">The mission statement is the company\'s main purpose. It articulates what the company is doing and the core values driving it.</p></div><div class="vmg-row"><h2 class="editable">Goals</h2><p class="editable">List down short-term and long-term goals that will help translate your vision and mission into action.</p></div></div>'+back()+'</div>'
/* 4 swot */
+'<div class="slide"><h1 class="editable" style="position:absolute;left:50%;transform:translateX(-50%);top:12%">SWOT analysis</h1><div class="tbl"><div class="thead c4"><div class="th editable" style="text-align:center">Strengths</div><div class="th editable" style="text-align:center">Weaknesses</div><div class="th editable" style="text-align:center">Opportunities</div><div class="th editable" style="text-align:center">Threats</div></div><div class="tbody c4"><div class="td"><ul><li class="editable">What is the company doing well?</li><li class="editable">What sets the company apart?</li><li class="editable">What are the company\'s strong qualities?</li></ul></div><div class="td"><ul><li class="editable">Where does the company need to improve?</li><li class="editable">Are resources adequate?</li><li class="editable">What do others do better?</li></ul></div><div class="td"><ul><li class="editable">Which external trends can the company capitalize on?</li><li class="editable">Are demands shifting?</li></ul></div><div class="td"><ul><li class="editable">What blockers is the company facing?</li><li class="editable">Which emerging competitors to watch?</li></ul></div></div></div><div class="orange-note editable" style="position:absolute;left:50%;transform:translateX(-50%);bottom:14%">Customize this table! Right-click on any cell to see available functions.</div>'+back()+'</div>'
/* 5 target market personas */
+'<div class="slide"><h1 class="editable" style="position:absolute;left:6%;top:14%">Target Market</h1><div style="position:absolute;left:6%;right:6%;top:38%;display:grid;grid-template-columns:repeat(3,1fr);gap:2rem">'
+'<div style="text-align:center"><div style="width:90px;height:90px;border-radius:50%;background:#efe6da;margin:0 auto 1rem"></div><h3 class="editable" style="font-weight:700">Persona A</h3><p class="editable">描述目标人群A的特征与需求。</p></div>'
+'<div style="text-align:center"><div style="width:90px;height:90px;border-radius:50%;background:#efe6da;margin:0 auto 1rem"></div><h3 class="editable" style="font-weight:700">Persona B</h3><p class="editable">描述目标人群B的特征与需求。</p></div>'
+'<div style="text-align:center"><div style="width:90px;height:90px;border-radius:50%;background:#efe6da;margin:0 auto 1rem"></div><h3 class="editable" style="font-weight:700">Persona C</h3><p class="editable">描述目标人群C的特征与需求。</p></div></div>'+back()+'</div>'
/* 6 pricing model table */
+'<div class="slide"><h1 class="editable" style="position:absolute;left:50%;transform:translateX(-50%);top:12%">Pricing model</h1><div class="tbl"><div class="thead c4"><div class="th editable" style="text-align:center">Product or service</div><div class="th editable" style="text-align:center">Pricing plan</div><div class="th editable" style="text-align:center">Type of purchase</div><div class="th editable" style="text-align:center">Channels</div></div><div class="tbody c4"><div class="td"><p class="editable">List the product/service that the company is marketing</p></div><div class="td"><p class="editable">Write the product/service\'s perceived financial value</p></div><div class="td"><p class="editable">Describe how the product is expected to be purchased</p></div><div class="td"><p class="editable">List the marketing channels where the product is shared</p></div></div></div><div class="orange-note editable" style="position:absolute;left:50%;transform:translateX(-50%);bottom:14%">Customize this table! Right-click on any cell to see available functions.</div>'+back()+'</div>'
/* 7 big number */
+'<div class="slide"><h2 class="editable" style="position:absolute;left:6%;top:16%">Market Opportunity</h2><div style="position:absolute;left:6%;top:40%"><div class="bignum editable">¥ 1.2B</div><p class="editable" style="margin-top:1rem;width:40%">可触达市场规模 (TAM)，描述市场机会与增长趋势。</p></div><div style="position:absolute;right:8%;top:40%;width:34%"><div class="bignum editable" style="font-size:clamp(2rem,4vw,3rem)">38%</div><p class="editable" style="margin-top:.6rem">年增长率 YoY Growth</p></div>'+back()+'</div>'
/* 8 marketing channels */
+'<div class="slide"><h1 class="editable" style="position:absolute;left:6%;top:14%">Channels</h1><div style="position:absolute;left:6%;right:6%;top:40%;display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem">'
+'<div style="border-top:3px solid var(--orange);padding-top:1rem"><h3 class="editable" style="font-weight:700">Social</h3><p class="editable">社媒投放与内容运营</p></div>'
+'<div style="border-top:3px solid var(--orange);padding-top:1rem"><h3 class="editable" style="font-weight:700">Email</h3><p class="editable">邮件营销与培育</p></div>'
+'<div style="border-top:3px solid var(--orange);padding-top:1rem"><h3 class="editable" style="font-weight:700">SEO/SEM</h3><p class="editable">搜索引擎获客</p></div>'
+'<div style="border-top:3px solid var(--orange);padding-top:1rem"><h3 class="editable" style="font-weight:700">Offline</h3><p class="editable">线下活动与门店</p></div></div>'+back()+'</div>'
/* 9 timeline */
+'<div class="slide"><h1 class="editable" style="position:absolute;left:6%;top:14%">Roadmap</h1><div style="position:absolute;left:6%;right:6%;top:44%"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem">'
+'<div><b class="amp editable" style="font-size:1.2rem">Q1</b><p class="editable" style="margin-top:.5rem">品牌定位与内容启动</p></div>'
+'<div><b class="amp editable" style="font-size:1.2rem">Q2</b><p class="editable" style="margin-top:.5rem">渠道扩张与投放</p></div>'
+'<div><b class="amp editable" style="font-size:1.2rem">Q3</b><p class="editable" style="margin-top:.5rem">转化优化与复购</p></div>'
+'<div><b class="amp editable" style="font-size:1.2rem">Q4</b><p class="editable" style="margin-top:.5rem">复盘与年度规划</p></div></div><div style="height:2px;background:var(--orange);margin-top:1.5rem"></div></div>'+back()+'</div>'
/* 10 quote */
+'<div class="slide" style="display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 12%"><h2 class="editable" style="text-align:center;line-height:1.4;font-size:clamp(1.6rem,3vw,2.4rem)">"Marketing is no longer about the stuff you make, but about the stories you tell."</h2><p class="editable" style="margin-top:1.5rem;color:var(--orange);font-weight:700">— Seth Godin</p></div>'
/* 11 thank you */
+'<div class="slide" style="display:flex;flex-direction:column;justify-content:center;padding:0 8%"><div class="brand" style="margin-bottom:2rem"><span class="flower">&#10052;</span><span class="t editable">MODERN LIFESTYLE STORE</span></div><h1 class="editable">Thank You</h1><p class="editable" style="margin-top:1rem;font-size:1.1rem">感谢观看 · 期待合作</p></div>';
return shell({title:'Marketing Strategy',vars:vars,css:css,slides:s});
}});

/* 暴露到全局 */
global.SSC_PPT_TEMPLATES = T;
})(window);
