import express, { Request, Response } from 'express';

const app = express();

app.use(express.json());

// Interfaz HTML principal de la Super App
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
    <body class="bg-gray-100 font-sans pb-20">
      <!-- Navbar / Header -->
      <header class="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div class="flex justify-between items-center max-w-md mx-auto">
          <h1 class="text-xl font-bold tracking-wider text-amber-400">P&M ECOSISTEMA</h1>
          <div class="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 text-xs">
            🟢 En línea
          </div>
        </div>
      </header>

      <main class="max-w-md mx-auto p-4 space-y-6">
        <!-- Billetera / Escrow Balance -->
        <section class="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-lg border border-slate-700">
          <p class="text-xs text-gray-400 uppercase tracking-widest font-semibold">Billetera Digital Escrow</p>
          <div class="flex justify-between items-baseline mt-2">
            <span class="text-3xl font-extrabold">$ 0,00</span>
            <span class="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">Protegido</span>
          </div>
          <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-700/50">
            <button class="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-xl text-sm transition">Cargar Saldo</button>
            <button class="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-xl text-sm transition">Retirar</button>
          </div>
        </section>

        <!-- Accesos Rápidos de Servicios -->
        <section>
          <h2 class="text-sm font-bold text-gray-700 uppercase mb-3 tracking-wide">Servicios Principales</h2>
          <div class="grid grid-cols-2 gap-4">
            <button class="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 text-left hover:border-amber-400 transition">
              <span class="text-2xl">🚚</span>
              <h3 class="font-bold text-slate-900 mt-2">Pedir Flete</h3>
              <p class="text-xs text-gray-500 mt-0.5">Viajes y cargas con pago retenido en custodia.</p>
            </button>
            <button class="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 text-left hover:border-amber-400 transition">
              <span class="text-2xl">🛍️</span>
              <h3 class="font-bold text-slate-900 mt-2">Marketplace</h3>
              <p class="text-xs text-gray-500 mt-0.5">Comprá y vendé productos de forma segura.</p>
            </button>
          </div>
        </section>

        <!-- Feed de Ofertas / Publicaciones Recientes -->
        <section class="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <h2 class="text-sm font-bold text-slate-900 mb-3">Publicaciones Recientes</h2>
          <div class="space-y-3">
            <div class="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
              <div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xl">📦</div>
              <div class="flex-1">
                <h4 class="font-semibold text-sm text-slate-800">Servicio de Flete Urbano</h4>
                <p class="text-xs text-gray-500">Zona Centro • Salida inmediata</p>
              </div>
              <span class="font-bold text-slate-900 text-sm">$15.000</span>
            </div>
          </div>
        </section>
      </main>

      <!-- TabBar Navegación Inferior -->
      <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-50">
        <div class="max-w-md mx-auto flex justify-around text-center text-xs text-gray-500">
          <button class="text-amber-600 font-bold flex flex-col items-center">
            <span class="text-lg">🏠</span>Inicio
          </button>
          <button class="flex flex-col items-center hover:text-slate-900">
            <span class="text-lg">🚚</span>Fletes
          </button>
          <button class="flex flex-col items-center hover:text-slate-900">
            <span class="text-lg">💳</span>Billetera
          </button>
          <button class="flex flex-col items-center hover:text-slate-900">
            <span class="text-lg">👤</span>Perfil
          </button>
        </div>
      </nav>
    </body>
    </html>
  `);
});

export default app;
  
