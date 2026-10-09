const fs=require('fs'),path=require('path');
async function initializeSourceTables(db){
 const statements=fs.readFileSync(path.join(__dirname,'sources-schema.sql'),'utf8').split(';').filter(sql=>sql.trim());
 for(const sql of statements)await db.query(sql);
}
module.exports=initializeSourceTables;
