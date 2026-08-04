// P&M Ecosistema - Subastas, Billetera y Módulos
function switchView(viewName) {
  const views = ['home', 'fletes', 'wallet', 'profile'];
  
  views.forEach(v => {
    const el = document.getElementById('view-' + v);
    if (el) el.classList.add('hidden');
    
    const navBtn = document.getElementById('nav-' + v);
    if (navBtn) {
      navBtn.classList.remove('text-amber-400', 'font-bold');
      navBtn.classList.add('text-slate-400');
    }
  });

  const selectedView = document.getElementById('view-' + viewName);
  const selectedNav = document.getElementById('nav-' + viewName);

  if (selectedView) selectedView.classList.remove('hidden');
  if (selectedNav) {
    selectedNav.classList.add('text-amber-400', 'font-bold');
    selectedNav.classList.remove('text-slate-400');
  }
}

function handleCreateAuction(e) {
  e.preventDefault();
  const origen = document.getElementById('flete-origen').value;
  const destino = document.getElementById('flete-destino').value;
  const monto = document.getElementById('flete-monto').value;

  alert('🚀 Subasta de flete publicada en tiempo real:\nOrigen: ' + origen + '\nDestino: ' + destino + '\nMonto: $' + monto + '\n\nCustodia Escrow del 5% activada.');
  switchView('home');
        }

