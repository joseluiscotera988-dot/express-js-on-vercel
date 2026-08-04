let chatInterval = null;

async function loadChatMessages(auctionId) {
  try {
    const res = await fetch('/api/chat/' + auctionId);
    const data = await res.json();
    if (data.success) {
      const box = document.getElementById('chat-messages-box');
      if (!box) return;
      if (data.messages.length === 0) {
        box.innerHTML = '<p class="text-slate-500 text-[10px] text-center">Canal encriptado abierto. Negociación segura.</p>';
      } else {
        box.innerHTML = data.messages.map(m => `
          <div class="p-2 rounded-lg ${m.sender === (currentUser ? currentUser.name : 'Usuario') ? 'bg-amber-500/20 text-amber-200 text-right ml-6' : 'bg-slate-800 text-slate-200 mr-6'}">
            <p class="text-[9px] opacity-75 font-bold">${m.sender}</p>
            <p class="text-xs">${m.text}</p>
          </div>
        `).join('');
        box.scrollTop = box.scrollHeight;
      }
    }
  } catch (e) {
    console.error('Error cargando chat:', e);
  }
}

function startChatPolling(auctionId) {
  loadChatMessages(auctionId);
  if (chatInterval) clearInterval(chatInterval);
  chatInterval = setInterval(() => loadChatMessages(auctionId), 3000);
}

async function sendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input-text');
  const text = input.value.trim();
  if (!text) return;

  const senderName = currentUser ? currentUser.name : 'Invitado';

  try {
    const res = await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auctionId: 'auc_101', sender: senderName, text: text })
    });
    const data = await res.json();
    if (data.success) {
      input.value = '';
      loadChatMessages('auc_101');
    }
  } catch (err) {
    alert('❌ Error enviando mensaje');
  }
}

