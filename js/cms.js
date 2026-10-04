(function(){
  'use strict';
  async function getData(){
    try{ const r=await fetch('api.php?action=public',{cache:'no-store'}); const j=await r.json(); return j.ok?j.data:null; }
    catch(e){ console.error('CMS data error',e); return null; }
  }
  const $=(sel,root=document)=>root.querySelector(sel);
  const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  function text(sel,val){ const el=$(sel); if(el && val!=null) el.textContent=val; }
  function setAttr(sel,attr,val){const el=$(sel); if(el && val!=null) el.setAttribute(attr,val);}
  function renderSkills(data){
    const groups={};
    (data.skills||[]).forEach(s=>{(groups[s.group]??=[]).push(s);});
    const map={'Frontend Development':'#skillsGridFrontend','Programming Languages':'#skillsGridProgramming','Computer Science / Core Skills':'#skillsGridCore'};
    Object.entries(map).forEach(([group,sel])=>{
      const grid=$(sel); if(!grid) return; grid.innerHTML='';
      (groups[group]||[]).forEach(s=>{
        const article=document.createElement('article'); article.className='glass-card skill-card reveal'; article.setAttribute('data-glow','');
        const icon=document.createElement('div'); icon.className='skill-icon-wrap'; icon.setAttribute('aria-hidden','true');
        const ic=document.createElement('span'); ic.className='skill-text-icon'; ic.textContent=s.icon||s.name.slice(0,3).toUpperCase(); icon.appendChild(ic);
        const h=document.createElement('h3'); h.className='skill-name'; h.textContent=s.name;
        const cat=document.createElement('span'); cat.className='skill-category'; cat.textContent=s.category||group;
        const p=document.createElement('p'); p.className='skill-role'; p.textContent=s.role||'';
        const sheen=document.createElement('span'); sheen.className='card-sheen'; sheen.setAttribute('aria-hidden','true');
        article.append(icon,h,cat,p,sheen); grid.appendChild(article);
      });
    });
  }
  function renderProjects(data){
    const section=$('#projects'); const grid=$('#cmsProjectsGrid'); if(!section||!grid)return;
    grid.innerHTML=''; const projects=data.projects||[];
    if(!data.visibility.projects && !projects.length){ section.hidden=true; return; }
    section.hidden=!data.visibility.projects; if(section.hidden)return;
    projects.forEach(p=>{
      const card=document.createElement('article'); card.className='glass-card build-card reveal cms-project-card'; card.setAttribute('data-glow','');
      if(p.image){ const img=document.createElement('img'); img.src=p.image; img.alt=p.name||'Project'; img.style='width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:16px;margin-bottom:18px;'; card.appendChild(img); }
      const h=document.createElement('h3'); h.textContent=p.name||'Project';
      const d=document.createElement('p'); d.textContent=p.description||'';
      const meta=document.createElement('div'); meta.className='cms-project-meta'; (p.technologies||[]).forEach(t=>{const s=document.createElement('span');s.textContent=t;meta.appendChild(s);});
      const links=document.createElement('div'); links.className='cms-project-links';
      if(p.github){const a=document.createElement('a');a.href=p.github;a.target='_blank';a.rel='noopener noreferrer';a.className='btn btn-ghost';a.textContent='GitHub ↗';links.appendChild(a);}
      if(p.live){const a=document.createElement('a');a.href=p.live;a.target='_blank';a.rel='noopener noreferrer';a.className='btn btn-primary btn-glass';a.textContent='Live Demo ↗';links.appendChild(a);}
      card.append(h,d,meta,links); grid.appendChild(card);
    });
  }
  function renderCustom(data){
    const wrap=$('#cmsCustomSections'); if(!wrap)return; wrap.innerHTML='';
    (data.custom_sections||[]).filter(s=>s.enabled!==false).sort((a,b)=>(a.order||0)-(b.order||0)).forEach(s=>{
      const sec=document.createElement('section'); sec.className='section'; sec.id=s.id||('custom-'+Math.random().toString(36).slice(2,8));
      const inner=document.createElement('div'); inner.className='section-inner';
      const ey=document.createElement('p'); ey.className='section-eyebrow'; ey.innerHTML='<span class="section-index">+</span> '+(s.eyebrow||'Section');
      const h=document.createElement('h2'); h.className='section-title'; const parts=(s.title||'').split('|'); h.append(parts[0]||''); if(parts[1]){const sp=document.createElement('span');sp.className='accent-gradient';sp.textContent=parts[1];h.append(sp);}
      const lead=document.createElement('p'); lead.className='section-lead reveal'; lead.textContent=s.lead||'';
      const content=document.createElement('div'); content.className='glass-card reveal cms-custom-content'; content.style.padding='28px';
      (s.body||'').split(/\n\s*\n/).filter(Boolean).forEach(t=>{const p=document.createElement('p');p.textContent=t;content.appendChild(p);});
      inner.append(ey,h,lead,content); sec.appendChild(inner); wrap.appendChild(sec);
    });
  }
  function apply(data){
    if(!data)return;
    const p=data.profile||{};
    $$('[data-cms]').forEach(el=>{const key=el.getAttribute('data-cms').split('.'); let v=data; key.forEach(k=>{v=v?.[k];}); if(v!=null)el.textContent=v;});
    $$('[data-cms-build-title]').forEach(el=>{const i=+el.dataset.cmsBuildTitle; if(data.build?.[i]?.title)el.textContent=data.build[i].title;});
    $$('[data-cms-build-desc]').forEach(el=>{const i=+el.dataset.cmsBuildDesc; if(data.build?.[i]?.description)el.textContent=data.build[i].description;});
    $$('[data-cms-href]').forEach(el=>{const key=el.getAttribute('data-cms-href').split('.'); let v=data; key.forEach(k=>v=v?.[k]); if(v)el.href=v;});
    $$('[data-cms-src]').forEach(el=>{const key=el.getAttribute('data-cms-src').split('.'); let v=data; key.forEach(k=>v=v?.[k]); if(v)el.src=v;});
    // profile links / contact
    $$('.contact-info-item[href^="mailto:"] span:last-child').forEach(el=>el.textContent=p.email||el.textContent);
    $$('.contact-info-item[href^="mailto:"]').forEach(el=>el.href='mailto:'+(p.email||''));
    $$('.contact-info-item span:last-child').forEach(el=>{ if(el.textContent.trim()==='Pune, India')el.textContent=p.location||el.textContent; });
    $$('.contact-info-item[href*="github.com"] span:last-child').forEach(el=>el.textContent=(p.github||'').replace(/^https?:\/\//,''));
    $$('.contact-info-item[href*="github.com"]').forEach(el=>el.href=p.github||el.href);
    $$('.contact-info-item[href*="linkedin.com"] span:last-child').forEach(el=>el.textContent=(p.linkedin||'').replace(/^https?:\/\//,'').replace('www.',''));
    $$('.contact-info-item[href*="linkedin.com"]').forEach(el=>el.href=p.linkedin||el.href);
    $$('.linkedin-text-link').forEach(el=>{if(el.closest('#linkedin')){el.href=p.linkedin||el.href;el.textContent=(p.linkedin||'').replace(/^https?:\/\//,'')+' ↗';}});
    $$('.linkedin-action a').forEach(el=>{if(el.closest('#fiverr'))el.href=p.fiverr||el.href;});
    $$('#fiverr .linkedin-text-link').forEach(el=>{el.href=p.fiverr||el.href;el.textContent=(p.fiverr||'').replace(/^https?:\/\//,'')+' ↗';});
    $$('#github .github-cta a,#github .github-fallback-link').forEach(el=>el.href=p.github||el.href);
    // sections visibility
    Object.entries(data.visibility||{}).forEach(([id,on])=>{const sec=document.querySelector('[data-cms-section="'+id+'"]'); if(sec && id!=='projects') sec.hidden=!on; const nav=document.querySelector('[data-cms-nav="'+id+'"]'); if(nav) nav.closest('li').hidden=!on;});
    renderSkills(data); renderProjects(data); renderCustom(data);
  }
  async function init(){const d=await getData();apply(d);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init); else init();
})();
