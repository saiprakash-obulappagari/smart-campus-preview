require('dotenv').config({quiet:true});
const mysql=require('mysql2/promise');
const fs=require('fs');
(async()=>{
 const c=await mysql.createConnection({host:process.env.DB_HOST,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,port:Number(process.env.DB_PORT||3306)});
 try{
  for(const sql of fs.readFileSync(__dirname+'/approval-schema.sql','utf8').split(';').filter(s=>s.trim()))await c.query(sql);
  await c.beginTransaction();
  const [newAccounts]=await c.query("SELECT id,role FROM users WHERE id NOT IN (SELECT user_id FROM account_access)");
  for(const user of newAccounts)await c.query('INSERT INTO account_access (user_id,status) VALUES (?,?)',[user.id,user.role==='FACULTY'?'PENDING':'APPROVED']);
  const [migration]=await c.query("SELECT id FROM review_audit WHERE action='LEGACY_DATA_QUARANTINE' LIMIT 1");
  if(!migration.length){
   const [rows]=await c.query('SELECT * FROM student_performance');
   for(const row of rows){
    const fields=['attendance','lms','engagement','coding','aptitude','interview','skills','feedback'];
    const values=Object.fromEntries(fields.map(field=>[field,Number(row[field])]));
    await c.query('INSERT INTO performance_submissions (student_id,submitted_values,evidence) VALUES (?,?,?)',[row.student_id,JSON.stringify(values),'Previously self-reported data. Faculty must verify source records before approval.']);
    await c.query('DELETE FROM student_performance WHERE student_id=?',[row.student_id]);
   }
   await c.query('INSERT INTO review_audit (actor_id,action,target_id,details) VALUES (0,?,?,?)',['LEGACY_DATA_QUARANTINE',0,JSON.stringify({records:rows.length,facultyApprovalRequired:true})]);
  }
  await c.commit();
  const [admins]=await c.query("SELECT COUNT(*) AS count FROM users WHERE role='ADMIN'");
  console.log(JSON.stringify({migration:'complete',administratorAccounts:admins[0].count}));
 }catch(error){await c.rollback();throw error;}finally{await c.end();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
