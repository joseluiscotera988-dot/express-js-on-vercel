const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// SERVIR LA NUEVA PORTADA / LOGIN
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EscrowGuard - Inicio y Registro</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col justify-between">

  <!-- NAVBAR -->
  <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🛡️</span>
        <span class="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">EscrowGuard</span>
      </div>
      <div id="nav-actions" class="flex gap-3">
        <button onclick="showAuthModal('login')" class="px-4 py-2 text-sm font-medium hover:text-emerald-400 transition">Iniciar Sesión</button>
        <button onclick="showAuthModal('register')" class="px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 rounded-lg text-slate-950 font-semibold transition">Registrarse</button>
      </div>
    </div>
  </header>

  <!-- LANDING PAGE -->
  <main id="landing-view" class="max-w-6xl mx-auto px-4 py-16 flex-grow flex flex-col justify-center items-center text-center">
    <span class="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20 mb-6">Plataforma Segura 100% Automatizada</span>
    <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
      Transacciones sin riesgos entre <br class="hidden sm:inline"/> Compradores y Vendedores
    </h1>
    <p class="text-slate-400 text-lg max-w-2xl mb-8">
      Retenemos los fondos de forma segura hasta que ambas partes confirmen la entrega del producto o servicio.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
      <button onclick="showAuthModal('register')" class="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition">
        Comenzar Ahora Gratis
      </button>
      <button onclick="showAuthModal('login')" class="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition">
        Ingresar a mi Cuenta
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
      <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <div class="text-3xl mb-3">🔒</div>
        <h3 class="text-lg font-bold mb-2">Fondos Protegidos</h3>
        <p class="text-slate-400 text-sm">El dinero queda resguardado hasta la entrega del producto.</p>
      </div>
      <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <div class="text-3xl mb-3">⚖️</div>
        <h3 class="text-lg font-bold mb-2">Gestión de Disputas</h3>
        <p class="text-slate-400 text-sm">Sistema de mediación transparente para resolver diferencias.</p>
      </div>
      <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <div class="text-3xl mb-3">⚡</div>
        <h3 class="text-lg font-bold mb-2">Pagos Inmediatos</h3>
        <p class="text-slate-400 text-sm">Liberación de fondos instantánea tras la conformidad.</p>
      </div>
    </div>
  </main>

  <!-- DASHBOARD -->
  <main id="dashboard-view" class="hidden max-w-4xl mx-auto px-4 py-8 flex-grow w-full">
    <div class="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
      <div>
        <h2 class="text-2xl font-bold">Panel de Control</h2>
        <p id="user-email-display" class="text-slate-400 text-sm">Cargando usuario...</p>
      </div>
      <button onclick="handleLogout()" class="px-4 py-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition">
        Cerrar Sesión
      </button>
    </div>

    <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8">
      <h3 class="text-lg font-bold mb-4 text-emerald-400">Crear Nueva Orden</h3>
      <form id="order-form" class="space-y-4">
        <input type="text" id="buyerId" placeholder="ID Comprador" class="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500" required />
        <input type="text" id="sellerId" placeholder="ID Vendedor" class="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500" required />
        <input type="number" id="amount" placeholder="Monto ($)" class="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500" required />
        <input type="text" id="description" placeholder="Descripción de la orden" class="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500" required />
        <button type="submit" class="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold p-3 rounded-lg transition">Crear Transacción</button>
      </form>
    </div>
  </main>

  <!-- MODAL AUTH -->
  <div id="auth-modal" class="hidden fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full relative shadow-2xl">
      <button onclick="hideAuthModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
      
      <h3 id="modal-title" class="text-xl font-bold mb-2 text-center">Iniciar Sesión</h3>
      <p id="modal-subtitle" class="text-xs text-slate-400 text-center mb-6">Ingresá tus credenciales para continuar</p>

      <form id="auth-form" onsubmit="handleAuthSubmit(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Correo Electrónico</label>
          <input type="email" id="auth-email" class="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm focus:border-emerald-500 focus:outline-none" placeholder="tu@email.com" required />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Contraseña</label>
          <input type="password" id="auth-password" class="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm focus:border-emerald-500 focus:outline-none" placeholder="••••••••" required />
        </div>
        
        <div id="auth-error" class="hidden text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded text-center"></div>
        <div id="auth-success" class="hidden text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-center"></div>

        <button type="submit" id="auth-btn" class="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold p-3 rounded-lg transition">
          Continuar
        </button>
      </form>

      <div class="mt-4 text-center">
        <button id="toggle-auth-mode" onclick="toggleAuthMode()" class="text-xs text-slate-400 hover:text-emerald-400 underline">
          ¿No tenés cuenta? Registrate
        </button>
      </div>
    </div>
  </div>

  <footer class="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
    © 2026 EscrowGuard. Todos los derechos reservados.
  </footer>

  <script>
    const SUPABASE_URL = "${SUPABASE_URL}";
    const SUPABASE_KEY = "${SUPABASE_KEY}";
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let currentAuthMode = 'login';

    document.addEventListener("DOMContentLoaded", async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      updateUI(session);

      supabaseClient.auth.onAuthStateChange((_event, session) => {
        updateUI(session);
      });
    });

    function updateUI(session) {
      const landing = document.getElementById('landing-view');
      const dashboard = document.getElementById('dashboard-view');
      const navActions = document.getElementById('nav-actions');

      if (session) {
        landing.classList.add('hidden');
        dashboard.classList.remove('hidden');
        document.getElementById('user-email-display').innerText = \`Sesión iniciada como: \${session.user.email}\`;
        navActions.classList.add('hidden');
      } else {
        landing.classList.remove('hidden');
        dashboard.classList.add('hidden');
        navActions.classList.remove('hidden');
      }
    }

    function showAuthModal(mode) {
      currentAuthMode = mode;
      document.getElementById('auth-modal').classList.remove('hidden');
      document.getElementById('auth-error').classList.add('hidden');
      document.getElementById('auth-success').classList.add('hidden');

      if (mode === 'login') {
        document.getElementById('modal-title').innerText = 'Iniciar Sesión';
        document.getElementById('modal-subtitle').innerText = 'Ingresá a tu cuenta de EscrowGuard';
        document.getElementById('auth-btn').innerText = 'Entrar';
        document.getElementById('toggle-auth-mode').innerText = '¿No tenés cuenta? Registrate';
      } else {
        document.getElementById('modal-title').innerText = 'Crear Cuenta';
        document.getElementById('modal-subtitle').innerText = 'Registrate gratis en pocos segundos';
        document.getElementById('auth-btn').innerText = 'Registrarme';
        document.getElementById('toggle-auth-mode').innerText = '¿Ya tenés cuenta? Iniciá sesión';
      }
    }

    function hideAuthModal() {
      document.getElementById('auth-modal').classList.add('hidden');
    }

    function toggleAuthMode() {
      showAuthModal(currentAuthMode === 'login' ? 'register' : 'login');
    }

    async function handleAuthSubmit(event) {
      event.preventDefault();
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const errorDiv = document.getElementById('auth-error');
      const successDiv = document.getElementById('auth-success');

      errorDiv.classList.add('hidden');
      successDiv.classList.add('hidden');

      if (currentAuthMode === 'login') {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
          errorDiv.innerText = error.message;
          errorDiv.classList.remove('hidden');
        } else {
          hideAuthModal();
        }
      } else {
        const { error } = await supabaseClient.auth.signUp({ email, password });
        if (error) {
          errorDiv.innerText = error.message;
          errorDiv.classList.remove('hidden');
        } else {
          successDiv.innerText = "¡Registro exitoso! Ya podés iniciar sesión.";
          successDiv.classList.remove('hidden');
        }
      }
    }

    async function handleLogout() {
      await supabaseClient.auth.signOut();
    }
  </script>
</body>
</html>
  `);
});

module.exports = app;
      
