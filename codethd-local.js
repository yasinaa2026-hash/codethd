/* Codethd Local App
   Works directly on GitHub Pages. No Supabase, no email, no external database.
*/
(function(){
  'use strict';
  const KEY='codethd-local-db-v3';
  const CURRENT='codethd-current-user';
  const uid=()=> 'u_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  const pid=()=> 'p_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  const now=()=>new Date().toISOString();
  const starterHtml='<div class="box">أهلاً بك في Codethd 👋</div>';
  const starterCss='.box{background:linear-gradient(135deg,#20c997,#099268);padding:24px;color:#fff;border-radius:16px;text-align:center;font-size:1.4rem;font-weight:800;box-shadow:0 12px 30px rgba(32,201,151,.25)}';
  const starterJs="console.log('أهلاً بك في Codethd!');";
  function fresh(){
    const y={id:'u_yasin',username:'yasin',displayName:'Yasin',bio:'مطور في Codethd 🚀',avatar:'',createdAt:now()};
    return {
      version:3,
      users:[y],
      projects:[{id:'p_welcome',userId:'u_yasin',name:'مشروعي الأول',html:starterHtml,css:starterCss,js:starterJs,createdAt:now(),updatedAt:now()}],
      follows:[]
    };
  }
  function read(){
    try{
      const d=JSON.parse(localStorage.getItem(KEY)||'null');
      if(!d||!Array.isArray(d.users)||!Array.isArray(d.projects)||!Array.isArray(d.follows)) throw 0;
      return d;
    }catch(_){
      const d=fresh(); localStorage.setItem(KEY,JSON.stringify(d)); return d;
    }
  }
  function write(d){localStorage.setItem(KEY,JSON.stringify(d));return d}
  function clean(s){return String(s||'').trim().toLowerCase()}
  function validUsername(s){return /^[a-z0-9_\u0600-\u06ff\u0750-\u077f.-]{3,30}$/i.test(s)}
  function ensure(){
    const d=read();
    if(!d.users.some(u=>u.id==='u_yasin')){
      d.users.unshift(fresh().users[0]);
      if(!d.projects.some(p=>p.id==='p_welcome')) d.projects.unshift(fresh().projects[0]);
      write(d);
    }
    let cur=localStorage.getItem(CURRENT);
    if(!cur||!d.users.some(u=>u.id===cur)){cur='u_yasin';localStorage.setItem(CURRENT,cur)}
    return getCurrent();
  }
  function getCurrent(){const d=read();const id=localStorage.getItem(CURRENT);return d.users.find(u=>u.id===id)||null}
  function setCurrent(id){localStorage.setItem(CURRENT,id);return getCurrent()}
  function logout(){localStorage.removeItem(CURRENT)}
  function login(username,displayName){
    const d=read(), n=clean(username);
    if(!validUsername(n)) throw new Error('اسم المستخدم غير صالح.');
    let u=d.users.find(x=>x.username===n);
    if(!u){
      u={id:uid(),username:n,displayName:(displayName||n).trim(),bio:'عضو جديد في Codethd ✨',avatar:'',createdAt:now()};
      d.users.push(u); write(d);
    } else if(displayName && !u.displayName){u.displayName=displayName.trim();write(d)}
    setCurrent(u.id); return u;
  }
  function getUsers(q){
    const d=read(), n=clean(q);
    return d.users.filter(u=>u.id!==localStorage.getItem(CURRENT) &&
      (!n || clean(u.username).includes(n)||clean(u.displayName).includes(n)));
  }
  function getProfile(id){return read().users.find(u=>u.id===id)||null}
  function getProjects(userId){return read().projects.filter(p=>p.userId===userId).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))}
  function getProject(id){return read().projects.find(p=>p.id===id)||null}
  function searchProjects(q){
    const n=clean(q); return read().projects.filter(p=>!n||clean(p.name).includes(n));
  }
  function createProject(data){
    const d=read(),u=getCurrent(); if(!u) return null;
    const p={id:pid(),userId:u.id,name:(data.name||'مشروع Codethd').trim(),html:data.html||'',css:data.css||'',js:data.js||'',createdAt:now(),updatedAt:now()};
    d.projects.push(p); write(d); return p;
  }
  function updateProject(id,data){
    const d=read(),u=getCurrent();const p=d.projects.find(x=>x.id===id&&x.userId===u?.id);if(!p) return null;
    Object.assign(p,{html:data.html??p.html,css:data.css??p.css,js:data.js??p.js,name:data.name??p.name,updatedAt:now()});write(d);return p;
  }
  function removeProject(id){
    const d=read(),u=getCurrent();const i=d.projects.findIndex(x=>x.id===id&&x.userId===u?.id);if(i<0)return false;
    d.projects.splice(i,1);write(d); if(localStorage.getItem('codethd-active-project-id')===id)localStorage.removeItem('codethd-active-project-id'); return true;
  }
  function isFollowing(id){const me=getCurrent();return !!read().follows.find(f=>f.followerId===me?.id&&f.followingId===id)}
  function toggleFollow(id){
    const d=read(),me=getCurrent();if(!me||id===me.id)return false;
    const i=d.follows.findIndex(f=>f.followerId===me.id&&f.followingId===id);
    if(i>=0){d.follows.splice(i,1);write(d);return false}
    d.follows.push({followerId:me.id,followingId:id,createdAt:now()});write(d);return true;
  }
  function following(){
    const d=read(),me=getCurrent();const ids=new Set(d.follows.filter(f=>f.followerId===me?.id).map(f=>f.followingId));
    return d.users.filter(u=>ids.has(u.id));
  }
  ensure();
  window.CodeTHD={
    KEY,CURRENT,ensure,getCurrent,login,logout,setCurrent,getUsers,getProfile,getProjects,getProject,
    searchProjects,createProject,updateProject,removeProject,isFollowing,toggleFollow,following,validUsername
  };
})();