const db=require('../config/db');
(async()=>{
 try{await require('./sourceTables')(db);console.log('Verified source import tables ready.');}finally{await db.end();}
})().catch(e=>{console.error(e.code||e.message);process.exitCode=1;});
