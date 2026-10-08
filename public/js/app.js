'use strict';
window.UL = (() => {
  const icons = {
    truck: '<path d="M3 5h11v11H3zM14 9h4l3 4v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    route: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M5 7v6a3 3 0 0 0 3 3h8a3 3 0 0 0 0-6h-5"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>', info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', check:'<path d="M5 12l4 4L19 6"/>', user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.info}</svg>`;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const number = (value, digits = 0) => Number(value ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: digits });
  const date = value => value ? new Date(String(value).length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('pt-BR') : '—';
  const datetime = value => value ? new Date(value).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'}) : '—';
  const labels = {pendente:'Pendente',em_andamento:'Em andamento',concluida:'Concluída',cancelada:'Cancelada',disponivel:'Disponível',manutencao:'Manutenção',normal:'Normal',lento:'Lenta',administrador:'Administrador',operador:'Operador'};
  const badge = value => `<span class="badge ${escape(value)}">${escape(labels[value] || value)}</span>`;
  let user = null, toastTimer;
  const session = () => { try {return JSON.parse(sessionStorage.getItem('ul_usuario'));} catch {return null;} };
  const logout = () => {sessionStorage.removeItem('ul_token');sessionStorage.removeItem('ul_usuario');location.href='/login.html';};
  async function api(path, options = {}) {
    const token = sessionStorage.getItem('ul_token');
    const headers = { ...(options.body ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:`Bearer ${token}`} : {}), ...options.headers };
    let response;
    try { response = await fetch(`/api${path}`, {...options,headers, body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body}); }
    catch { throw new Error('Não foi possível conectar à plataforma. Verifique se ela está em funcionamento e tente novamente.'); }
    let data;
    try {data=await response.json();} catch {throw new Error('A plataforma não conseguiu concluir a solicitação. Tente novamente.');}
    if(!response.ok){
      if(response.status===401 && path !== '/login'){logout();throw new Error('Sua sessão terminou. Entre novamente.');}
      const error=new Error(data.mensagem || 'Não foi possível concluir a solicitação.');error.status=response.status;throw error;
    }
    return data;
  }
  function header() {
    const current=location.pathname.split('/').pop() || 'painel.html';
    const links=[['painel.html','Monitor de Fluxos'],['entregas.html','Entregas'],['simulacao.html','Simulação e mapa']];
    if(user.tipo==='administrador')links.push(['cadastros.html','Cadastros']);
    $('#app-header').innerHTML=`<div class="header-inner"><a href="/" class="brand brand-logo" aria-label="UrbanLink Flow, página inicial"><img src="/assets/logo.png" alt="UrbanLink Flow"></a><button type="button" class="nav-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Abrir menu">${icon('menu')}</button><nav class="nav" id="main-nav" aria-label="Menu principal">${links.map(([href,label])=>`<a href="/${href}" ${href===current?'class="active" aria-current="page"':''}>${label}</a>`).join('')}</nav><div class="user-area"><span><strong>${escape(user.nome)}</strong><small>${escape(labels[user.tipo])}</small></span><button class="btn secondary small" id="logout" type="button">Sair</button></div></div>`;
    $('#logout').addEventListener('click',logout);
    $('.nav-toggle').addEventListener('click',event=>{const open=$('#main-nav').classList.toggle('open');event.currentTarget.setAttribute('aria-expanded',String(open));event.currentTarget.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');});
  }
  async function auth(admin = false) {
    if(!sessionStorage.getItem('ul_token')){location.replace('/login.html');return null;}
    try {
      const result=await api('/me');user=result.dados;sessionStorage.setItem('ul_usuario',JSON.stringify(user));
      if(admin && user.tipo!=='administrador'){location.replace('/painel.html');return null;}
      header();document.body.classList.remove('auth-pending');$$('[data-admin]').forEach(el=>el.hidden=user.tipo!=='administrador');return user;
    } catch(error){showPageError(error.message);return null;}
  }
  function toast(message,error=false) {
    let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el);}
    clearTimeout(toastTimer);el.className=`toast${error?' error':''}`;el.textContent=message;el.hidden=false;toastTimer=setTimeout(()=>el.hidden=true,6000);
  }
  function showPageError(message){const el=$('#page-error');if(el){el.textContent=message;el.hidden=false;}else toast(message,true);}
  function clearPageError(){const el=$('#page-error');if(el)el.hidden=true;}
  function formError(form,message){const el=$('.form-error',form);if(el){el.textContent=message;el.hidden=!message;}}
  function busy(button,state,label){if(!button)return;if(state){button.dataset.previous=button.textContent;button.disabled=true;button.textContent=label || 'Aguarde…';}else{button.disabled=false;button.textContent=button.dataset.previous || 'Salvar';}}
  function params(data){const query=new URLSearchParams();Object.entries(data).forEach(([key,value])=>{if(value!==''&&value!==null&&value!==undefined)query.set(key,value);});return query.toString();}
  function empty(columns,title='Nenhum registro encontrado.',description='Os registros aparecerão aqui quando forem cadastrados.'){return `<tr><td colspan="${columns}" class="empty"><strong>${escape(title)}</strong>${escape(description)}</td></tr>`;}
  function pagination(el,result,onChange){const pages=Math.max(1,Math.ceil(result.total/result.limite));el.innerHTML=`<span>${number(result.total)} registro${result.total===1?'':'s'} · Página ${result.pagina} de ${pages}</span><div><button class="btn secondary small" type="button" data-page="${result.pagina-1}" ${result.pagina<=1?'disabled':''}>Anterior</button><button class="btn secondary small" type="button" data-page="${result.pagina+1}" ${result.pagina>=pages?'disabled':''}>Próxima</button></div>`;$$('[data-page]',el).forEach(button=>button.addEventListener('click',()=>onChange(Number(button.dataset.page))));}
  async function all(path){let page=1,records=[];while(true){const separator=path.includes('?')?'&':'?';const result=await api(`${path}${separator}limite=100&pagina=${page}`);records.push(...result.dados);if(records.length>=result.total||!result.dados.length)break;page++;}return records;}
  function dialog(id){const element=$(id);$$('[data-close]',element).forEach(button=>button.addEventListener('click',()=>element.close()));element.addEventListener('click',event=>{if(event.target===element){const rect=element.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)element.close();}});return element;}
  async function confirmDelete(resource,id,label,onSuccess){const modal=$('#confirm-dialog');$('#confirm-text').textContent=`Deseja excluir ${label}? A exclusão será recusada se o registro estiver vinculado a outra operação.`;formError($('#confirm-form'),'');modal.showModal();$('#confirm-form').onsubmit=async event=>{event.preventDefault();const button=$('button[type=submit]',event.currentTarget);busy(button,true,'Excluindo…');try{await api(`/${resource}/${id}`,{method:'DELETE'});modal.close();toast('Registro excluído.');await onSuccess();}catch(error){formError(event.currentTarget,error.message);}finally{busy(button,false);}};}
  function bootCommon(){const modal=$('#confirm-dialog');if(modal)dialog('#confirm-dialog');$$('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
  bootCommon();
  return {$,$$,escape,number,date,datetime,badge,labels,icon,api,auth,toast,showPageError,clearPageError,formError,busy,params,empty,pagination,all,dialog,confirmDelete,session, get user(){return user;}};
})();
