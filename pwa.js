(()=>{
  let deferredPrompt=null;
  const installBtn=()=>document.getElementById('pwaInstallBtn');
  function showStatus(text){
    let el=document.getElementById('pwaStatus');
    if(!el){el=document.createElement('div');el.id='pwaStatus';el.className='pwa-update-badge';document.body.appendChild(el);}
    el.textContent=text;
    clearTimeout(el._hideTimer);
    el._hideTimer=setTimeout(()=>el.remove(),4200);
  }
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;const b=installBtn();if(b)b.hidden=false;});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;const b=installBtn();if(b)b.hidden=true;showStatus('已安裝阿肥石器時代 PWA');});
  document.addEventListener('click',async e=>{
    const b=e.target.closest?.('#pwaInstallBtn');
    if(!b||!deferredPrompt)return;
    deferredPrompt.prompt();
    try{await deferredPrompt.userChoice;}catch{}
    deferredPrompt=null;b.hidden=true;
  });
  if('serviceWorker' in navigator){
    window.addEventListener('load',async()=>{
      try{
        const reg=await navigator.serviceWorker.register('./service-worker.js',{scope:'./'});
        if(reg.waiting)showStatus('V2.70 離線核心已就緒');
        reg.addEventListener('updatefound',()=>{
          const sw=reg.installing;if(!sw)return;
          sw.addEventListener('statechange',()=>{if(sw.state==='installed'&&navigator.serviceWorker.controller)showStatus('V2.70 已更新，重新載入即可套用');});
        });
      }catch(err){console.warn('PWA registration failed',err);}
    });
  }
  if(navigator.storage?.persist){navigator.storage.persist().catch(()=>{});}
})();
