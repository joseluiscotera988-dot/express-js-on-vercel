import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>P&M Ecosistema</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 font-sans pb-24 min-h-screen">
      <!-- Navbar / Header -->
      <header class="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div class="flex justify-between items-center max-w-md mx-auto">
          <h1 class="text-xl font-bold tracking-wider text-amber-400">P&M ECOSISTEMA</h1>
          <div class="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 text-xs flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            En línea
          </div>
        </div>
      </header>

      <main class="max-w-md mx-auto p-4 space-y-6">

        <!-- SECCIÓN 1: INICIO -->
        <div id="view-home" class="space-y-6">
          <!-- Billetera / Escrow Balance -->
          <section class="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-lg border border-slate-700">
            <p class="text-xs text-gray-400 uppercase tracking-widest font-semibold">Billetera Digital Escrow</p>
            <div class="flex justify-between items-baseline mt-2">
              <span class="text-3xl font-extrabold">$ 0,00</span>
              <span class="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">Protegido</span>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-700/50">
              <button onclick="switchView('wallet')" class="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-xl text-sm transition">Cargar Saldo</button>
              <button onclick="switchView('wallet')" class="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-xl text-sm transition">Retirar</button>
            </div>
          </section>

          <!-- Accesos Rápidos de Servicios -->
          <section>
            <h2 class="text-sm font-bold text-gray-700 uppercase mb-3 tracking-wide">Servicios Principales</h2>
            <div class="grid grid-cols-2 gap-4">
              <button onclick="switchView('fletes')" class="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 text-left hover:border-amber-400 transition">
                <span class="text-2xl">🚚</span>
                <h3 class="font-bold text-slate-900 mt-2">Pedir Flete</h3>
                <p class="text-xs text-gray-500 mt-0.5">Viajes y cargas con pago retenido en custodia.</p>
              </button>
              <button onclick="switchView('marketplace')" class="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 text-left hover:border-amber-400 transition">
                <span class="text-2xl">🛍️</span>
                <h3 class="font-bold text-slate-900 mt-2">Marketplace</h3>
                <p class="text-xs text-gray-500 mt-0.5">Comprá y vendé productos de forma segura.</p>
              </button>
            </div>
          </section>
        </div>

        <!-- SECCIÓN 2: FLETES Y SUBASTA -->
        <div id="view-fletes" class="hidden space-y-6">
          <section class="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h2 class="text-lg font-bold text-slate-900 mb-1">Solicitar Flete (Escrow GPS)</h2>
            <p class="text-xs text-gray-500 mb-4">Ingresá los datos de tu carga para recibir ofertas de transporte.</p>
            
            <form id="flete-form" onsubmit="handleFleteSubmit(event)" class="space-y-3">
              <div>
                <label class="text-xs font-semibold text-gray-600">Origen</label>
                <input type="text" placeholder="Ej: San Pedro, Bs. As." class="w-full mt-1 p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-amber-500" required />
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-600">Destino</label>
                <input type="text" placeholder="Ej: Rosario, Santa Fe" class="w-full mt-1 p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-amber-500" required />
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-600">Tipo de Vehículo Requerido</label>
                <select class="w-full mt-1 p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-amber-500">
                  <option>Camioneta Chicá (hasta 500kg)</option>
                  <option>Camión mediano (hasta 3000kg)</option>
                  <option>Furgón / Utilitario</option>
                  <option>Chasis / Acoplado</option>
                </select>
              </div>
              <button type="submit" class="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-sm shadow-md transition mt-2">
                Publicar en Subasta Abierta 🚀
              </button>
            </form>
          </section>
        </div>

        <!-- SECCIÓN 3: BILLETERA / TARJETA VIRTUAL -->
        <div id="view-wallet" class="hidden space-y-6">
          <!-- Tarjeta Virtual -->
          <section class="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 text-white p-5 rounded-2xl shadow-xl border border-amber-500/30 relative overflow-hidden">
            <div class="flex justify-between items-start mb-6">
              <div>
                <p class="text-xs text-amber-400 font-mono tracking-widest uppercase">Tarjeta Virtual Escrow</p>
                <h3 class="text-lg font-bold mt-1">P&M Pay Card</h3>
              </div>
              <span class="text-2xl font-black italic text-amber-400">P&M</span>
            </div>
            <div class="space-y-1 mb-4">
              <p class="text-xs text-gray-400">Número de Tarjeta</p>
              <p class="font-mono text-lg tracking-wider">•••• •••• •••• 9880</p>
            </div>
            <div class="flex justify-between items-center text-xs text-gray-300 font-mono">
              <span>EXP: 12/28</span>
              <span>CVC: •••</span>
            </div>
          </section>

          <!-- Motor QR -->
          <div class="grid grid-cols-2 gap-3">
            <button class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center hover:bg-amber-50 transition">
              <span class="text-2xl block mb-1">📱</span>
              <span class="text-xs font-bold text-slate-800">Escanear QR</span>
            </button>
            <button class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center hover:bg-amber-50 transition">
              <span class="text-2xl block mb-1">💳</span>
              <span class="text-xs font-bold text-slate-800">Cobrar con QR</span>
            </button>
          </div>
        </div>

        <!-- SECCIÓN 4: SUPER-PERFIL -->
        <div id="view-profile" class="hidden space-y-6">
          <section class="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 text-center">
            <div class="w-20 h-20 bg-slate-900 text-amber-400 rounded-full flex items-center justify-center text-2xl font-bold mx-auto border-2 border-amber-400 shadow-md mb-3">
              PM
            </div>
            <h3 class="font-bold text-slate-900 text-lg">Usuario P&M</h3>
            <p class="text-xs text-gray-500">Transportista & Comerciante Verificado</p>

            <div class="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <span class="block text-base font-extrabold text-slate-900">4.9 ★</span>
                <span class="text-[10px] text-gray-500 uppercase">Calificación</span>
              </div>
              <div>
                <span class="block text-base font-extrabold text-emerald-600">100%</span>
                <span class="text-[10px] text-gray-500 uppercase">Verificado</span>
              </div>
              <div>
                <span class="block text-base font-extrabold text-slate-900">24</span>
                <span class="text-[10px] text-gray-500 uppercase">Viajes</span>
              </div>
            </div>
          </section>

          <section class="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-2">
            <button class="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-gray-50 flex justify-between items-center">
              🔒 Verificación Biométrica (KYC)
              <span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-normal">Activa</span>
            </button>
            <button class="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-gray-50 flex justify-between items-center">
              📜 Historial de Trayectoria
              <span class="text-xs text-gray-400">›</span>
            </button>
          </section>
        </div>

      </main>

      <!-- TabBar Navegación Inferior -->
      <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-50">
        <div class="max-w-md mx-auto flex justify-around text-center text-xs text-gray-500">
          <button id="nav-home" onclick="switchView('home')" class="text-amber-600 font-bold flex flex-col items-center">
            <span class="text-lg">🏠</span>Inicio
          </button>
          <button id="nav-fletes" onclick="switchView('fletes')" class="flex flex-col items-center hover:text-slate-900">
            <span class="text-lg">🚚</span>Fletes
          </button>
          <button id="nav-wallet" onclick="switchView('wallet')" class="flex flex-col items-center hover:text-slate-900">
            <span class="text-lg">💳</span>Billetera
          </button>
          <button id="nav-profile" onclick="switchView('profile')" class="flex flex-col items-center hover:text-slate-900">
            <span class="text-lg">👤</span>Perfil
          </button>
        </div>
      </nav>

      <script>
        function switchView(viewName) {
          // Ocultar todas las vistas
          document.getElementById('view-home').classList.add('hidden');
          document.getElementById('view-fletes').classList.add('hidden');
          document.getElementById('view-wallet').classList.add('hidden');
          document.getElementById('view-profile').classList.add('hidden');

          // Desmarcar todos los botones
          const navIds = ['nav-home', 'nav-fletes', 'nav-wallet', 'nav-profile'];
          navIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
              btn.classList.remove('text-amber-600', 'font-bold');
              btn.classList.add('text-gray-500');
            }
          });

          // Mostrar vista seleccionada y marcar botón
          const selectedView = document.getElementById('view-' + viewName);
          const selectedNav = document.getElementById('nav-' + viewName);

          if (selectedView) selectedView.classList.remove('hidden');
          if (selectedNav) {
            selectedNav.classList.add('text-amber-600', 'font-bold');
            selectedNav.classList.remove('text-gray-500');
          }
        }

        function handleFleteSubmit(e) {
          e.preventDefault();
          alert('🚀 ¡Flete publicado en la subasta abierta! Los transportistas cercanos comenzarán a cotizar.');
        }
      </script>
    </body>
    </html>
  `);
});

export default app;
           
