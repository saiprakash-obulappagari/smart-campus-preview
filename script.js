const students=[
{id:"SC101",name:"Rahul Kumar",dept:"CSE",year:"3rd Year",cgpa:8.2,attendance:58,lms:54,engagement:72,coding:42,aptitude:68,interview:48,skills:65,feedback:70,risk:78,success:52,segment:"High Academic + Low Placement"},
{id:"SC102",name:"Priya Sharma",dept:"ECE",year:"4th Year",cgpa:9.1,attendance:91,lms:88,engagement:84,coding:86,aptitude:90,interview:82,skills:89,feedback:91,risk:18,success:91,segment:"High Potential"},
{id:"SC103",name:"Arjun Reddy",dept:"CSE",year:"3rd Year",cgpa:7.4,attendance:69,lms:61,engagement:45,coding:57,aptitude:52,interview:49,skills:55,feedback:62,risk:67,success:61,segment:"Low Engagement"},
{id:"SC104",name:"Sneha Rao",dept:"IT",year:"2nd Year",cgpa:8.7,attendance:76,lms:79,engagement:92,coding:74,aptitude:78,interview:70,skills:82,feedback:86,risk:31,success:83,segment:"High Potential"},
{id:"SC105",name:"Vikram Singh",dept:"EEE",year:"4th Year",cgpa:6.8,attendance:61,lms:48,engagement:38,coding:35,aptitude:44,interview:41,skills:49,feedback:55,risk:86,success:44,segment:"High Risk"}
];
let currentUser=null,role="student",page="dashboard",authToken=null;

function toast(msg){let d=document.createElement("div");d.className="toast";d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),2500)}
function render(){document.getElementById("app").innerHTML=page==="login"?loginPage():shell(); if(page==="dashboard") drawCharts(); if(currentUser && (page==="dashboard"||page==="interventions")) loadProgressPanel(); if(currentUser&&page==="dashboard"&&["faculty","admin"].includes(role))loadReviewPanel();if(page==="students"){}if(window.syncCampusBuddy)window.syncCampusBuddy();if(currentUser&&page==="student-details")loadAgentAssessment();if(currentUser&&page==="dashboard"&&["faculty","admin"].includes(role))loadAgentSegments();}
function loginPage(){if(window.adminLoginPage)return `<div class="auth"><section class="hero"><span class="pill">Smart Campus Administration</span><h1>Principal Portal</h1><p>Verify faculty access, review submissions, and oversee student progress.</p></section><section class="auth-card"><h2>Administrator Login</h2><p class="label">Sign in with your approved Principal account.</p><form onsubmit="event.preventDefault();doLogin()"><div class="form-group"><label for="email">Admin email / login ID</label><input id="email" autocomplete="username" required></div><div class="form-group"><label for="password">Password</label><input id="password" type="password" autocomplete="current-password" required></div><button class="btn primary full" type="submit">Sign in as Admin</button></form><p style="text-align:center"><a href="../index.html">Student and faculty login</a></p></section></div>`;
return `<div class="auth"><div class="hero"><span class="pill">✦ STUDENT SUCCESS, CONNECTED</span><div class="hero-eyebrow">YOUR NEXT-GENERATION CAMPUS</div><h1>Smart <span>Campus.</span></h1><h2 class="hero-headline">Predict. Optimize.<br>Improve student success.</h2><p>Turn campus data into clear insights, early support, and a personal path forward.</p><div class="hero-actions"><button class="btn primary" onclick="document.querySelector('.auth-card').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});document.getElementById('email').focus()">Explore Dashboard <span aria-hidden="true">↗</span></button><button class="btn hero-secondary" onclick="document.getElementById('visualInsights').hidden=!document.getElementById('visualInsights').hidden" aria-controls="visualInsights">Discover AI Insights</button></div><p id="visualInsights" hidden class="hero-insight">Understand approved performance, explore explainable risk factors, and plan your next steps with faculty support.</p><div class="campus-scene" aria-hidden="true"><div class="scene-orbit orbit-one"></div><div class="scene-orbit orbit-two"></div><div class="scene-caption"><span class="signal-dot"></span> CONNECTED CAMPUS</div><svg class="campus-model" viewBox="0 0 640 310" fill="none"><defs><linearGradient id="campusFace" x1="160" y1="70" x2="480" y2="300" gradientUnits="userSpaceOnUse"><stop stop-color="#25355f"/><stop offset="1" stop-color="#0c1730"/></linearGradient><linearGradient id="campusRoof"><stop stop-color="#4b63a8"/><stop offset="1" stop-color="#1c3158"/></linearGradient></defs><path d="M70 220 320 80 570 220 320 350Z" fill="#10233a" fill-opacity=".55" stroke="#36dbea" stroke-opacity=".35"/><path d="m110 220 210-120 210 120-210 120Z" stroke="#39d9ee" stroke-opacity=".15"/><path d="M218 128 320 69 422 128 320 187Z" fill="url(#campusRoof)" stroke="#85a3ff"/><path d="M218 128v109l102 59V187Z" fill="url(#campusFace)" stroke="#5775ac"/><path d="M320 187v109l102-59V128Z" fill="#111e36" stroke="#5775ac"/><path d="m132 180 64-37 64 37-64 37Z" fill="url(#campusRoof)" stroke="#6883bf"/><path d="M132 180v59l64 37v-59Z" fill="url(#campusFace)" stroke="#486a97"/><path d="M196 217v59l64-37v-59Z" fill="#10243c" stroke="#486a97"/><path d="m380 185 65-38 65 38-65 38Z" fill="url(#campusRoof)" stroke="#6883bf"/><path d="M380 185v59l65 38v-59Z" fill="url(#campusFace)" stroke="#486a97"/><path d="M445 223v59l65-38v-59Z" fill="#10243c" stroke="#486a97"/><path d="m242 157 54 31m-54-11 54 31m-54-11 54 31m54-30 49-28m-49 48 49-28m-49 48 49-28m-251-14 34 20m-34 0 34 20m249-30 33 19m15-12 33-19" stroke="#56e4f3" stroke-width="4" stroke-linecap="round"/><path d="M320 69V37m-10 5 10-5 10 5" stroke="#7ce5ff" stroke-width="2"/><circle cx="320" cy="29" r="4" fill="#86efff"/><path class="scene-stream" d="m64 207 73-42m369-7 64 37M313 299v23" stroke="#a28cff" stroke-width="2" stroke-dasharray="6 9"/></svg><span class="scene-tag tag-one">◈ Academic insights</span><span class="scene-tag tag-two">↗ Personal progress</span><div class="scene-mascot"><div class="mascot-antenna"></div><div class="mascot-face"><i></i><i></i><span></span></div></div><div class="scene-footer">TURNING CAMPUS DATA INTO STUDENT SUCCESS</div></div></div><div class="auth-card"><div class="auth-kicker"><span class="signal-dot"></span> YOUR CAMPUS WORKSPACE</div><h2 id="authTitle">Welcome back.</h2><p class="auth-intro">Your next step starts here.</p><div class="tabs"><button class="${role==='student'?"active":""}" onclick="switchRole('student',this)">Student</button><button class="${role==='faculty'?"active":""}" onclick="switchRole('faculty',this)">Faculty</button></div><div id="loginForm">${loginForm()}</div></div></div>`}
function loginForm(){
return `<div class="form-group"><label>Email / ID</label><input id="email" placeholder="${role==='student'?'student@campus.edu':'faculty@campus.edu'}"></div><div class="form-group"><label>Password</label><input type="password" id="password" placeholder="••••••••"></div><button class="btn primary full" onclick="doLogin()">Login</button><p style="text-align:center;color:#697386">New here? <a href="#" onclick="showRegister();return false">Create account</a></p><p style="text-align:center"><a href="faculty-signup.html">Create a faculty account</a></p><p style="text-align:center;font-size:12px;color:#98a1b2">Use your registered email and password</p>`}
function switchRole(r,el){role=r;document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("active"));el.classList.add("active");document.getElementById("loginForm").innerHTML=loginForm()}
function showRegister(){document.getElementById("authTitle").textContent=role==="student"?"Student Registration":"Faculty Registration";document.getElementById("loginForm").innerHTML=`<div class="form-group"><label>Full Name</label><input id="regname" placeholder="Your name"></div><div class="form-group"><label>${role==="student"?"Student ID":"Faculty ID"}</label><input id="regid"></div><div class="form-group"><label>College Email</label><input id="regemail" type="email"></div><div class="form-group"><label>Department</label><select id="dept"><option>CSE</option><option>ECE</option><option>IT</option><option>EEE</option><option>MECH</option></select></div><div class="form-group"><label>Password</label><input id="regpass" type="password"></div><button class="btn primary full" onclick="register()">Create Account</button><p style="text-align:center"><a href="#" onclick="render();return false">Back to login</a></p>`}
const API_BASE = location.port === "5500" ? "http://localhost:5000" : location.origin; const AUTH_API = API_BASE+"/api/auth";
let authPending = false;
async function register(){
 if(authPending)return;
 const name=document.getElementById("regname").value.trim(), email=document.getElementById("regemail").value.trim(), password=document.getElementById("regpass").value, campusId=document.getElementById("regid").value.trim(), department=document.getElementById("dept").value;
 if(!name||!email||!password||!campusId){toast("Please complete all registration fields.");return;}
 authPending=true;
 try{
  const response=await fetch(AUTH_API+"/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,password,role:role.toUpperCase(),studentId:campusId,facultyId:campusId,department})});
  const data=await response.json();
  if(!response.ok||!data.success){toast(data.message||"Registration failed.");return;}
  render();toast(data.message||"Account created successfully. Please log in.");
 }catch(error){toast("Cannot connect to the server. Please try again.");}finally{authPending=false;}
}
async function doLogin(){
 if(authPending)return;
 const email=document.getElementById("email").value.trim(),password=document.getElementById("password").value;
 if(!email||!password){toast("Email and password are required.");return;}
 authPending=true;
 try{
  const response=await fetch(AUTH_API+(window.adminLoginPage?"/admin/login":"/login"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
  const data=await response.json();
  if(!response.ok||!data.success){toast(data.message||"Login failed.");return;}
  authToken=data.token;currentUser=data.user;role=currentUser.role.toLowerCase();page="dashboard";if(["faculty","admin"].includes(role))await refreshFacultyRoster(false);else await loadMyPerformance();render();
 }catch(error){toast("Cannot connect to the server. Please try again.");}finally{authPending=false;}
}
function shell(){
let nav=["faculty","admin"].includes(role)?["dashboard","students","interventions","analytics"]:["dashboard","profile","analytics","interventions"];
return `<div class="app"><aside class="sidebar"><div class="brand"><i class="brand-mark" aria-hidden="true">◈</i> Smart <span>Campus</span><small>STUDENT SUCCESS PLATFORM</small></div><div class="nav">${nav.map((n,i)=>`<button class="${page===n?'active':''}" onclick="go('${n}')">${icon(n)} ${title(n)}</button>`).join("")}<button onclick="logout()">↪ Logout</button></div></aside><main class="main"><div class="topbar"><div><h2>${title(page)}</h2><span class="label">AI-powered student success intelligence</span></div><div class="user-chip">👤 ${currentUser.name} · ${role}</div></div>${content()}</main></div>`}
function icon(n){return ({dashboard:"▦",profile:"◎",students:"♟",analytics:"◈",interventions:"✓"}[n]||"•")}
function title(n){return n==="student-details"?"Student Details":n.charAt(0).toUpperCase()+n.slice(1)}
function go(n){page=n;render()}
function logout(){authToken=null;currentUser=null;role="student";page="login";render()}
function content(){
if(page==="dashboard")return ["faculty","admin"].includes(role)?liveFacultyDashboard():studentPerformanceDashboard();
if(page==="student-details")return studentDetailsPage();if(page==="profile")return studentPerformanceDashboard();
if(page==="students")return studentsPage();
if(page==="analytics")return analytics();
if(page==="interventions")return interventions();
}
function dashboard(){
let s=["faculty","admin"].includes(role)?null:students[0];
if(["faculty","admin"].includes(role))return `<div class="card"><h3>Student Improvement Assistant</h3><p>Review personalized tasks for students with success or attendance below 60%. Suggestions are sent only when you choose.</p><button class="btn primary" onclick="loadSuggestions()">Suggest improvement tasks</button><div id="suggestionPanel" aria-live="polite"></div></div><div class="grid cards"><div class="card"><div class="label">Total Students</div><div class="value">1,248</div></div><div class="card"><div class="label">High Risk</div><div class="value danger">86</div></div><div class="card"><div class="label">Avg Success Score</div><div class="value good">76</div></div><div class="card"><div class="label">Intervention Success</div><div class="value blue">72%</div></div></div><h3 class="section-title">Campus Intelligence</h3><div class="grid dashboard-grid"><div class="card chart-card"><canvas id="trend"></canvas></div><div class="card"><h3>🚨 Priority Alerts</h3>${students.filter(x=>x.risk>65).map(x=>`<div class="action"><span>${x.name}<br><small>${x.segment}</small></span><span class="badge high">${x.risk}%</span></div>`).join("")}</div></div>`;
return `<div class="card"><h3>Tasks from your faculty</h3><div id="assignedTasks" aria-live="polite">Loading your tasks...</div></div><div class="grid cards"><div class="card"><div class="label">Success Score</div><div class="score good">${s.success}</div><div class="progress"><div style="width:${s.success}%"></div></div></div><div class="card"><div class="label">AI Risk Score</div><div class="score danger">${s.risk}</div><span class="badge high">High Risk</span></div><div class="card"><div class="label">Attendance</div><div class="value warn">${s.attendance}%</div></div><div class="card"><div class="label">Placement Readiness</div><div class="value blue">${Math.round((s.coding+s.aptitude+s.interview)/3)}</div></div></div><h3 class="section-title">AI Insight</h3><div class="grid dashboard-grid"><div class="card"><h3>Why are you at risk?</h3><div class="insight">Your current risk is mainly driven by low attendance, coding performance and mock interview readiness. Improving these areas can significantly increase your success score.</div><div class="factor"><span>Attendance</span><span class="danger">58% · High Impact</span></div><div class="factor"><span>Coding Score</span><span class="danger">42% · High Impact</span></div><div class="factor"><span>Assignment Completion</span><span class="warn">54% · Medium Impact</span></div></div><div class="card chart-card"><canvas id="trend"></canvas></div></div>`}
function profile(){let s=students[0];return `<div class="grid two"><div class="card"><h3>Student Profile</h3><p><b>${s.name}</b></p><p>${s.id} · ${s.dept} · ${s.year}</p><p>College Email: student@campus.edu</p><hr><p>Segment: <span class="badge medium">${s.segment}</span></p></div><div class="card"><h3>Success Overview</h3><div class="score good">${s.success}/100</div><div class="progress"><div style="width:${s.success}%"></div></div><p>AI Risk: <b class="danger">${s.risk}/100</b></p></div></div><h3 class="section-title">Unified Student Data</h3><div class="grid three">${[['Academic',s.cgpa+'/10'],['Attendance',s.attendance+'%'],['LMS Activity',s.lms+'%'],['Engagement',s.engagement+'%'],['Coding',s.coding+'%'],['Aptitude',s.aptitude+'%'],['Mock Interview',s.interview+'%'],['Skills',s.skills+'%'],['Feedback',s.feedback+'%']].map(x=>`<div class="card"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join("")}</div>`}
function studentsPage(){return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Student Risk Monitor</h3><input id="search" placeholder="Search student..." oninput="filterStudents()" style="padding:10px;border:1px solid #ddd;border-radius:9px"></div><div class="table-wrap"><table class="table" id="studentTable"><tr><th>Student</th><th>Department</th><th>Success</th><th>Risk</th><th>Segment</th><th>Action</th></tr>${facultyRoster.map(s=>`<tr><td><b>${escapeHtml(s.name)}</b><br><small>${escapeHtml(s.id)}</small></td><td>${escapeHtml(s.dept)}</td><td>${s.success??"Not recorded"}</td><td><span class="badge ${s.risk>70?'high':s.risk>40?'medium':'low'}">${s.risk==null?"Not recorded":s.risk+"%"}</span></td><td>${escapeHtml(s.segment)}</td><td><button class="btn secondary" onclick="viewStudent('${s.id}')">View Details</button></td></tr>`).join("")}</table></div></div>`}
function filterStudents(){let q=document.getElementById("search").value.toLowerCase();document.querySelectorAll("#studentTable tr:not(:first-child)").forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q)?"":"none")}
let selectedStudentId=null;
function viewStudent(id){id=decodeURIComponent(id);
 if(!facultyRoster.some(student=>student.id===id))return;
 selectedStudentId=id;page="student-details";
 history.pushState({studentId:id},"","#student/"+encodeURIComponent(id));render();window.scrollTo(0,0);
}
function backToStudents(){history.pushState({},"","#students");page="students";render();}
window.addEventListener("popstate",()=>{
 if(!currentUser)return;
 const match=location.hash.match(/^#student\/(.+)$/);
 if(match&&["faculty","admin"].includes(role)){
  selectedStudentId=decodeURIComponent(match[1]);page="student-details";
 }else{page=location.hash==="#students"?"students":"dashboard";}
 render();
});
function studentDetailsPage(){
 const student=facultyRoster.find(item=>item.id===selectedStudentId);
 if(!student)return `<div class="card"><p>Student not found.</p><button class="btn secondary" onclick="backToStudents()">Back to students</button></div>`;
 const metrics=[["Attendance",student.attendance],["LMS Activity",student.lms],["Engagement",student.engagement],["Coding",student.coding],["Aptitude",student.aptitude],["Mock Interview",student.interview],["Skills",student.skills],["Feedback",student.feedback]];
 const areas=metrics.filter(item=>item[1]!=null&&item[1]<60);
 return `<button class="btn secondary" onclick="backToStudents()">← Back to students</button>
 <p class="label">Students / ${escapeHtml(student.name)}</p>
 <div class="grid two"><section class="card"><h3>${escapeHtml(student.name)}</h3><p>${escapeHtml(student.id)} · ${escapeHtml(student.dept)} · ${escapeHtml(student.year)}</p><p>CGPA: <b>${student.cgpa}/10</b></p><p>Segment: ${escapeHtml(student.segment)}</p></section>
 <section class="card"><h3>Progress overview</h3><div class="factor"><span>Success score</span><span class="good">${student.success==null?"Not recorded":student.success+"/100"}</span></div><div class="progress"><div style="width:${student.success}%"></div></div><div class="factor"><span>Risk score</span><span class="${student.risk>70?'danger':student.risk>40?'warn':'good'}">${student.risk==null?"Not recorded":student.risk+"/100"}</span></div></section></div>
 <h3 class="section-title">Performance details</h3><div class="card table-wrap"><table class="table"><thead><tr><th>Area</th><th>Progress</th><th>Status</th></tr></thead><tbody>${metrics.map(([label,value])=>`<tr><td>${label}</td><td><b>${value==null?"Not recorded":value+"%"}</b><div class="progress" style="max-width:240px;margin-top:8px"><div style="width:${value}%"></div></div></td><td><span class="badge ${value==null?'medium':value<60?'high':'low'}">${value==null?'Not recorded':value<60?'Needs improvement':'On track'}</span></td></tr>`).join("")}</tbody></table></div>
 <h3 class="section-title">Verified agent assessment</h3><div class="card" id="agentAssessment">Loading academic and placement indicators...</div><h3 class="section-title">Student Improvement Assistant</h3><section class="card"><p>Analyze this student's performance and create a focused seven-day plan.</p><p class="label">Recommendations use the displayed campus scores and improvement rules.</p><button class="btn primary" onclick="analyzeStudentProgress()">Analyze performance</button><div id="studentAgentPlan" aria-live="polite"></div></section><h3 class="section-title">Improvement focus</h3><section class="card">${areas.length?`<p>Prioritize the areas currently below 60%:</p><ul>${areas.map(([label,value])=>`<li>${label}: ${value}%</li>`).join("")}</ul>`:'<p>All listed areas are at or above 60%. Continue regular practice and mentor check-ins.</p>'}<p>Review and send personalized tasks from the faculty dashboard.</p><button class="btn primary" onclick="go('dashboard')">Open faculty dashboard</button></section>`;
}
function analytics(){return `<div class="grid cards"><div class="card"><div class="label">Academic Average</div><div class="value">8.1</div></div><div class="card"><div class="label">Avg Attendance</div><div class="value">76%</div></div><div class="card"><div class="label">Placement Readiness</div><div class="value blue">71%</div></div><div class="card"><div class="label">At-Risk Rate</div><div class="value danger">12%</div></div></div><h3 class="section-title">Performance Analytics</h3><div class="grid two"><div class="card chart-card"><canvas id="trend"></canvas></div><div class="card"><h3>Student Segments</h3>${[['High Potential',32],['High Academic + Low Placement',21],['Low Engagement',18],['High Risk',12],['Balanced',17]].map(x=>`<div class="factor"><span>${x[0]}</span><span>${x[1]}%</span></div><div class="progress"><div style="width:${x[1]}%"></div></div>`).join("")}</div></div>`}
function interventions(){return `<div class="card"><h3>Faculty improvement tasks</h3><div id="assignedTasks" aria-live="polite">Loading tasks...</div></div>`}
function drawCharts(){let c=document.getElementById("trend");if(!c||typeof Chart==="undefined")return;new Chart(c,{type:"line",data:{labels:["Jan","Feb","Mar","Apr","May","Jun"],datasets:[{label:"Success Score",data:[58,61,64,68,72,76],tension:.35},{label:"Risk Score",data:[74,71,67,61,54,48],tension:.35}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}}}})}
page="login";if(new URLSearchParams(location.search).get("role")==="faculty")role="faculty";render();
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function progressRequest(path,options={}){
 const response=await fetch(API_BASE+"/api/interventions"+path,{...options,headers:{"Content-Type":"application/json",Authorization:"Bearer "+authToken}});
 const data=await response.json();if(!response.ok)throw new Error(data.message||"Request failed");return data;
}
async function loadProgressPanel(){
 const target=document.getElementById("assignedTasks");if(!target)return;
 try{const data=await progressRequest("");if(!target.isConnected)return;
 target.innerHTML=data.data.length?data.data.map(task=>`<div class="insight"><h4>${escapeHtml(task.title)}</h4>${["faculty","admin"].includes(role)?`<p>Student: ${escapeHtml(task.student_name)}</p>`:""}<p style="white-space:pre-line">${escapeHtml(task.description)}</p><span class="badge medium">${escapeHtml(task.status)}</span>${["faculty","admin"].includes(role)&&task.status!=="COMPLETED"?`<details><summary>Record follow-up outcome</summary><p><label>Status <select id="outcomeStatus-${task.id}"><option>IN_PROGRESS</option><option>COMPLETED</option></select></label></p><p><label>Supporting evidence <textarea id="outcomeEvidence-${task.id}" maxlength="4000"></textarea></label></p><p><label>Outcome notes <textarea id="outcomeNotes-${task.id}" maxlength="4000"></textarea></label></p><button class="btn primary" onclick="recordAgentOutcome(${task.id},this)">Save evidence and outcome</button></details>`:""}</div>`).join(""):"No improvement tasks have been sent yet.";
 }catch(error){if(target.isConnected)target.textContent=error.message;}
}
async function loadSuggestions(){
 const panel=document.getElementById("suggestionPanel");if(!panel)return;panel.textContent="Reviewing student progress...";
 try{const data=await progressRequest("/suggestions");if(!panel.isConnected)return;
 panel.innerHTML=data.data.length?data.data.map(plan=>`<div class="insight" id="plan-${plan.id}"><h4>${escapeHtml(plan.name)} · ${escapeHtml(plan.student_id)}</h4><p>Success: ${plan.successScore}% · Attendance: ${plan.attendance==null?"Not recorded":plan.attendance+"%"}</p><p style="white-space:pre-line">${escapeHtml(plan.description)}</p><button class="btn primary" ${plan.sent?"disabled":""} onclick="sendImprovement(${plan.id},this)">${plan.sent?"Already sent":"Send suggestion to student"}</button> <button class="btn secondary" onclick="document.getElementById('plan-${plan.id}').remove()">Not now</button></div>`).join(""):"No students with recorded progress below 60% need a suggestion.";
 }catch(error){if(panel.isConnected)panel.textContent=error.message;}
}
async function sendImprovement(studentId,button){
 button.disabled=true;
 try{await progressRequest("/suggestions/"+studentId+"/send",{method:"POST",body:"{}"});button.textContent="Sent to student";toast("Improvement tasks sent to the student's dashboard.");}
 catch(error){button.disabled=false;toast(error.message);}
}
let studentImprovementPlan=null;
function analyzeStudentProgress(){
 const student=facultyRoster.find(item=>item.id===selectedStudentId);
 const panel=document.getElementById("studentAgentPlan");if(!student||!panel)return;
 const rules=[
  {area:"Coding",score:student.coding,task:"Practice coding for 30 minutes on four days this week. Solve three beginner problems and submit working solutions.",goal:"Complete three problems and review errors with your mentor."},
  {area:"Mock interview",score:student.interview,task:"Prepare answers to five common interview questions. Complete two 20-minute mock interviews and act on feedback.",goal:"Submit a feedback checklist and repeat the weakest answer."},
  {area:"LMS activity",score:student.lms,task:"Review pending LMS assignments today. Complete two pending activities and study course material for 20 minutes daily.",goal:"Submit two activities and maintain a five-day learning log."},
  {area:"Attendance",score:student.attendance,task:"Attend every scheduled class this week. Ask your mentor about missed lessons and keep a daily attendance checklist.",goal:"Attend all scheduled classes this week; review the overall percentage after seven days."},
  {area:"Aptitude",score:student.aptitude,task:"Complete 15 aptitude questions on three days this week and review each incorrect answer.",goal:"Complete 45 questions and discuss your error log."},
  {area:"Skills",score:student.skills,task:"Choose one weak skill with your mentor. Complete a short practice exercise each day and demonstrate it on day seven.",goal:"Submit one practical demonstration and a seven-day practice log."},
  {area:"Engagement",score:student.engagement,task:"Join one study group or campus learning activity this week and share what you learned.",goal:"Participate in one activity and write a short reflection."},
  {area:"Feedback",score:student.feedback,task:"Schedule a faculty check-in to identify learning barriers and agree on two practical changes.",goal:"Record two agreed actions and review them after seven days."}
 ];
 const priorities=rules.filter(item=>Number.isFinite(item.score)&&item.score<60).sort((a,b)=>a.score-b.score);
 studentImprovementPlan={studentId:student.id,title:"Seven-day improvement plan for "+student.name,description:priorities.map((item,index)=>`${index+1}. ${item.area} (${item.score}%): ${item.task} Goal: ${item.goal}`).join("\n")+"\nReview progress with your faculty mentor after seven days."};
 panel.innerHTML=priorities.length?`<p><b>Start with ${escapeHtml(priorities[0].area.toLowerCase())} (${priorities[0].score}%).</b> Complete the tasks below and review progress after seven days.</p>${priorities.map((item,index)=>`<div class="insight" style="margin:12px 0"><h4>Priority ${index+1}: ${item.area} · ${item.score}%</h4><p>${escapeHtml(item.task)}</p><p><b>Review goal:</b> ${escapeHtml(item.goal)}</p></div>`).join("")}<p class="label">Targets guide practice; score improvements depend on completed work and reassessment.</p><button class="btn primary" onclick="sendStudentPlan(this)">Send plan to student</button> <button class="btn secondary" onclick="document.getElementById('studentAgentPlan').innerHTML='';studentImprovementPlan=null">Not now</button>`:"<p>All measured areas are at or above 60%. Continue regular practice and review progress weekly.</p>";
}
async function sendStudentPlan(button){
 const plan=studentImprovementPlan;if(!plan||plan.studentId!==selectedStudentId)return;
 button.disabled=true;
 try{
  const response=await fetch(API_BASE+"/api/students",{headers:{Authorization:"Bearer "+authToken}});
  const data=await response.json();if(!response.ok)throw new Error(data.message||"Cannot find student account.");
  const student=data.students.find(item=>item.student_id===plan.studentId);
  if(!student)throw new Error("This student has no registered database account. Register the student before sending tasks.");
  await progressRequest("",{method:"POST",body:JSON.stringify({studentId:student.id,title:plan.title,description:plan.description})});
  button.textContent="Plan sent to student";toast("The improvement plan is now in the student's task inbox.");
 }catch(error){button.disabled=false;toast(error.message);}
}
let facultyRoster=[],rosterLoading=false,rosterError="";
async function refreshFacultyRoster(redraw=true){
 if(!["faculty","admin"].includes(role)||!authToken||rosterLoading)return;
 const token=authToken;rosterLoading=true;
 try{
  const response=await fetch(API_BASE+"/api/students",{headers:{Authorization:"Bearer "+token}});
  const data=await response.json();if(!response.ok)throw new Error(data.message||"Cannot load students");
  if(token!==authToken||!["faculty","admin"].includes(role))return;
  const number=value=>value==null?null:Number(value);
  const next=data.students.map(s=>({id:s.student_id,databaseId:s.id,name:s.name,email:s.email,dept:s.department,year:s.year_level||"Not recorded",cgpa:number(s.cgpa),success:number(s.success_score),risk:number(s.risk_score),attendance:number(s.attendance),lms:number(s.lms),engagement:number(s.engagement),coding:number(s.coding),aptitude:number(s.aptitude),interview:number(s.interview),skills:number(s.skills),feedback:number(s.feedback),segment:s.segment||"Awaiting assessment"}));
  const changed=JSON.stringify(next)!==JSON.stringify(facultyRoster)||!!rosterError;facultyRoster=next;rosterError="";
  if(redraw&&changed&&["dashboard","students","student-details"].includes(page)){const search=document.getElementById("search")?.value;render();if(search&&page==="students"){document.getElementById("search").value=search;filterStudents();}}
 }catch(error){rosterError=error.message;if(redraw&&page==="dashboard")render();}finally{rosterLoading=false;}
}
function liveFacultyDashboard(){
 const scored=facultyRoster.filter(s=>s.success!=null),risk=facultyRoster.filter(s=>s.risk!=null&&s.risk>65),low=facultyRoster.filter(s=>(s.success!=null&&s.success<60)||(s.attendance!=null&&s.attendance<60));
 const average=scored.length?Math.round(scored.reduce((sum,s)=>sum+s.success,0)/scored.length)+"%":"Not recorded";
 return `<div class="grid cards">${[["Registered students",facultyRoster.length],["High risk",risk.length],["Average success",average],["Need improvement",low.length]].map(([label,value])=>`<div class="card"><div class="label">${label}</div><div class="value">${value}</div></div>`).join("")}</div><p class="label">Student registrations update automatically every 10 seconds.</p>${rosterError?`<p class="danger">${escapeHtml(rosterError)}</p>`:""}<div class="card"><h3>Student Improvement Assistant</h3><p>Review tasks for students with recorded success or attendance below 60%.</p><button class="btn primary" onclick="loadSuggestions()">Suggest improvement tasks</button><div id="suggestionPanel" aria-live="polite"></div></div><details class="card" style="margin-top:20px"><summary>Change account password</summary><form onsubmit="changeAccountPassword(event)"><div class="form-group"><label>Current password<input name="currentPassword" type="password" autocomplete="current-password" required></label></div><div class="form-group"><label>New password (12–72 characters)<input name="newPassword" type="password" autocomplete="new-password" minlength="12" maxlength="72" required></label></div><button class="btn primary">Change password</button></form></details><h3 class="section-title">Student segments</h3><div class="card" id="agentSegments">Loading explainable segments...</div><h3 class="section-title">Verification inbox</h3><div class="card" id="reviewPanel" aria-live="polite">Loading pending reviews...</div><h3 class="section-title">Registered students</h3>${studentsPage()}`;
}
setInterval(()=>{if(currentUser&&["faculty","admin"].includes(role)&&!document.hidden)refreshFacultyRoster();},10000);
window.addEventListener("focus",()=>{if(currentUser&&["faculty","admin"].includes(role))refreshFacultyRoster();});
let myPerformance=null,mySubmission=null;
const performanceFields=[["attendance","Attendance"],["lms","LMS Activity"],["engagement","Engagement"],["coding","Coding"],["aptitude","Aptitude"],["interview","Mock Interview"],["skills","Skills"],["feedback","Feedback"]];
async function loadMyPerformance(){
 const response=await fetch(API_BASE+"/api/students/me/performance",{headers:{Authorization:"Bearer "+authToken}});
 const data=await response.json();if(!response.ok)throw new Error(data.message||"Cannot load performance");myPerformance=data.data;mySubmission=data.submission;const healthResponse=await fetch(API_BASE+"/api/companion/progress",{headers:{Authorization:"Bearer "+authToken}});if(healthResponse.ok)academicRisk=(await healthResponse.json()).risk;
}
function studentPerformanceDashboard(){
 return `${academicHealthCard()}<div class="card"><h3>My performance</h3><p>Enter your current percentages. Values need faculty verification before they affect official progress.</p><p class="label">${escapeHtml(myPerformance?.student_id)} · ${escapeHtml(myPerformance?.department)} · Overall progress: ${myPerformance?.success_score==null?"Not recorded":myPerformance.success_score+"%"}</p><p>Latest submission: <b>${escapeHtml(mySubmission?.status||"None")}</b> ${escapeHtml(mySubmission?.review_reason||"")}</p><form onsubmit="saveMyPerformance(event)"><div class="grid two">${performanceFields.map(([key,label])=>`<div class="form-group"><label for="performance-${key}">${label} (%)</label><input id="performance-${key}" name="${key}" type="number" min="0" max="100" step="0.01" required value="${myPerformance?.[key]??""}"></div>`).join("")}</div><p class="label">Overall progress is the average of these eight values. Your faculty can review your entries.</p><div class="form-group"><label for="performanceEvidence">Supporting evidence or record references</label><textarea id="performanceEvidence" name="evidence" required maxlength="4000" style="width:100%;min-height:90px" placeholder="Describe the attendance register, assessment results, or LMS records your faculty should verify."></textarea></div><button class="btn primary" type="submit">Submit for verification</button><p id="performanceMessage" role="status" aria-live="polite"></p></form></div><h3 class="section-title">Tasks from your faculty</h3><div class="card" id="assignedTasks">Loading tasks...</div>`;
}
async function saveMyPerformance(event){
 event.preventDefault();const form=event.target,button=form.querySelector('button[type="submit"]'),message=document.getElementById("performanceMessage");if(button.disabled)return;
 const fields=new FormData(form),payload=Object.fromEntries(performanceFields.map(([key])=>[key,Number(fields.get(key))]));payload.evidence=fields.get("evidence");button.disabled=true;
 try{
  const response=await fetch(API_BASE+"/api/students/me/performance",{method:"PUT",headers:{"Content-Type":"application/json",Authorization:"Bearer "+authToken},body:JSON.stringify(payload)});
  const data=await response.json();if(!response.ok)throw new Error(data.message||"Could not save performance");await loadMyPerformance();render();toast("Submitted for verification. Official scores stay unchanged until approval.");
 }catch(error){message.textContent=error.message;}finally{button.disabled=false;}
}
async function reviewRequest(path,options={}){
 const response=await fetch(API_BASE+"/api/reviews"+path,{...options,headers:{Authorization:"Bearer "+authToken,"Content-Type":"application/json"}});
 const data=await response.json();if(!response.ok)throw new Error(data.message||"Review failed");return data;
}
async function loadReviewPanel(){
 const panel=document.getElementById("reviewPanel");if(!panel)return;
 try{
  const submissions=await reviewRequest("/performance");
  const faculty=role==="admin"?await reviewRequest("/faculty"):{data:[]};if(!panel.isConnected)return;
  panel.innerHTML=faculty.data.map(account=>`<section class="insight" style="margin-bottom:16px"><h4>Faculty application: ${escapeHtml(account.name)}</h4><p>${escapeHtml(account.email)} · ID: ${escapeHtml(account.faculty_id)} · ${escapeHtml(account.status)}</p><label>Verified department <input id="facultyDepartment-${account.id}" value="${escapeHtml(account.department)}" maxlength="100"></label><p><label>Verification reason <input id="facultyReason-${account.id}" placeholder="Staff-list verification reference" required></label></p><button class="btn primary" onclick="reviewFaculty(${account.id},'APPROVED',this)">Approve access</button> <button class="btn secondary" onclick="reviewFaculty(${account.id},'REJECTED',this)">Reject or revoke access</button></section>`).join("")+submissions.data.map(submission=>{
   const values=typeof submission.submitted_values==="string"?JSON.parse(submission.submitted_values):submission.submitted_values;
   return `<section class="insight" style="margin-bottom:16px"><h4>${escapeHtml(submission.name)} · ${escapeHtml(submission.campus_id)}</h4><p>Evidence: ${escapeHtml(submission.evidence)}</p><div class="grid two">${performanceFields.map(([key,label])=>`<label>${label}<input type="number" min="0" max="100" step=".01" id="review-${submission.id}-${key}" value="${values[key]}"></label>`).join("")}</div><p>Edit values above if source records require a correction.</p><label>Review reason <input id="reviewReason-${submission.id}" required></label><p><button class="btn primary" onclick="reviewPerformance(${submission.id},'APPROVED',this)">Approve reviewed values</button> <button class="btn secondary" onclick="reviewPerformance(${submission.id},'REJECTED',this)">Reject</button></p></section>`;
  }).join("")||"No pending reviews.";
 }catch(error){if(panel.isConnected)panel.textContent=error.message;}
}
async function reviewFaculty(id,status,button){
 const reason=document.getElementById("facultyReason-"+id).value.trim(),department=document.getElementById("facultyDepartment-"+id).value.trim();if(!reason){toast("Enter your verification reason.");return;}button.disabled=true;
 try{await reviewRequest("/faculty/"+id,{method:"POST",body:JSON.stringify({status,reason,department})});toast("Faculty access updated.");await loadReviewPanel();}catch(error){toast(error.message);button.disabled=false;}
}
async function reviewPerformance(id,status,button){
 const reason=document.getElementById("reviewReason-"+id).value.trim();if(!reason){toast("Enter your review reason.");return;}
 const values=Object.fromEntries(performanceFields.map(([key])=>[key,Number(document.getElementById(`review-${id}-${key}`).value)]));button.disabled=true;
 try{await reviewRequest("/performance/"+id,{method:"POST",body:JSON.stringify({status,reason,values})});toast("Review saved.");await refreshFacultyRoster(false);render();}catch(error){toast(error.message);button.disabled=false;}
}
async function changeAccountPassword(event){
 event.preventDefault();const form=event.target,button=form.querySelector("button");if(button.disabled)return;button.disabled=true;
 try{await reviewRequest("/password",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(form)))});logout();toast("Password changed. Please log in again.");}catch(error){toast(error.message);button.disabled=false;}
}
let academicRisk=null;
function academicHealthCard(){
 const risk=academicRisk;
 if(!risk?.available)return `<section class="card" style="margin-bottom:20px"><h3>My Academic Health</h3><p>${escapeHtml(risk?.message||"Awaiting faculty-approved percentages.")}</p></section>`;
 const color={HIGH:"#ef4444",MEDIUM:"#d97706",LOW:"#059669"}[risk.level];
 return `<section class="card" style="margin-bottom:20px;text-align:center;background:linear-gradient(135deg,#f5f3ff,#eff6ff)"><h2>My Academic Health</h2><div style="width:190px;height:190px;border-radius:50%;margin:20px auto;display:grid;place-items:center;background:conic-gradient(${color} ${risk.score*3.6}deg,#e5e7eb 0)"><div style="width:155px;height:155px;border-radius:50%;background:#fff;display:flex;flex-direction:column;justify-content:center"><strong style="font-size:48px;color:${color}">${risk.score}</strong><span>/100 · ${risk.level} RISK</span></div></div><p style="color:${color};font-weight:700">${risk.level==="HIGH"?"Needs immediate attention":risk.level==="MEDIUM"?"Needs focused improvement":"Maintain your progress"}</p><p class="label">Based on approved percentages · score-based estimate</p><button class="btn secondary" onclick="document.getElementById('riskExplanation').hidden=!document.getElementById('riskExplanation').hidden">Why am I at risk?</button> <button class="btn primary" onclick="document.getElementById('dailyRiskPlan').hidden=false">Generate Personalized Plan</button><div id="riskExplanation" hidden style="text-align:left;margin-top:16px"><p>${escapeHtml(risk.explanation)}</p><p class="label">${escapeHtml(risk.method)}</p></div><div id="dailyRiskPlan" hidden style="text-align:left;margin-top:20px"><h3>Your seven-day improvement plan</h3>${risk.daily.map(day=>`<div class="insight" style="margin:10px 0"><b>Day ${day.day} · ${escapeHtml(day.focus)}</b><p>${escapeHtml(day.instruction)}</p><small>${escapeHtml(day.check)}</small></div>`).join("")}<p class="label">Completed practice does not change official risk automatically. Faculty-approved reassessments update your score.</p></div></section>`;
}
async function agentRequest(path,options={}){
 const response=await fetch(API_BASE+"/api/agents"+path,{...options,headers:{Authorization:"Bearer "+authToken,"Content-Type":"application/json"}});const data=await response.json();if(!response.ok)throw new Error(data.message||"Agent request failed");return data;
}
async function loadAgentAssessment(){
 const panel=document.getElementById("agentAssessment"),student=facultyRoster.find(s=>s.id===selectedStudentId);if(!panel||!student)return;
 try{
  const [scores,risk,recommendations]=await Promise.all([agentRequest(`/students/${student.databaseId}/scores`),agentRequest(`/students/${student.databaseId}/risk`),agentRequest(`/students/${student.databaseId}/recommendations`)]);if(!panel.isConnected)return;
  panel.innerHTML=`<div class="grid two">${["academic","placement"].map(domain=>`<section><h3>${domain==="academic"?"Academic":"Placement readiness"}</h3><p>Score: ${scores[domain].score??"Not available"} · Coverage: ${scores[domain].coverage}%</p><p><b>Risk: ${risk[domain].level||"Insufficient data"}</b> · ${risk[domain].status}</p>${risk[domain].triggers.map(trigger=>`<p class="insight">${escapeHtml(trigger.explanation)}<br><small>Rule: ${escapeHtml(trigger.rule)}</small></p>`).join("")}<p class="label">Missing: ${escapeHtml(risk[domain].missing.join(", ")||"None")}</p></section>`).join("")}</div><h3>Recommended support</h3>${recommendations.recommendations.map(action=>`<div class="insight" style="margin:12px 0"><b>${escapeHtml(action.title)} · ${action.priority}</b><p>${escapeHtml(action.task)}</p><p>Why: ${escapeHtml(action.why)}</p><p class="label">${escapeHtml(action.evidenceRequired)}</p><button class="btn primary" onclick="approveAgentRecommendation(${student.databaseId},'${action.key}',this)">Approve and assign</button></div>`).join("")||"No verified trigger currently requires a support proposal."}<p class="label">${escapeHtml(risk.method)}</p>`;
 }catch(error){if(panel.isConnected)panel.textContent=error.message;}
}
async function approveAgentRecommendation(id,key,button){button.disabled=true;try{await agentRequest(`/students/${id}/recommendations/${key}/approve`,{method:"POST",body:"{}"});button.textContent="Assigned";toast("Faculty-approved task sent to student inbox.");}catch(error){button.disabled=false;toast(error.message);}}
async function loadAgentSegments(){
 const panel=document.getElementById("agentSegments");if(!panel)return;
 try{const data=await agentRequest("/segments");if(!panel.isConnected)return;panel.innerHTML=`<p class="label">${escapeHtml(data.note)}</p>${data.segments.map(segment=>`<div class="insight" style="margin:10px 0"><b>${escapeHtml(segment.key.replaceAll("_"," "))}: ${segment.count} students</b><p>${escapeHtml(segment.definition)}</p><small>Support: ${escapeHtml(segment.actions.join(", "))}</small></div>`).join("")}<p>Unclassified or missing indicators: ${data.unclassified.length}</p>${role==="admin"?`<h4>Department summaries</h4>${Object.entries(data.departments).map(([name,summary])=>`<p><b>${escapeHtml(name)}</b>: ${summary.studentCount} students · ${escapeHtml(JSON.stringify(summary.segmentCounts))}</p>`).join("")}`:""}`;}catch(error){if(panel.isConnected)panel.textContent=error.message;}
}
async function recordAgentOutcome(id,button){
 const status=document.getElementById(`outcomeStatus-${id}`).value,evidence=document.getElementById(`outcomeEvidence-${id}`).value.trim(),notes=document.getElementById(`outcomeNotes-${id}`).value.trim();if(!evidence||!notes){toast("Evidence and outcome notes are required.");return;}button.disabled=true;
 try{await agentRequest(`/interventions/${id}/outcomes`,{method:"POST",body:JSON.stringify({status,evidence,notes})});toast("Outcome recorded. Effectiveness requires verified reassessment.");await loadProgressPanel();}catch(error){button.disabled=false;toast(error.message);}
}