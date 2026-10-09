require('dotenv').config({quiet:true});
const mysql=require('mysql2/promise'),fs=require('fs');
(async()=>{
 const c=await mysql.createConnection({host:process.env.DB_HOST,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,port:Number(process.env.DB_PORT||3306)});
 try{for(const sql of fs.readFileSync(__dirname+'/agents-schema.sql','utf8').split(';').filter(s=>s.trim()))await c.query(sql);console.log('Agent observation and outcome tables ready.');}finally{await c.end();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
