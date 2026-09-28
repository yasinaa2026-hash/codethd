/* Codethd Cloud — real shared accounts and projects */
(function(){
  'use strict';
  const cfg=window.CODETHD_CONFIG||{};
  if(!cfg.url||!cfg.key||!window.supabase) throw new Error('Codethd cloud configuration is missing.');
  const client=window.supabase.createClient(cfg.url,cfg.key,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
  });
  const emailForUsername=(username)=>String(username||'').trim().toLowerCase()+'@users.codethd.app';
  const cleanUsername=(username)=>String(username||'').trim().toLowerCase();
  const usernameOk=(username)=>/^[a-z0-9_]{3,24}$/.test(cleanUsername(username));
  const passwordOk=(password)=>typeof password==='string'&&password.length>=8;
  const errText=(e)=>{
    const m=String(e?.message||'').toLowerCase();
    if(m.includes('rate limit')||Number(e?.status)===429) return 'هناك ضغط مؤقت على التسجيل. انتظر قليلًا ثم حاول مرة واحدة.';
    if(m.includes('already registered')) return 'هذا الحساب موجود بالفعل. استخدم تسجيل الدخول.';
    if(m.includes('invalid login credentials')) return 'اسم المستخدم أو كلمة المرور غير صحيحة.';
    if(m.includes('email')&&m.includes('confirm')) return 'تأكيد البريد الإلكتروني مفعّل في إعدادات الحساب. عطّله ليعمل دخول Codethd بدون بريد.';
    return e?.message||'حدث خطأ غير متوقع.';
  };
  async function session(){const r=await client.auth.getSession();if(r.error)throw r.error;return r.data.session||null}
  async function profile(userId){const r=await client.from('profiles').select('id,username,display_name,bio,avatar_url,created_at').eq('id',userId).maybeSingle();if(r.error)throw r.error;return r.data||null}
  async function signUp(username,password,displayName){
    const u=cleanUsername(username); if(!usernameOk(u)) throw new Error('اسم المستخدم يجب أن يكون 3-24 حرفًا بالإنجليزية أو أرقام أو _.');
    if(!passwordOk(password)) throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
    const email=emailForUsername(u);
    const r=await client.auth.signUp({email,password,options:{data:{username:u,display_name:(displayName||u).trim()}}});
    if(r.error)throw r.error;
    if(!r.data.session) throw new Error('تم إنشاء الحساب، لكن تأكيد البريد مفعّل. عطّل Confirm email في إعدادات Authentication.');
    const p=await profile(r.data.user.id);
    return {session:r.data.session,profile:p};
  }
  async function signIn(username,password){
    const u=cleanUsername(username); if(!usernameOk(u)) throw new Error('اسم المستخدم غير صالح.');
    if(!passwordOk(password)) throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
    const r=await client.auth.signInWithPassword({email:emailForUsername(u),password});
    if(r.error)throw r.error;
    return {session:r.data.session,profile:await profile(r.data.user.id)};
  }
  async function ensureSession(){const s=await session();if(!s) return null;const p=await profile(s.user.id);return p?{session:s,profile:p}:null}
  async function signOut(){await client.auth.signOut()}
  async function saveProject(id,data){
    const s=await session(); if(!s)throw new Error('انتهت الجلسة.');
    if(id){
      const r=await client.from('projects').update({name:data.name||'مشروع Codethd',html:data.html||'',css:data.css||'',js:data.js||''}).eq('id',id).eq('user_id',s.user.id).select('id').maybeSingle();
      if(r.error)throw r.error;if(r.data)return r.data;
    }
    const r=await client.from('projects').insert({user_id:s.user.id,name:data.name||'مشروع Codethd',html:data.html||'',css:data.css||'',js:data.js||''}).select('id').single();
    if(r.error)throw r.error;return r.data;
  }
  async function ownProjects(){
    const s=await session();if(!s)return [];
    const r=await client.from('projects').select('id,name,html,css,js,updated_at,user_id').eq('user_id',s.user.id).order('updated_at',{ascending:false});
    if(r.error)throw r.error;return r.data||[];
  }
  async function userProjects(userId){const r=await client.from('projects').select('id,name,html,css,js,updated_at,user_id').eq('user_id',userId).order('updated_at',{ascending:false});if(r.error)throw r.error;return r.data||[]}
  async function project(id){const r=await client.from('projects').select('id,name,html,css,js,updated_at,user_id').eq('id',id).maybeSingle();if(r.error)throw r.error;return r.data||null}
  async function deleteProject(id){const s=await session();if(!s)return;const r=await client.from('projects').delete().eq('id',id).eq('user_id',s.user.id);if(r.error)throw r.error}
  async function searchPeople(q){
    const s=await session();if(!s)return [];
    const term='%'+String(q||'').trim()+'%';
    const [a,b]=await Promise.all([
      client.from('profiles').select('id,username,display_name,bio,avatar_url,created_at').ilike('username_norm',term).neq('id',s.user.id).limit(60),
      client.from('profiles').select('id,username,display_name,bio,avatar_url,created_at').ilike('display_name',term).neq('id',s.user.id).limit(60)
    ]);
    if(a.error)throw a.error;if(b.error)throw b.error;
    const map=new Map();[...(a.data||[]),...(b.data||[])].forEach(x=>map.set(x.id,x));return [...map.values()];
  }
  async function allPeople(){
    const s=await session();if(!s)return [];
    const r=await client.from('profiles').select('id,username,display_name,bio,avatar_url,created_at').neq('id',s.user.id).order('created_at',{ascending:false}).limit(100);
    if(r.error)throw r.error;return r.data||[];
  }
  async function peopleProjects(q){
    const s=await session();if(!s)return [];
    const term='%'+String(q||'').trim()+'%';
    const r=await client.from('projects').select('id,name,updated_at,user_id').ilike('name',term).neq('user_id',s.user.id).limit(60);
    if(r.error)throw r.error;return r.data||[];
  }
  async function followed(){
    const s=await session();if(!s)return [];
    const r=await client.from('follows').select('following_id').eq('follower_id',s.user.id);if(r.error)throw r.error;
    const ids=(r.data||[]).map(x=>x.following_id);if(!ids.length)return [];
    const p=await client.from('profiles').select('id,username,display_name,bio,avatar_url,created_at').in('id',ids);
    if(p.error)throw p.error;return p.data||[];
  }
  async function isFollowing(id){const s=await session();if(!s)return false;const r=await client.from('follows').select('following_id').eq('follower_id',s.user.id).eq('following_id',id).maybeSingle();if(r.error)throw r.error;return !!r.data}
  async function toggleFollow(id){
    const s=await session();if(!s||id===s.user.id)return false;
    const yes=await isFollowing(id);
    if(yes){const r=await client.from('follows').delete().eq('follower_id',s.user.id).eq('following_id',id);if(r.error)throw r.error;return false}
    const r=await client.from('follows').insert({follower_id:s.user.id,following_id:id});if(r.error)throw r.error;return true;
  }
  async function stats(id){const [followers,following,projects]=await Promise.all([
    client.from('follows').select('*',{count:'exact',head:true}).eq('following_id',id),
    client.from('follows').select('*',{count:'exact',head:true}).eq('follower_id',id),
    client.from('projects').select('*',{count:'exact',head:true}).eq('user_id',id)
  ]);
  if(followers.error)throw followers.error;if(following.error)throw following.error;if(projects.error)throw projects.error;
  return {followers:followers.count||0,following:following.count||0,projects:projects.count||0};
  }
  async function updateProfile(data){
    const s=await session();if(!s)throw new Error('انتهت الجلسة.');
    const r=await client.from('profiles').update(data).eq('id',s.user.id).select('id,username,display_name,bio,avatar_url').single();
    if(r.error)throw r.error;return r.data;
  }
  window.CodeTHDCloud={client,emailForUsername,usernameOk,passwordOk,errorText,session,profile,signUp,signIn,ensureSession,signOut,saveProject,ownProjects,userProjects,project,deleteProject,searchPeople,allPeople,peopleProjects,followed,isFollowing,toggleFollow,stats,updateProfile};
})();