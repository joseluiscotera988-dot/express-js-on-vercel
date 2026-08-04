async function loadAdBanners() {
  try {
    const res = await fetch('/api/ads');
    const data = await res.json();
    if (data.success && data.ads.length > 0) {
      const bannerContainer = document.getElementById('ad-banner-container');
      if (!bannerContainer) return;
      
      const topAd = data.ads[0];
      bannerContainer.innerHTML = `
        <div class="glass-card rounded-2xl p-4 relative overflow-hidden border-amber-500/30">
          <div class="absolute top-0 right-0 bg-amber-500 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-bl-lg tracking-wider uppercase">PROMO ADS</div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <i class="fa-solid fa-bullhorn text-lg"></i>
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-100">${topAd.title}</h4>
              <p class="text-[11px] text-slate-400">${topAd.subtitle}</p>
            </div>
          </div>
        </div>
      `;
    }
  } catch (e) {
    console.error('Error cargando anuncios:', e);
  }
}

async function createNewAdBanner(title, subtitle, link) {
  try {
    const res = await fetch('/api/ads/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subtitle, link })
    });
    const data = await res.json();
    if (data.success) {
      alert('🎉 Anuncio publicado. Recaudación asignada 100% a CBU Maestro.');
      loadAdBanners();
    }
  } catch (e) {
    alert('❌ Error creando anuncio');
  }
                }

