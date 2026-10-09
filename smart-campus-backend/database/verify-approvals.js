const express=require('express'),assert=require('node:assert/strict'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken');
const db=require('../config/db');
const app=express();app.use(express.json());app.use('/auth',require('../routes/authRoutes'));app.use('/students',require('../routes/studentRoutes'));app.use('/reviews',require('../routes/reviews'));app.use((e,q,s,n)=>s.status(500).json({message:e.message}));
app.use('/companion', require('../routes/companion'));
app.use('/agents', require('../routes/agents'));
const created=[];
const server=app.listen(0,'127.0.0.1',async()=>{
 try{
  const base='http://127.0.0.1:'+server.address().port,suffix=Date.now(),password='TemporaryApprovalTest!42';
  async function call(path,token,body,method=body?'POST':'GET'){
   const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};
  }
  const [admin]=await db.query('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)',['Approval test admin',`test-admin-${suffix}@example.invalid`,await bcrypt.hash(password,4),'ADMIN']);created.push(admin.insertId);
  await db.query("INSERT INTO account_access (user_id,status) VALUES (?,'APPROVED')",[admin.insertId]);
  const adminToken=jwt.sign({id:admin.insertId,sessionVersion:1,role:'ADMIN'},process.env.JWT_SECRET);
  const facultyEmail=`test-faculty-${suffix}@example.invalid`,studentEmail=`test-student-${suffix}@example.invalid`;
  assert.equal((await call('/auth/register',null,{name:'Test faculty',email:facultyEmail,password,role:'FACULTY',facultyId:'F-'+suffix,department:'CSE'})).status,201);
  const [faculty]=await db.query('SELECT id FROM users WHERE email=?',[facultyEmail]);created.push(faculty[0].id);
  assert.equal((await call('/auth/login',null,{email:facultyEmail,password})).status,403);
  const forgedRole=jwt.sign({id:faculty[0].id,sessionVersion:1,role:'ADMIN'},process.env.JWT_SECRET);
  assert.equal((await call('/reviews/faculty',forgedRole)).status,403);
  assert.equal((await call('/reviews/faculty/'+faculty[0].id,adminToken,{status:'APPROVED',reason:'Verified against test staff roster',department:'CSE'})).status,200);
  const login=await call('/auth/login',null,{email:facultyEmail,password});assert.equal(login.status,200);const facultyToken=login.data.token;
  assert.equal((await call('/reviews/faculty',facultyToken)).status,403);
  assert.equal((await call('/auth/register',null,{name:'Test student',email:studentEmail,password,role:'STUDENT',studentId:'S-'+suffix,department:'CSE'})).status,201);
  const [student]=await db.query('SELECT id FROM users WHERE email=?',[studentEmail]);created.push(student[0].id);
  const studentLogin=await call('/auth/login',null,{email:studentEmail,password});const token=studentLogin.data.token;
  assert.equal((await call('/auth/admin/login',null,{email:studentEmail,password})).status,403);
  assert.equal((await call('/auth/admin/login',null,{email:`test-admin-${suffix}@example.invalid`,password})).status,200);
  const values={attendance:58,lms:54,engagement:72,coding:42,aptitude:68,interview:48,skills:65,feedback:70};
  assert.equal((await call('/students/me/performance',token,{...values,evidence:'Test register reference'},'PUT')).status,200);
  let own=await call('/students/me/performance',token);assert.equal(own.data.data.success_score,null);assert.equal(own.data.submission.status,'PENDING');
  let companion=await call('/companion/progress',token);assert.equal(companion.status,200);assert.equal(companion.data.performance,null);assert.equal(companion.data.gaps.length,0);
  assert.equal((await call('/companion/progress',facultyToken)).status,403);
  if(!process.env.OPENAI_API_KEY)assert.equal((await call('/companion/ask',token,{question:'Explain recursion'})).status,503);
  const submission=own.data.submission.id;
  assert.equal((await call('/reviews/performance/'+submission,token,{status:'APPROVED',reason:'Self approval'})).status,403);
  assert.equal((await call('/reviews/performance/'+submission,facultyToken,{status:'APPROVED',reason:'Checked source records',values:{...values,coding:45}})).status,200);
  own=await call('/students/me/performance',token);assert.equal(Number(own.data.data.coding),45);
  const [studentRows]=await db.query('SELECT id FROM students WHERE user_id=?',[student[0].id]);const studentId=studentRows[0].id;
  assert.equal((await call(`/agents/students/${studentId}/observations`,token,{indicators:{marks:50},sourceReference:'Student claim',measuredAt:'2026-10-01T09:00:00Z'})).status,403);
  assert.equal((await call(`/agents/students/${studentId}/observations`,facultyToken,{indicators:{marks:65,assignments:40,backlogs:2},sourceReference:'Verified test register',measuredAt:'2026-09-01T09:00:00Z'})).status,201);
  assert.equal((await call(`/agents/students/${studentId}/observations`,facultyToken,{indicators:{marks:40},sourceReference:'Verified test register',measuredAt:'2026-10-01T09:00:00Z'})).status,201);
  const risk=await call(`/agents/students/${studentId}/risk`,token);assert.equal(risk.status,200);assert.equal(risk.data.academic.level,'HIGH');assert(risk.data.academic.triggers.some(t=>t.indicator==='marksTrend'));
  assert.equal((await call('/agents/segments',facultyToken)).status,200);
  const intervention=await call(`/agents/students/${studentId}/recommendations/coding/approve`,facultyToken,{});assert.equal(intervention.status,201);
  assert.equal((await call(`/agents/students/${studentId}/recommendations/coding/approve`,facultyToken,{})).status,409);
  assert.equal((await call(`/agents/interventions/${intervention.data.interventionId}/outcomes`,facultyToken,{status:'COMPLETED',notes:'Done'})).status,400);
  assert.equal((await call(`/agents/interventions/${intervention.data.interventionId}/outcomes`,facultyToken,{status:'COMPLETED',notes:'Reviewed submissions, reassessment pending',evidence:'Verified test work reference'})).status,200);
  companion=await call('/companion/progress',token);assert(companion.data.gaps.some(gap=>gap.key==='coding'&&gap.score===45));assert(companion.data.history.length>0);
  assert.equal((await call('/students/me/performance',token,{...values,coding:100,evidence:'New claim'},'PUT')).status,200);
  own=await call('/students/me/performance',token);assert.equal(Number(own.data.data.coding),45);
  assert.equal((await call('/reviews/performance/'+own.data.submission.id,facultyToken,{status:'REJECTED',reason:'Source does not support claimed result'})).status,200);
  own=await call('/students/me/performance',token);assert.equal(Number(own.data.data.coding),45);
  assert.equal((await call('/reviews/faculty/'+faculty[0].id,adminToken,{status:'REJECTED',reason:'Revocation test'})).status,200);
  assert.equal((await call('/students',facultyToken)).status,403);
  console.log('PASS: pending faculty blocked; admin-only approval; token revocation; student cannot self-approve; corrected approval; pending/rejected changes preserve official values.');
 }catch(error){console.error(error);process.exitCode=1;}
 finally{
  for(const id of created)await db.query('DELETE FROM users WHERE id=?',[id]);
  if(created.length)await db.query('DELETE FROM review_audit WHERE actor_id IN (?)',[created]);
  server.close();await db.end();
 }
});
