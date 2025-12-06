const qs=(s,c=document)=>c.querySelector(s);const qsa=(s,c=document)=>Array.from(c.querySelectorAll(s));
const headerInit=()=>{
  const toggle=qs('.menu-toggle');
  const panel=qs('#mobilePanel');
  const nav=qs('#siteNav');
  if(toggle){toggle.addEventListener('click',()=>{const o=panel.classList.toggle('open');toggle.setAttribute('aria-expanded',o?'true':'false');});}
  qsa('.dropdown-toggle').forEach(btn=>{btn.addEventListener('click',e=>{e.preventDefault();const dd=btn.closest('.dropdown');const isOpen=dd.classList.contains('open');qsa('.dropdown').forEach(d=>d.classList.remove('open'));if(!isOpen){dd.classList.add('open');}});});
  document.addEventListener('click',e=>{if(!e.target.closest('.dropdown')){qsa('.dropdown').forEach(d=>d.classList.remove('open'));}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){panel.classList.remove('open');qsa('.dropdown').forEach(d=>d.classList.remove('open'));}});
  qsa('.open-notifications').forEach(el=>{el.addEventListener('click',e=>{e.preventDefault(); if(window.openNotificationsModal){ window.openNotificationsModal(); }});});
};
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',headerInit);}else{headerInit();}
