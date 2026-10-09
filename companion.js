(()=>{
 let owner=null,state=null,chat=[],open=false,busy=false,loading=false;
 const root=document.createElement('div');root.id='campusBuddy';document.body.appendChild(root);
 const style=document.createElement('style');style.textContent=`
 #campusBuddy{position:fixed;right:22px;bottom:22px;z-index:50;font-family:Segoe UI,Arial,sans-serif}.buddy-pet{border:0;cursor:pointer;background:transparent;display:flex;flex-direction:column;align-items:center;gap:5px;color:#312e81;font-weight:700}.buddy-body{position:relative;width:74px;height:70px;background:linear-gradient(140deg,#a78bfa,#4f46e5);border-radius:38% 38% 45% 45%;box-shadow:0 10px 25px #4f46e550;border:3px solid #ddd6fe;animation:buddyFloat 3s ease-in-out infinite}.buddy-body:before,.buddy-body:after{content:'';position:absolute;top:-10px;width:21px;height:24px;background:#8b5cf6;border-radius:6px 18px 0 0}.buddy-body:before{left:2px;transform:rotate(-20deg)}.buddy-body:after{right:2px;transform:rotate(20deg)}.buddy-face{position:absolute;inset:18px 8px 10px;background:#ede9fe;border-radius:22px;display:flex;justify-content:center;align-items:center;gap:15px}.buddy-eye{height:12px;width:8px;background:#312e81;border-radius:50%;animation:buddyBlink 5s infinite}.buddy-label{background:white;border-radius:15px;padding:6px 12px;box-shadow:0 2px 12px #17203318}.buddy-panel{width:min(420px,calc(100vw - 28px));height:min(640px,calc(100dvh - 130px));background:white;box-shadow:0 15px 60px #17203340;border:1px solid #ddd6fe;border-radius:22px;margin-bottom:12px;display:flex;flex-direction:column;overflow:hidden}.buddy-header{background:#4f46e5;color:white;padding:16px;display:flex;align-items:center;justify-content:space-between}.buddy-header h3{margin:0}.buddy-close{border:0;background:transparent;color:white;font-size:26px;cursor:pointer}.buddy-content{padding:16px;overflow:auto;flex:1}.buddy-note{font-size:12px;color:#697386;line-height:1.5}.buddy-gap,.buddy-message{padding:12px;background:#f5f3ff;border-radius:12px;margin:10px 0;line-height:1.5;overflow-wrap:anywhere}.buddy-message.user{background:#eef2ff}.buddy-message p{white-space:pre-wrap;margin:5px 0}.buddy-message a{color:#4338ca;text-decoration:underline}.buddy-form{padding:12px;border-top:1px solid #e9edf4;display:flex;gap:8px}.buddy-form textarea{min-width:0;flex:1;resize:none;border:1px solid #ddd6fe;border-radius:10px;padding:10px;font:inherit}.buddy-form button{background:#4f46e5;color:white;border:0;border-radius:10px;padding:10px;cursor:pointer}.buddy-form button:disabled{opacity:.5}.buddy-error{color:#b91c1c}.buddy-tabs{display:flex;gap:8px;margin-bottom:12px}.buddy-tabs button{border:0;background:#ede9fe;padding:8px;border-radius:8px;cursor:pointer}@keyframes buddyFloat{50%{transform:translateY(-9px) rotate(3deg)}}@keyframes buddyBlink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}@media(prefers-reduced-motion:reduce){.buddy-body,.buddy-eye{animation:none}}@media(max-width:600px){#campusBuddy{right:12px;bottom:12px}}`;
 document.head.appendChild(style);
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function eligible(){return typeof currentUser!=='undefined'&&currentUser&&role==='student'&&page==='dashboard';}
 function draw(){
  root.hidden=!eligible();if(root.hidden)return;
  root.innerHTML=(open?`<section class="buddy-panel" role="dialog" aria-label="Campus Buddy study assistant"><header class="buddy-header"><div><h3>Campus Buddy</h3><small>Your progress & study companion</small></div><button class="buddy-close" aria-label="Close assistant">×</button></header><div class="buddy-content" id="buddyContent"><div class="buddy-tabs"><button id="buddyProgress">My progress</button><button id="buddyExplain">Explain a concept</button></div><div id="buddyOverview"></div><div id="buddyChat" aria-live="polite"></div></div><form class="buddy-form"><label class="hidden" for="buddyQuestion">Ask a study question</label><textarea id="buddyQuestion" placeholder="Explain recursion with an example..." maxlength="2000" rows="2" required></textarea><button type="submit" ${busy?'disabled':''}>${busy?'Thinking...':'Ask'}</button></form></section>`:'')+`<button class="buddy-pet" aria-label="${open?'Close':'Open'} Campus Buddy" aria-expanded="${open}"><span class="buddy-body" aria-hidden="true"><span class="buddy-face"><i class="buddy-eye"></i><i class="buddy-eye"></i></span></span><span class="buddy-label">${state?.gaps?.length?state.gaps.length+' areas to work on':'Campus Buddy'}</span></button>`;
  root.querySelector('.buddy-pet').onclick=()=>{open=!open;draw();if(open)refresh();};
  if(!open)return;
  root.querySelector('.buddy-close').onclick=close;
  root.querySelector('#buddyProgress').onclick=()=>{showOverview();};
  root.querySelector('#buddyExplain').onclick=()=>root.querySelector('#buddyQuestion').focus();
  root.querySelector('form').onsubmit=ask;showOverview();showChat();
 }
 function close(){open=false;draw();root.querySelector('.buddy-pet')?.focus();}
 function showOverview(){
  const panel=root.querySelector('#buddyOverview');if(!panel)return;
  if(!state){panel.innerHTML='<p>Loading your approved progress...</p>';return;}
  const history=state.history||[],previous=history[1]?.approved_values;const old=typeof previous==='string'?JSON.parse(previous):previous;
  const delta=old&&state.performance?Object.keys(old).reduce((sum,key)=>sum+Number(state.performance[key]||0)-Number(old[key]||0),0)/8:null;
  panel.innerHTML=`<p class="buddy-note">Tracks faculty-approved scores while your dashboard is open. Low scores suggest areas to investigate; a short quiz can identify specific concept gaps.</p>${state.performance?`<p><b>Approved progress: ${state.performance.success_score}%</b>${delta==null?'':` · ${delta>=0?'+':''}${delta.toFixed(1)} points since the previous review`}</p>`:'<p>Your performance is awaiting faculty verification. Submit your values and evidence to begin progress tracking.</p>'}${state.gaps.length?state.gaps.map(gap=>`<div class="buddy-gap"><b>${esc(gap.area)} · ${gap.score}%</b><p>${esc(gap.task)}</p></div>`).join(''):state.performance?'<p>Your recorded areas are at or above 60%. Keep practising and reviewing weekly.</p>':''}${state.tasks.length?`<h4>Your faculty tasks</h4>${state.tasks.map(task=>`<div class="buddy-gap"><b>${esc(task.title)}</b><p style="white-space:pre-line">${esc(task.description)}</p></div>`).join('')}`:''}<p class="buddy-note">${state.tutorAvailable?'Ask a topic question for an explanation, practice and web sources. Your question and anonymous approved scores are sent to the AI tutor.':'AI concept explanations and web research are awaiting server setup. Progress guidance is available now.'}</p>`;
 }
 function safeUrl(url){try{const parsed=new URL(url);return ['https:','http:'].includes(parsed.protocol)?parsed.href:null;}catch{return null;}}
 function showChat(){
  const target=root.querySelector('#buddyChat');if(!target)return;
  target.innerHTML=chat.map(message=>`<div class="buddy-message ${message.role==='user'?'user':''}"><b>${message.role==='user'?'You':'Buddy'}</b><p>${esc(message.content)}</p>${(message.sources||[]).map(source=>{const url=safeUrl(source.url);return url?`<a target="_blank" rel="noopener noreferrer" href="${esc(url)}">${esc(source.title||'Source')}</a><br>`:'';}).join('')}</div>`).join('');
 }
 async function request(path,options={}){
  const response=await fetch((location.port==='5500'?'http://localhost:5000':location.origin)+'/api/companion'+path,{...options,headers:{Authorization:'Bearer '+authToken,'Content-Type':'application/json'}});
  const data=await response.json();if(!response.ok)throw new Error(data.message||'Assistant unavailable');return data;
 }
 async function refresh(){
  if(!eligible()||loading)return;loading=true;const token=authToken;
  try{const next=await request('/progress');if(token!==authToken)return;const changed=state&&JSON.stringify(next.performance)!==JSON.stringify(state.performance);state=next;if(changed)toast('Buddy noticed an update to your approved progress.');if(open)showOverview();else draw();}
  catch(error){const target=root.querySelector('#buddyOverview');if(target)target.innerHTML=`<p class="buddy-error">${esc(error.message)}</p>`;}finally{loading=false;}
 }
 async function ask(event){
  event.preventDefault();if(busy)return;const question=root.querySelector('#buddyQuestion').value.trim();if(!question)return;
  const token=authToken,history=chat.slice(-6).map(({role,content})=>({role,content}));chat.push({role:'user',content:question});busy=true;draw();
  try{const data=await request('/ask',{method:'POST',body:JSON.stringify({question,history})});if(token!==authToken)return;chat.push({role:'assistant',content:data.answer,sources:data.sources});}
  catch(error){if(token===authToken)chat.push({role:'assistant',content:error.message});}finally{busy=false;draw();root.querySelector('#buddyQuestion')?.focus();}
 }
 window.syncCampusBuddy=()=>{if(owner!==authToken){owner=authToken;state=null;chat=[];open=false;}draw();if(eligible())refresh();};
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&open)close();});
 setInterval(()=>{if(!document.hidden&&eligible())refresh();},30000);
 window.syncCampusBuddy();
})();