import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// CONFIGURACIÓN CONFIDENCIAL CUENTA MAESTRA
const MASTER_ACCOUNT = {
  cbu: '0000003100077621570425',
  commissionRate: 0.05, // 5%
  adminKey: 'PM_ROOT_MASTER_2026'
};

app.get('/', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pase Y Mire - Ecosistema P&M</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-slate-100 font-sans pb-24 min-h-screen">

      <!-- HEADER CENTRAL -->
      <header class="bg-slate-950/90 backdrop-blur-md p-4 sticky top-0 z-40 border-b border-slate-800">
        <div class="flex justify-between items-center max-w-md mx-auto">
          <div class="flex items-center gap-2">
            <span class="text-2xl">⚡</span>
            <h1 class="text-lg font-bold tracking-wider text-amber-400">PASE Y MIRE</h1>
          </div>
          <div id="user-badge" onclick="openAuthModal()" class="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 text-xs flex items-center gap-2 cursor-pointer transition">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span id="user-badge-text" class="font-medium text-slate-200">Invitado (Ingresar)</span>
          </div>
        </div>
      </header>

      <main class="max-w-md mx-auto p-4 space-y-6">

        <!-- INICIO (PÚBLICO CON PUBLICACIONES & BANNERS) -->
        <div id="view-home" class="space-y-5">
          
          <!-- BANNER PUBLICIDAD MONETIZADO -->
          <div class="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
            <span class="text-[10px] uppercase font-bold text-amber-400 tracking-widest bg-amber-500/20 px-2 py-0.5 rounded-full">Espacio Promocionado</span>
            <p class="text-sm font-bold text-slate-100 mt-1">Anunciá tu comercio o flota de fletes acá</p>
            <p class="text-xs text-slate-400">Llegá a miles de usuarios en tu zona al instante.</p>
          </div>

          <!-- RESUMEN BILLETERA CUSTODIA -->
          <section class="bg-gradient-to-br from-slate-800 to-slate-950 p-5 rounded-2xl shadow-xl border border-slate-800 relative">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs text-slate-400 uppercase tracking-widest font-bold">Billetera Digital (Escrow)</span>
              <span class="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">Garantía Activa</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span id="home-balance" class="text-3xl font-extrabold text-white">$ 0,00</span>
              <span class="text-xs text-slate-400">Fondos Protegidos</span>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800">
              <button onclick="protectedAction('wallet')" class="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-xl text-xs transition">Cargar Saldo</button>
              <button onclick="protectedAction('wallet')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded-xl text-xs transition border border-slate-700">Retirar</button>
            </div>
          </section>

          <!-- SERVICIOS DEL SISTEMA NERVIOSO -->
          <section class="grid grid-cols-2 gap-3">
            <button onclick="protectedAction('fletes')" class="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 text-left hover:border-amber-400/50 transition">
              <span class="text-2xl">🚚</span>
              <h3 class="font-bold text-slate-100 text-sm mt-2">Subasta Fletes</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Cotizaciones abiertas y geofencing GPS.</p>
            </button>
            <button onclick="protectedAction('marketplace')" class="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 text-left hover:border-amber-400/50 transition">
              <span class="text-2xl">🛍️</span>
              <h3 class="font-bold text-slate-100 text-sm mt-2">Marketplace</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Comercio seguro con retiro o envío.</p>
            </button>
            <button onclick="protectedAction('cadetes')" class="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 text-left hover:border-amber-400/50 transition">
              <span class="text-2xl">🛵</span>
              <h3 class="font-bold text-slate-100 text-sm mt-2">Cadetería Rapida</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Envíos urbanos inmediatos.</p>
            </button>
            <button onclick="protectedAction('qr')" class="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 text-left hover:border-amber-400/50 transition">
              <span class="text-2xl">📱</span>
              <h3 class="font-bold text-slate-100 text-sm mt-2">Motor QR</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Pagos y check-in al instante.</p>
            </button>
          </section>

          <!-- FEED DE OFERTAS EN VIVO -->
          <section class="bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
            <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Subastas y Ofertas Activas</h2>
            <div id="live-feed" class="space-y-2">
              <div class="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700/50">
                <div class="flex items-center gap-3">
                  <span class="text-xl">📦</span>
                  <div>
                    <h4 class="text-xs font-bold text-slate-200">Flete San Pedro ➔ Rosario</h4>
                    <p class="text-[10px] text-slate-400">Subasta Abierta • Custodia Escrow 5%</p>
                  </div>
                </div>
                <button onclick="protectedAction('fletes')" class="text-xs bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg">Ver / Ofertar</button>
              </div>
            </div>
          </section>

        </div>

        <!-- FLETES Y SUBASTAS (PROTEGIDO) -->
        <div id="view-fletes" class="hidden space-y-5">
          <section class="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 space-y-4">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span>🚚</span> Solicitud de Flete (Subasta con Custodia)
            </h2>
            <form onsubmit="handleCreateAuction(event)" class="space-y-3">
              <div>
                <label class="text-xs text-slate-400 font-semibold">Origen</label>
                <input id="flete-origen" type="text" placeholder="Ej: San Pedro" class="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200" required />
              </div>
              <div>
                <label class="text-xs text-slate-400 font-semibold">Destino</label>
                <input id="flete-destino" type="text" placeholder="Ej: Baradero / Rosario" class="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200" required />
              </div>
              <div>
                <label class="text-xs text-slate-400 font-semibold">Tipo de Carga / Vehículo</label>
                <select id="flete-vehiculo" class="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200">
                  <option>Camioneta Chicá (hasta 500kg)</option>
                  <option>Furgón Utilitario</option>
                  <option>Camión Mediano (3000kg)</option>
                  <option>Chasis / Acoplado</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-slate-400 font-semibold">Monto Estimado u Ofrecido ($)</label>
                <input id="flete-monto" type="number" placeholder="25000" class="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200" required />
              </div>
              <button type="submit" class="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-xs shadow-lg transition">
                Lanzar a Subasta Abierta 🚀
              </button>
            </form>
          </section>
        </div>

        <!-- BILLETERA / TARJETA VIRTUAL (PROTEGIDO) -->
        <div id="view-wallet" class="hidden space-y-5">
          <section class="bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-950/40 p-5 rounded-2xl border border-amber-500/30 relative">
            <div class="flex justify-between items-start mb-6">
              <div>
                <p class="text-[10px] text-amber-400 font-mono tracking-widest uppercase">Tarjeta Virtual Escrow</p>
                <h3 class="text-base font-bold text-white mt-0.5">P&M Pay Master</h3>
              </div>
              <span class="text-xl font-black italic text-amber-400 tracking-tighter">P&M</span>
            </div>
            <div class="space-y-1 mb-4">
              <p class="text-[10px] text-slate-400">Titular de la Cuenta</p>
              <p id="card-holder" class="font-mono text-xs tracking-wider uppercase text-slate-200">TITULAR</p>
            </div>
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>ESTADO: VERIFICADO 🟢</span>
              <span>PROTECCIÓN 100%</span>
            </div>
          </section>
        </div>

        <!-- SUPER-PERFIL (PROTEGIDO) -->
        <div id="view-profile" class="hidden space-y-5">
          <section class="bg-slate-800 p-5 rounded-2xl border border-slate-700 text-center">
            <div id="profile-avatar" class="w-16 h-16 bg-slate-900 text-amber-400 rounded-full flex items-center justify-center text-xl font-bold mx-auto border-2 border-amber-400 shadow-md mb-3">
              PM
            </div>
            <h3 id="profile-name" class="font-bold text-slate-100 text-base">Usuario</h3>
            <p id="profile-role" class="text-xs text-amber-400/90 font-medium">Rol Verificado</p>
            
            <div id="admin-badge" class="hidden mt-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs py-1 px-3 rounded-full font-bold inline-block">
              👑 Cuenta Maestra / Root Admin
            </div>

            <div class="mt-4 pt-4 border-t border-slate-700/80 grid grid-cols-3 gap-2 text-center">
              <div>
                <span class="block text-sm font-extrabold text-slate-100">5.0 ★</span>
                <span class="text-[9px] text-slate-400 uppercase">Reputación</span>
              </div>
              <div>
                <span class="block text-sm font-extrabold text-emerald-400">KYC</span>
                <span class="text-[9px] text-slate-400 uppercase">Biometría</span>
              </div>
              <div>
                <span class="block text-sm font-extrabold text-amber-400">5%</span>
                <span class="text-[9px] text-slate-400 uppercase">Comisión</span>
              </div>
            </div>

            <button onclick="logout()" class="mt-5 text-xs text-red-400 border border-red-500/30 px-4 py-1.5 rounded-xl hover:bg-red-500/10">
              Cerrar Sesión
            </button>
          </section>
        </div>

      </main>

      <!-- MODAL DE REGISTRO / AUTENTICACIÓN -->
      <div id="auth-modal" class="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 hidden backdrop-blur-md">
        <div class="bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-800 space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-base font-bold text-white">Registro / Acceso P&M</h3>
            <button onclick="closeAuthModal()" class="text-slate-400 text-xl font-bold">×</button>
          </div>
          <p class="text-xs text-slate-400">Registrate con tus datos reales para operar fletes, subastas y custodia de dinero.</p>
          
          <form onsubmit="handleRegister(event)" class="space-y-3">
            <div>
              <label class="text-xs text-slate-400 font-semibold">Nombre Completo</label>
              <input id="reg-name" type="text" placeholder="Juan Pérez" class="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
            </div>
            <div>
              <label class="text-xs text-slate-400 font-semibold">Teléfono / WhatsApp</label>
              <input id="reg-phone" type="tel" placeholder="+54 9 ..." class="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
            </div>
            <div>
              <label class="text-xs text-slate-400 font-semibold">Rol de Usuario</label>
              <select id="reg-role" class="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
                <option value="Cliente / Comprador">Cliente / Comprador</option>
                <option value="Transportista / Flete">Transportista / Flete</option>
                <option value="Comerciante">Comerciante / Marketplace</option>
                <option value="Cadete">Cadete Urbano</option>
                <option value="ADMIN_ROOT">👑 Activar Cuenta Maestra</option>
              </select>
            </div>
            <button type="submit" class="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-xs shadow-lg transition mt-2">
              Ingresar al Ecosistema 🚀
            </button>
          </form>
        </div>
      </div>

      <!-- TABBAR NAVEGACIÓN INFERIOR -->
      <nav class="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 p-2 z-30">
        <div class="max-w-md mx-auto flex justify-around text-center text-xs text-slate-400">
          <button id="nav-home" onclick="switchView('home')" class="text-amber-400 font-bold flex flex-col items-center">
            <span class="text-lg">🏠</span>Inicio
          </button>
          <button id="nav-fletes" onclick="protectedAction('fletes')" class="flex flex-col items-center hover:text-slate-200">
            <span class="text-lg">🚚</span>Subastas
          </button>
          <button id="nav-wallet" onclick="protectedAction('wallet')" class="flex flex-col items-center hover:text-slate-200">
            <span class="text-lg">💳</span>Billetera
          </button>
          <button id="nav-profile" onclick="protectedAction('profile')" class="flex flex-col items-center hover:text-slate-200">
            <span class="text-lg">👤</span>Perfil
          </button>
        </div>
      </nav>

      <script>
        let currentUser = JSON.parse(localStorage.getItem('pm_user')) || null;

        function updateUI() {
          if (currentUser) {
            document.getElementById('user-badge-text').innerText = currentUser.name.split(' ')[0] + ' 🟢';
            document.getElementById('card-holder').innerText = currentUser.name;
            document.getElementById('profile-name').innerText = currentUser.name;
            document.getElementById('profile-role').innerText = currentUser.role;
            document.getElementById('profile-avatar').innerText = currentUser.name.substring(0,2).toUpperCase();
            
            if(currentUser.role === 'ADMIN_ROOT') {
              document.getElementById('admin-badge').classList.remove('hidden');
            }
          } else {
            document.getElementById('user-badge-text').innerText = 'Invitado (Ingresar)';
          }
        }

        function protectedAction(targetView) {
          if (!currentUser) {
            openAuthModal();
          } else {
            switchView(targetView);
          }
        }

        function switchView(viewName) {
          document.getElementById('view-home').classList.add('hidden');
          document.getElementById('view-fletes').classList.add('hidden');
          document.getElementById('view-wallet').classList.add('hidden');
          document.getElementById('view-profile').classList.add('hidden');

          const navIds = ['nav-home', 'nav-fletes', 'nav-wallet', 'nav-profile'];
          navIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
              btn.classList.remove('text-amber-400', 'font-bold');
              btn.classList.add('text-slate-400');
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

        function openAuthModal() {
          document.getElementById('auth-modal').classList.remove('hidden');
        }

        function closeAuthModal() {
          document.getElementById('auth-modal').classList.add('hidden');
        }

        function handleRegister(e) {
          e.preventDefault();
          const name = document.getElementById('reg-name').value;
          const phone = document.getElementById('reg-phone').value;
          const role = document.getElementById('reg-role').value;

          currentUser = { name, phone, role };
          localStorage.setItem('pm_user', JSON.stringify(currentUser));
          
          updateUI();
          closeAuthModal();
          alert('🎉 ¡Sesión iniciada con éxito! Cuenta activada para operar.');
        }

        function handleCreateAuction(e) {
          e.preventDefault();
          const origen = document.getElementById('flete-origen').value;
          const destino = document.getElementById('flete-destino').value;
          const monto = document.getElementById('flete-monto').value;

          alert('🚀 Flete publicado en Subasta Abierta (Origen: ' + origen + ' ➔ Destino: ' + destino + ' par $' + monto + '). Custodia 5% activa.');
          switchView('home');
        }

        function logout() {
          localStorage.removeItem('pm_user');
          currentUser = null;
          updateUI();
          switchView('home');
        }

        updateUI();
      </script>
    </body>
    </html>
  `);
});

export default app;
  
