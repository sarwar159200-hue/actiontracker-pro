function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return String(value).trim();
}

export function boxConfigurationSummary() {
  const subjectType = (process.env.BOX_SUBJECT_TYPE || "enterprise").trim().toLowerCase();
  const subjectId =
    (process.env.BOX_SUBJECT_ID || "").trim() ||
    (subjectType === "enterprise"
      ? (process.env.BOX_ENTERPRISE_ID || "").trim()
      : (process.env.BOX_SERVICE_ACCOUNT_USER_ID || "").trim());

  return {
    client_id_present: !!process.env.BOX_CLIENT_ID,
    client_secret_present: !!process.env.BOX_CLIENT_SECRET,
    enterprise_id_present: !!process.env.BOX_ENTERPRISE_ID,
    root_folder_id_present: !!process.env.BOX_ROOT_FOLDER_ID,
    subject_type: subjectType,
    subject_id_present: !!subjectId,
    subject_id_last4: subjectId ? subjectId.slice(-4) : null,
    client_id_last4: process.env.BOX_CLIENT_ID ? String(process.env.BOX_CLIENT_ID).trim().slice(-4) : null
  };
}

export async function getBoxToken() {
  const clientId = required("BOX_CLIENT_ID");
  const clientSecret = required("BOX_CLIENT_SECRET");
  const subjectType = (process.env.BOX_SUBJECT_TYPE || "enterprise").trim().toLowerCase();
  if (!["enterprise", "user"].includes(subjectType)) throw new Error("BOX_SUBJECT_TYPE must be 'enterprise' or 'user'.");
  const subjectId =
    (process.env.BOX_SUBJECT_ID || "").trim() ||
    (subjectType === "enterprise" ? required("BOX_ENTERPRISE_ID") : required("BOX_SERVICE_ACCOUNT_USER_ID"));

  const form = new URLSearchParams();
  form.set("client_id", clientId);
  form.set("client_secret", clientSecret);
  form.set("grant_type", "client_credentials");
  form.set("box_subject_type", subjectType);
  form.set("box_subject_id", subjectId);

  const r = await fetch("https://api.box.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store"
  });
  const text = await r.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  if (!r.ok || !data.access_token) {
    const base = data.error_description || data.error || `Box authentication failed (${r.status})`;
    if (String(base).toLowerCase().includes("credentials")) {
      throw new Error(`${base}. Verify Client ID and Client Secret are from the same Box application. For App Access Only CCG, use subject type enterprise with your Box Enterprise ID and re-authorize the application after configuration changes.`);
    }
    throw new Error(base);
  }
  return data.access_token;
}

export async function boxGet(path) {
  const token = await getBoxToken();
  const r = await fetch(`https://api.box.com/2.0${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const text = await r.text(); let data={}; try{data=JSON.parse(text)}catch{}
  if(!r.ok) throw new Error(data.message || `Box API failed (${r.status})`);
  return data;
}

export async function boxPost(path, payload) {
  const token = await getBoxToken();
  const r = await fetch(`https://api.box.com/2.0${path}`, {
    method:"POST", headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"}, body:JSON.stringify(payload), cache:"no-store"
  });
  const text=await r.text(); let data={}; try{data=JSON.parse(text)}catch{}
  if(!r.ok) throw new Error(data.message || `Box API failed (${r.status})`);
  return data;
}

export async function ensureBoxFolder(name,parentId){
  const safe=String(name||"").trim(); if(!safe) throw new Error("Box folder name is required.");
  const items=await boxGet(`/folders/${encodeURIComponent(parentId)}/items?limit=1000&fields=id,name,type`);
  const existing=(items.entries||[]).find(i=>i.type==="folder" && i.name.toLowerCase()===safe.toLowerCase());
  if(existing) return existing;
  return boxPost("/folders",{name:safe,parent:{id:String(parentId)}});
}

export async function ensureActionFolder({projectCode,actionNumber}){
  const root=required("BOX_ROOT_FOLDER_ID");
  const projects=await ensureBoxFolder("Projects",root);
  const project=await ensureBoxFolder(projectCode||"General",projects.id);
  const actions=await ensureBoxFolder("Actions",project.id);
  return ensureBoxFolder(actionNumber,actions.id);
}

export async function uploadSmallFileToBox({file,fileName,parentId}){
  const token=await getBoxToken();
  const form=new FormData();
  form.append("attributes",JSON.stringify({name:fileName,parent:{id:String(parentId)}}));
  form.append("file",file,fileName);
  const r=await fetch("https://upload.box.com/api/2.0/files/content",{method:"POST",headers:{Authorization:`Bearer ${token}`},body:form,cache:"no-store"});
  const text=await r.text(); let data={}; try{data=JSON.parse(text)}catch{}
  if(!r.ok) throw new Error(data.message || `Box upload failed (${r.status})`);
  const entry=data.entries?.[0]; if(!entry) throw new Error("Box did not return an uploaded file entry.");
  return entry;
}

export async function getBoxEmbed(fileId){
  return boxGet(`/files/${encodeURIComponent(fileId)}?fields=id,name,web_url,expiring_embed_link,file_version,permissions`);
}
