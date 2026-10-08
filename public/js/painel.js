'use strict';
(async () => {
  const {$,api,auth,number,escape,date,badge,empty,showPageError,clearPageError,busy}=UL;
  if(!await auth())return;
  let loading=false;
  async function load(){if(loading)return;loading=true;const button=$('#refresh');busy(button,true,'Atualizando…');try{
    const {dados:d}=await api('/painel');clearPageError();
    Object.entries({'#total':d.total_entregas,'#pendentes':d.pendentes,'#andamento':d.em_andamento,'#concluidas':d.concluidas,'#veiculos':d.veiculos_disponiveis,'#total-veiculos':d.total_veiculos,'#canceladas':d.canceladas}).forEach(([id,value])=>$(id).textContent=number(value));
    $('#tempo').textContent=d.tempo_medio_min===null?'Sem simulações':`${number(d.tempo_medio_min,2)} min`;
    $('#prazo').textContent=d.dentro_prazo_percentual===null?'Sem simulações':`${number(d.dentro_prazo_percentual,1)}%`;
    $('#prazo-barra').style.width=`${Math.max(0,Math.min(100,d.dentro_prazo_percentual||0))}%`;
    $('#recentes').innerHTML=d.ultimas_entregas.length?d.ultimas_entregas.map(item=>`<tr><td class="description"><strong>${escape(item.codigo)}</strong><small>${escape(item.descricao)}</small></td><td>${escape(item.destino)}</td><td>${date(item.data_agendada)}</td><td>${badge(item.status)}</td></tr>`).join(''):empty(4,'Sua operação começa aqui.','Cadastre uma entrega para ver os indicadores.');
    $('#updated').textContent=`Atualizado às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;
  }catch(error){showPageError(error.message);}finally{loading=false;busy(button,false);}}
  $('#refresh').addEventListener('click',load);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});await load();setInterval(()=>{if(!document.hidden)load();},30000);
})();
