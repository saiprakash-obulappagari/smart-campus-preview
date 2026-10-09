const {loadUnified}=require('./unifiedData');
async function loadStudent(id){const campus=await loadUnified({role:'ADMIN'},{studentId:id});return campus.students[0]||null;}
async function loadRoster(user){return (await loadUnified(user)).students;}
module.exports={loadStudent,loadRoster};
