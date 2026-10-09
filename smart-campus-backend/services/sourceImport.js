const crypto=require('crypto');
const {cleanCategory,DEFINITIONS}=require('./successEngine');
function parseCSV(text){
 if(typeof text!=='string'||!text.trim())throw new Error('CSV is empty.');
 const rows=[];let row=[],field='',quoted=false,closed=false;
 const push=()=>{row.push(field);field='';closed=false;};
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;}
  else if(c==='"'){if(field||closed)throw new Error('Invalid CSV quoting.');quoted=true;}
  else if(c===',')push();
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;push();if(row.some(v=>v.trim()))rows.push(row);row=[];}
  else{if(closed&&!/\s/.test(c))throw new Error('Unexpected content after CSV quote.');if(!closed)field+=c;}
 }
 if(quoted)throw new Error('Unclosed CSV quote.');push();if(row.some(v=>v.trim()))rows.push(row);
 const headers=(rows.shift()||[]).map(v=>v.replace(/^\uFEFF/,'').trim());
 if(!headers.length||headers.some(h=>!h)||new Set(headers).size!==headers.length||headers.some(h=>['__proto__','constructor','prototype'].includes(h)))throw new Error('CSV headers must be valid, unique, and non-empty.');
 return rows.map((values,i)=>{if(values.length!==headers.length)throw new Error(`CSV line ${i+2} has the wrong number of columns.`);return Object.fromEntries(headers.map((h,j)=>[h,values[j].trim()]));});
}
function validDate(value,now){
 if(typeof value!=='string')return false;
 const match=value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/);
 if(!match)return false;
 const [,year,month,day,hour,minute,second]=match.map((v,i)=>i>0&&i<7?Number(v):v);
 if(year<2000||month<1||month>12||day<1||day>new Date(Date.UTC(year,month,0)).getUTCDate()||hour>23||minute>59||second>59)return false;
 const n=Date.parse(value);return Number.isFinite(n)&&n<=now;
}
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
function normalizeImport(body,now=Date.now()){
 const input=body.format==='csv'?parseCSV(body.csv):body.records;
 if(!Array.isArray(input)||!input.length||input.length>500)throw new Error('Import 1 to 500 source records per batch.');
 const records=[],errors=[],seen=new Set();
 input.forEach((raw,index)=>{try{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Expected a record object.');
  const studentId=String(raw.studentId||'').trim(),category=String(raw.category||'').trim().toLowerCase(),source=String(raw.source||'').trim(),measuredAt=String(raw.measuredAt||'').trim();
  if(!studentId||studentId.length>30||!Object.hasOwn(DEFINITIONS,category))throw new Error('Provide a registered campus studentId and valid category.');
  if(!source||source.length>1000)throw new Error('Provide a source reference (maximum 1000 characters).');
  if(!validDate(measuredAt,now))throw new Error('Use a valid non-future ISO timestamp with timezone, e.g. 2026-09-01T09:00:00Z.');
  const at=new Date(measuredAt).toISOString(),key=`${studentId}|${category}|${at}`;
  if(seen.has(key))throw new Error('Duplicate student/category/timestamp in this batch.');
  const values=cleanCategory(category,raw.values??Object.fromEntries(Object.entries(raw).filter(([k,v])=>!['studentId','category','source','measuredAt'].includes(k)&&v!=='')));
  seen.add(key);const record={studentId,category,source,measuredAt:at,values};records.push({...record,row:index+1,recordHash:hash(record)});
 }catch(e){errors.push({row:index+1,message:e.message});}});
 return {records,errors,total:input.length,valid:records.length,canCommit:!errors.length};
}
module.exports={parseCSV,normalizeImport,validDate,hash};
