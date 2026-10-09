const express = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();
const fields = ['attendance','lms','engagement','coding','aptitude','interview','skills','feedback'];
router.use(authenticate);
router.post('/password', async(req,res,next)=>{
    let c;
    try {
        const bcrypt=require('bcryptjs');
        const {currentPassword,newPassword}=req.body;
        if(typeof currentPassword!=='string'||typeof newPassword!=='string'||newPassword.length<12||newPassword.length>72)return res.status(400).json({success:false,message:'New password must contain 12 to 72 characters.'});
        c=await db.getConnection();await c.beginTransaction();
        const [rows]=await c.query('SELECT password_hash FROM users WHERE id=? FOR UPDATE',[req.user.id]);
        if(!await bcrypt.compare(currentPassword,rows[0].password_hash)){await c.rollback();return res.status(401).json({success:false,message:'Current password is incorrect.'});}
        await c.query('UPDATE users SET password_hash=? WHERE id=?',[await bcrypt.hash(newPassword,12),req.user.id]);
        await c.query('UPDATE account_access SET session_version=session_version+1 WHERE user_id=?',[req.user.id]);
        await c.query('INSERT INTO review_audit (actor_id,action,target_id,details) VALUES (?,?,?,?)',[req.user.id,'PASSWORD_CHANGED',req.user.id,JSON.stringify({sessionsInvalidated:true})]);
        await c.commit();res.json({success:true,message:'Password changed. Log in again.'});
    }catch(error){if(c)await c.rollback();next(error);}finally{if(c)c.release();}
});
router.get('/audit', authorize('ADMIN'), async(req,res,next)=>{
    try { const [rows]=await db.query('SELECT * FROM review_audit ORDER BY id DESC LIMIT 200');res.json({success:true,data:rows}); }
    catch(error){next(error);}
});
router.get('/faculty', authorize('ADMIN'), async (req,res,next) => {
    try {
        const [rows] = await db.query(`SELECT u.id,u.name,u.email,f.faculty_id,f.department,a.status FROM users u JOIN account_access a ON a.user_id=u.id LEFT JOIN faculty f ON f.user_id=u.id WHERE u.role='FACULTY' ORDER BY u.id DESC`);
        res.json({success:true,data:rows});
    } catch(error){next(error);}
});
router.post('/faculty/:id', authorize('ADMIN'), async (req,res,next) => {
    let c;
    try {
        const {status,reason,department}=req.body;
        if(!['APPROVED','REJECTED'].includes(status)||typeof reason!=='string'||!reason.trim()||(status==='APPROVED'&&(typeof department!=='string'||!department.trim()))) return res.status(400).json({success:false,message:'Decision, verification reason and approved department are required.'});
        c=await db.getConnection();await c.beginTransaction();
        const [rows]=await c.query("SELECT u.id,a.status FROM users u JOIN account_access a ON a.user_id=u.id WHERE u.id=? AND u.role='FACULTY' FOR UPDATE",[req.params.id]);
        if(!rows.length){await c.rollback();return res.status(404).json({success:false,message:'Faculty account not found.'});}
        await c.query('UPDATE account_access SET status=?,session_version=session_version+1,reviewed_by=?,review_reason=?,reviewed_at=NOW() WHERE user_id=?',[status,req.user.id,reason,req.params.id]);
        if(status==='APPROVED') await c.query('INSERT INTO faculty (user_id,department) VALUES (?,?) ON DUPLICATE KEY UPDATE department=?',[req.params.id,department,department]);
        await c.query('INSERT INTO review_audit (actor_id,action,target_id,details) VALUES (?,?,?,?)',[req.user.id,'FACULTY_ACCESS_REVIEW',req.params.id,JSON.stringify({before:rows[0].status,status,reason,department})]);
        await c.commit();res.json({success:true,message:'Faculty access updated. Existing sessions invalidated.'});
    }catch(error){if(c)await c.rollback();next(error);}finally{if(c)c.release();}
});
router.get('/performance', authorize('FACULTY','ADMIN'), async(req,res,next)=>{
    try{
        const [rows]=await db.query(`SELECT ps.*,u.name,s.student_id AS campus_id,s.department FROM performance_submissions ps JOIN students s ON s.id=ps.student_id JOIN users u ON u.id=s.user_id WHERE ps.status='PENDING' ${req.user.role==='FACULTY'?'AND s.department=?':''} ORDER BY ps.id DESC`,req.user.role==='FACULTY'?[req.user.department||'']:[]);
        res.json({success:true,data:rows});
    }catch(error){next(error);}
});
router.post('/performance/:id',authorize('FACULTY','ADMIN'),async(req,res,next)=>{
    let c;
    try{
        const {status,reason,values:corrections}=req.body;
        if(!['APPROVED','REJECTED'].includes(status)||typeof reason!=='string'||!reason.trim())return res.status(400).json({success:false,message:'Review decision and reason are required.'});
        c=await db.getConnection();await c.beginTransaction();
        const [rows]=await c.query('SELECT ps.*,s.department,s.user_id FROM performance_submissions ps JOIN students s ON s.id=ps.student_id WHERE ps.id=? FOR UPDATE',[req.params.id]);
        const submission=rows[0];
        if(!submission||(req.user.role==='FACULTY'&&submission.department!==req.user.department)||submission.user_id===req.user.id){await c.rollback();return res.status(403).json({success:false,message:'You cannot review this submission.'});}
        if(submission.status!=='PENDING'){await c.rollback();return res.status(409).json({success:false,message:'Submission already reviewed.'});}
        const submitted=typeof submission.submitted_values==='string'?JSON.parse(submission.submitted_values):submission.submitted_values;
        const approved=corrections||submitted;const values=fields.map(field=>approved[field]);
        if(status==='APPROVED'&&values.some(value=>typeof value!=='number'||!Number.isFinite(value)||value<0||value>100)){await c.rollback();return res.status(400).json({success:false,message:'Reviewed values must be numbers from 0 to 100.'});}
        const [previous]=await c.query('SELECT * FROM student_performance WHERE student_id=?',[submission.student_id]);
        if(status==='APPROVED'){
            const average=Math.round(values.reduce((a,b)=>a+b,0)/8*100)/100;
            await c.query(`INSERT INTO student_performance (student_id,${fields.join(',')},success_score) VALUES (${Array(10).fill('?').join(',')}) ON DUPLICATE KEY UPDATE ${fields.map(field=>`${field}=?`).join(',')},success_score=?`,[submission.student_id,...values,average,...values,average]);
        }
        await c.query('UPDATE performance_submissions SET status=?,approved_values=?,review_reason=?,reviewed_by=?,reviewed_at=NOW() WHERE id=?',[status,status==='APPROVED'?JSON.stringify(approved):null,reason,req.user.id,submission.id]);
        await c.query('INSERT INTO review_audit (actor_id,action,target_id,details) VALUES (?,?,?,?)',[req.user.id,'PERFORMANCE_REVIEW',submission.id,JSON.stringify({status,reason,previous:previous[0]||null,submitted,approved:status==='APPROVED'?approved:null})]);
        await c.commit();res.json({success:true,message:'Review saved.'});
    }catch(error){if(c)await c.rollback();next(error);}finally{if(c)c.release();}
});
module.exports=router;
