(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const state = { activeTab: 'overview', current: null };

  function client() {
    if (!window.supabaseClient) throw new Error('Supabase is not configured. Check js/supabase.js.');
    return window.supabaseClient;
  }

  function toast(message) {
    const el = $('#toast'); el.textContent = message; el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  async function currentUser() {
    const { data, error } = await client().auth.getUser();
    if (error) throw error;
    return data.user;
  }

  async function init() {
    try {
      const { data } = await client().auth.getSession();
      if (data.session) showDashboard(data.session.user);
      else showLogin();
    } catch (e) {
      showLogin(e.message);
    }
  }

  function showLogin(message = '') {
    $('#loginView').classList.remove('hidden'); $('#dashboardView').classList.add('hidden');
    $('#logoutBtn').classList.add('hidden'); $('#userEmail').textContent = 'Not signed in';
    if (message) $('#loginStatus').textContent = message;
  }

  function showDashboard(user) {
    $('#loginView').classList.add('hidden'); $('#dashboardView').classList.remove('hidden');
    $('#logoutBtn').classList.remove('hidden'); $('#userEmail').textContent = user.email || 'Admin';
    activateTab('overview'); loadOverview();
  }

  function activateTab(name) {
    state.activeTab = name;
    $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab-panel').forEach(p => p.classList.add('hidden'));
    $(`#${name}Tab`).classList.remove('hidden');
    $('#pageTitle').textContent = ({overview:'Dashboard',content:'Site Content',skills:'Skills',projects:'Projects',social:'Social Links',sections:'Custom Sections'})[name] || 'Dashboard';
    const loader = ({overview:loadOverview,content:loadContent,skills:loadSkills,projects:loadProjects,social:loadSocial,sections:loadSections})[name];
    if (loader) loader();
  }

  async function count(table) {
    const { count, error } = await client().from(table).select('*', { count: 'exact', head: true });
    if (error) throw error; return count || 0;
  }
  async function loadOverview() {
    try {
      const [c,s,p,sl,cs] = await Promise.all(['site_content','skills','projects','social_links','custom_sections'].map(count));
      $('#statsGrid').innerHTML = [['Content',c],['Skills',s],['Projects',p],['Sections',cs]].map(([label,num])=>`<div class="stat"><div class="num">${num}</div><span>${label}</span></div>`).join('');
    } catch(e){ toast(e.message); }
  }

  function openModal(title, fields, onSubmit) {
    $('#modalTitle').textContent = title;
    const form = $('#modalForm');
    form.innerHTML = `<div class="modal-grid">${fields.map(f => `<label class="${f.full ? 'full':''}">${escapeHtml(f.label)}${f.type === 'textarea' ? `<textarea name="${f.name}">${escapeHtml(f.value ?? '')}</textarea>` : f.type === 'select' ? `<select name="${f.name}">${(f.options||[]).map(o=>`<option value="${escapeHtml(o)}" ${o===f.value?'selected':''}>${escapeHtml(o)}</option>`).join('')}</select>` : f.type === 'checkbox' ? `<span class="checkbox-row"><input name="${f.name}" type="checkbox" ${f.value?'checked':''}> Visible</span>` : `<input name="${f.name}" type="${f.type||'text'}" value="${escapeHtml(f.value ?? '')}">`}</label>`).join('')}</div><div class="form-actions"><button type="button" class="small-btn" id="modalCancel">Cancel</button><button class="primary" type="submit">Save</button></div>`;
    $('#modal').classList.remove('hidden');
    $('#modalCancel').onclick = closeModal;
    form.onsubmit = async (ev) => { ev.preventDefault(); const fd = new FormData(form); const values = Object.fromEntries(fd.entries()); fields.forEach(f=>{ if(f.type==='checkbox') values[f.name] = form.elements[f.name].checked; }); try { await onSubmit(values); closeModal(); toast('Saved successfully'); activateTab(state.activeTab); } catch(e){ toast(e.message); } };
  }
  function closeModal(){ $('#modal').classList.add('hidden'); state.current=null; }

  async function loadContent(){
    const {data,error}=await client().from('site_content').select('*').order('content_key'); if(error) return toast(error.message);
    $('#contentTable').innerHTML = (data||[]).map(r=>`<tr><td><strong>${escapeHtml(r.content_key)}</strong></td><td>${escapeHtml(r.content_value||'')}</td><td>${r.updated_at?new Date(r.updated_at).toLocaleString():''}</td><td class="actions"><button class="small-btn" data-edit="${r.id}">Edit</button><button class="small-btn danger" data-delete="${r.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="4">No content yet.</td></tr>';
    $$('#contentTable [data-edit]').forEach(b=>b.onclick=()=>editContent(data.find(r=>String(r.id)===b.dataset.edit)));
    $$('#contentTable [data-delete]').forEach(b=>b.onclick=()=>deleteRow('site_content',b.dataset.delete,loadContent));
  }
  function editContent(row={}){
    openModal(row.id?'Edit Site Content':'Add Site Content',[{label:'Content key',name:'content_key',value:row.content_key||''},{label:'Content value',name:'content_value',type:'textarea',value:row.content_value||'',full:true}],async v=>{
      const payload={content_key:v.content_key.trim(),content_value:v.content_value,updated_at:new Date().toISOString()}; const q=row.id?client().from('site_content').update(payload).eq('id',row.id):client().from('site_content').insert(payload); const {error}=await q; if(error) throw error;
    });
  }

  async function loadSkills(){
    const {data,error}=await client().from('skills').select('*').order('sort_order').order('id'); if(error)return toast(error.message);
    $('#skillsList').innerHTML=(data||[]).map(r=>cardHtml(r,`<span class="pill">${escapeHtml(r.category)}</span>${r.is_visible?'<span class="pill">Visible</span>':'<span class="pill">Hidden</span>'}`, 'skill')).join('')||empty('No skills yet.'); bindCardButtons(data,'skill');
  }
  function editSkill(row={}){
    openModal(row.id?'Edit Skill':'Add Skill',[{label:'Name',name:'name',value:row.name||''},{label:'Category',name:'category',value:row.category||'',options:['Frontend','Backend','Programming','Core','Tools'] ,type:'select'},{label:'Icon text',name:'icon',value:row.icon||''},{label:'Level',name:'level',value:row.level||''},{label:'Sort order',name:'sort_order',type:'number',value:row.sort_order??0},{label:'Visible',name:'is_visible',type:'checkbox',value:row.is_visible!==false}],async v=>{const payload={name:v.name,category:v.category,icon:v.icon,level:v.level,sort_order:Number(v.sort_order||0),is_visible:Boolean(v.is_visible),updated_at:new Date().toISOString()};const {error}=row.id?await client().from('skills').update(payload).eq('id',row.id):await client().from('skills').insert(payload);if(error)throw error;});
  }

  async function loadProjects(){
    const {data,error}=await client().from('projects').select('*').order('sort_order').order('id'); if(error)return toast(error.message);
    $('#projectsList').innerHTML=(data||[]).map(r=>cardHtml(r,`${r.tech_stack?`<div>${escapeHtml(r.tech_stack)}</div>`:''}<div>${r.is_visible?'<span class="pill">Visible</span>':'<span class="pill">Hidden</span>'}</div>`, 'project')).join('')||empty('No projects yet.'); bindCardButtons(data,'project');
  }
  function editProject(row={}){
    openModal(row.id?'Edit Project':'Add Project',[{label:'Title',name:'title',value:row.title||'',full:true},{label:'Description',name:'description',type:'textarea',value:row.description||'',full:true},{label:'Image URL',name:'image_url',value:row.image_url||''},{label:'Live URL',name:'live_url',value:row.live_url||''},{label:'GitHub URL',name:'github_url',value:row.github_url||''},{label:'Tech stack',name:'tech_stack',value:row.tech_stack||'',full:true},{label:'Sort order',name:'sort_order',type:'number',value:row.sort_order??0},{label:'Visible',name:'is_visible',type:'checkbox',value:row.is_visible!==false}],async v=>{const payload={title:v.title,description:v.description,image_url:v.image_url,live_url:v.live_url,github_url:v.github_url,tech_stack:v.tech_stack,sort_order:Number(v.sort_order||0),is_visible:Boolean(v.is_visible),updated_at:new Date().toISOString()};const {error}=row.id?await client().from('projects').update(payload).eq('id',row.id):await client().from('projects').insert(payload);if(error)throw error;});
  }

  async function loadSocial(){
    const {data,error}=await client().from('social_links').select('*').order('sort_order').order('id'); if(error)return toast(error.message);
    $('#socialList').innerHTML=(data||[]).map(r=>cardHtml(r,`${escapeHtml(r.url||'')}<div>${r.is_visible?'<span class="pill">Visible</span>':'<span class="pill">Hidden</span>'}</div>`, 'social')).join('')||empty('No links yet.'); bindCardButtons(data,'social');
  }
  function editSocial(row={}){
    openModal(row.id?'Edit Social Link':'Add Social Link',[{label:'Platform',name:'platform',value:row.platform||''},{label:'Icon text',name:'icon',value:row.icon||''},{label:'URL',name:'url',value:row.url||'',full:true},{label:'Sort order',name:'sort_order',type:'number',value:row.sort_order??0},{label:'Visible',name:'is_visible',type:'checkbox',value:row.is_visible!==false}],async v=>{const payload={platform:v.platform,url:v.url,icon:v.icon,sort_order:Number(v.sort_order||0),is_visible:Boolean(v.is_visible),updated_at:new Date().toISOString()};const {error}=row.id?await client().from('social_links').update(payload).eq('id',row.id):await client().from('social_links').insert(payload);if(error)throw error;});
  }

  async function loadSections(){
    const {data,error}=await client().from('custom_sections').select('*').order('sort_order').order('id'); if(error)return toast(error.message);
    $('#sectionsList').innerHTML=(data||[]).map(r=>cardHtml(r,`${escapeHtml(r.content||'')}<div>${r.is_visible?'<span class="pill">Visible</span>':'<span class="pill">Hidden</span>'}</div>`, 'section')).join('')||empty('No custom sections yet.'); bindCardButtons(data,'section');
  }
  function editSection(row={}){
    openModal(row.id?'Edit Custom Section':'Add Custom Section',[{label:'Title',name:'title',value:row.title||''},{label:'Sort order',name:'sort_order',type:'number',value:row.sort_order??0},{label:'Content',name:'content',type:'textarea',value:row.content||'',full:true},{label:'Visible',name:'is_visible',type:'checkbox',value:row.is_visible!==false}],async v=>{const payload={title:v.title,content:v.content,sort_order:Number(v.sort_order||0),is_visible:Boolean(v.is_visible),updated_at:new Date().toISOString()};const {error}=row.id?await client().from('custom_sections').update(payload).eq('id',row.id):await client().from('custom_sections').insert(payload);if(error)throw error;});
  }

  function cardHtml(r, meta, type){return `<div class="card"><div class="card-top"><div><h3>${escapeHtml(r.title||r.name||r.platform||'Untitled')}</h3><div class="meta">${meta}</div></div><div class="actions"><button class="small-btn" data-type="${type}" data-edit="${r.id}">Edit</button><button class="small-btn danger" data-type="${type}" data-delete="${r.id}">Delete</button></div></div></div>`}
  function empty(text){return `<div class="card"><div class="meta">${escapeHtml(text)}</div></div>`}
  function bindCardButtons(data,type){
    $$('#'+({skill:'skillsList',project:'projectsList',social:'socialList',section:'sectionsList'}[type])+' [data-edit]').forEach(b=>b.onclick=()=>({skill:editSkill,project:editProject,social:editSocial,section:editSection}[type])(data.find(r=>String(r.id)===b.dataset.edit)));
    $$('#'+({skill:'skillsList',project:'projectsList',social:'socialList',section:'sectionsList'}[type])+' [data-delete]').forEach(b=>b.onclick=()=>deleteRow(({skill:'skills',project:'projects',social:'social_links',section:'custom_sections'}[type]),b.dataset.delete,({skill:loadSkills,project:loadProjects,social:loadSocial,section:loadSections}[type])));
  }
  async function deleteRow(table,id,reload){if(!confirm('Delete this item?'))return;const {error}=await client().from(table).delete().eq('id',id);if(error)toast(error.message);else{toast('Deleted');reload();}}

  $('#loginForm').onsubmit = async (e) => { e.preventDefault(); $('#loginStatus').textContent='Signing in…'; $('#loginStatus').className='status'; try { const {data,error}=await client().auth.signInWithPassword({email:$('#loginEmail').value.trim(),password:$('#loginPassword').value}); if(error) throw error; $('#loginStatus').className='status success'; showDashboard(data.user); } catch(err){ $('#loginStatus').textContent=err.message; } };
  $('#logoutBtn').onclick = async () => { await client().auth.signOut(); showLogin(); toast('Logged out'); };
  $('#modalClose').onclick=closeModal;
  $$('.nav-btn').forEach(b=>b.onclick=()=>activateTab(b.dataset.tab));
  $('#addContentBtn').onclick=()=>editContent(); $('#addSkillBtn').onclick=()=>editSkill(); $('#addProjectBtn').onclick=()=>editProject(); $('#addSocialBtn').onclick=()=>editSocial(); $('#addSectionBtn').onclick=()=>editSection();

  clientAuthListener();
  async function clientAuthListener(){try{client().auth.onAuthStateChange((_event,session)=>{if(session)showDashboard(session.user);});}catch(_e){/* init will show a useful error */} init();}
})();
