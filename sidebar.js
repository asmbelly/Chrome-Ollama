const BASE = 'http://localhost:11434';

const out     = document.getElementById('output');
const inp     = document.getElementById('inp');
const sbtn    = document.getElementById('sbtn');
const palette = document.getElementById('palette');
const badge   = document.getElementById('model-badge');

let model      = null;
let models     = [];
let streaming  = false;
let palMode    = null; // 'cmds' | 'models'
let palIdx     = 0;
let inputHist  = [];
let histPos    = -1;
let convo      = [];

const CMDS = [
  { name: '/model',  desc: 'Switch active model',       fn: openModelPicker },
  { name: '/models', desc: 'List installed models',     fn: listModels      },
  { name: '/clear',  desc: 'Clear terminal',            fn: clearTerm       },
  { name: '/new',    desc: 'New conversation',          fn: newConvo        },
  { name: '/help',   desc: 'Show commands',             fn: showHelp        },
];

// ── BOOT ──────────────────────────────────────────────────────────────────────
async function boot() {
  line('', 'blank');
  line('  OLLAMA TERMINAL', 'info');
  line('  local models · no cloud · type / for commands', 'system');
  line('', 'blank');
  await loadModels();
}

async function loadModels() {
  try {
    const r = await fetch(`${BASE}/api/tags`);
    const d = await r.json();
    models = d.models || [];
    if (!models.length) { line('⚠ no models found — run: ollama pull llama3', 'error'); return; }
    const saved = await get('ollama_model');
    model = models.find(m => m.name === saved) ? saved : models[0].name;
    await set('ollama_model', model);
    updateBadge();
    line(`✓ ollama connected · ${models.length} model(s)`, 'info');
    line(`✓ active: ${model}`, 'info');
    line('', 'blank');
  } catch {
    line('✗ cannot reach ollama — run: ollama serve', 'error');
    badge.textContent = '✗ offline';
  }
}

function updateBadge() {
  badge.textContent = `▸ ${model ? model.split(':')[0] : '---'}`;
}

// ── OUTPUT ────────────────────────────────────────────────────────────────────
function line(text, cls = 'ai') {
  const d = document.createElement('div');
  d.className = `line ${cls}`;
  d.textContent = text;
  out.appendChild(d);
  out.scrollTop = out.scrollHeight;
  return d;
}

function clearTerm() {
  out.innerHTML = '';
  line('cleared.', 'system');
  closePal();
}

function newConvo() {
  convo = [];
  clearTerm();
  line('new conversation.', 'system');
}

function showHelp() {
  closePal();
  line('', 'blank');
  line('commands:', 'info');
  CMDS.forEach(c => line(`  ${c.name.padEnd(10)} ${c.desc}`, 'system'));
  line('', 'blank');
}

function listModels() {
  closePal();
  line('', 'blank');
  line('installed models:', 'info');
  models.forEach(m => {
    const active = m.name === model ? ' ●' : '';
    const size   = m.size ? ` · ${(m.size/1e9).toFixed(1)}GB` : '';
    line(`  ${m.name}${active}${size}`, m.name === model ? 'info' : 'system');
  });
  line('', 'blank');
}

// ── PALETTE ───────────────────────────────────────────────────────────────────
function openModelPicker() {
  palMode = 'models'; palIdx = 0; renderPal();
}

function renderPal() {
  palette.innerHTML = '';
  const hdr = document.createElement('div');

  if (palMode === 'cmds') {
    const filter = inp.value.slice(1).toLowerCase();
    const items  = CMDS.filter(c => c.name.includes('/'+filter) || c.desc.toLowerCase().includes(filter));
    hdr.className = 'pal-header';
    hdr.textContent = 'commands · ↑↓ navigate · enter select · esc close';
    palette.appendChild(hdr);
    palIdx = Math.min(palIdx, items.length - 1);
    items.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = `pal-item${i === palIdx ? ' sel' : ''}`;
      el.innerHTML = `<span class="pname">${c.name}</span><span class="pdesc">${c.desc}</span>`;
      el.onclick = () => { c.fn(); inp.value = ''; };
      palette.appendChild(el);
    });
    palette._items = items;

  } else {
    hdr.className = 'pal-header';
    hdr.textContent = 'select model · ↑↓ navigate · enter select · esc close';
    palette.appendChild(hdr);
    palIdx = Math.min(palIdx, models.length - 1);
    models.forEach((m, i) => {
      const el = document.createElement('div');
      el.className = `pal-item${i === palIdx ? ' sel' : ''}${m.name === model ? ' active' : ''}`;
      const size = m.size ? `${(m.size/1e9).toFixed(1)}GB` : '';
      el.innerHTML = `<span class="pname amber">${m.name}</span><span class="pdesc">${size}</span>`;
      el.onclick = () => pickModel(m.name);
      palette.appendChild(el);
    });
    palette._items = models;
  }

  palette.classList.add('open');
}

function closePal() {
  palette.classList.remove('open');
  palette.innerHTML = '';
  palMode = null; palIdx = 0;
}

function pickModel(name) {
  model = name;
  set('ollama_model', name);
  updateBadge();
  line('', 'blank');
  line(`switched to ${name}`, 'info');
  line('', 'blank');
  closePal();
  inp.value = '';
  inp.focus();
}

// ── INPUT ─────────────────────────────────────────────────────────────────────
inp.addEventListener('input', () => {
  const v = inp.value;
  if (v === '/') { palMode = 'cmds'; palIdx = 0; renderPal(); return; }
  if (v.startsWith('/') && palMode === 'cmds') { palIdx = 0; renderPal(); return; }
  if (!v.startsWith('/') && palMode === 'cmds') closePal();
});

inp.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closePal(); inp.value = ''; return; }

  if (palette.classList.contains('open')) {
    const items = palette._items || [];
    if (e.key === 'ArrowDown') { e.preventDefault(); palIdx = Math.min(palIdx+1, items.length-1); renderPal(); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); palIdx = Math.max(palIdx-1, 0); renderPal(); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (palMode === 'models') pickModel(items[palIdx].name);
      else { items[palIdx]?.fn(); inp.value = ''; }
      return;
    }
  } else {
    if (e.key === 'ArrowUp')   { e.preventDefault(); histPos = Math.min(histPos+1, inputHist.length-1); inp.value = inputHist[inputHist.length-1-histPos] ?? ''; return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); histPos = Math.max(histPos-1,-1); inp.value = histPos === -1 ? '' : inputHist[inputHist.length-1-histPos]; return; }
  }

  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
});

sbtn.onclick = submit;
badge.onclick = openModelPicker;

async function submit() {
  const text = inp.value.trim();
  if (!text || streaming) return;

  if (text.startsWith('/')) {
    const cmd = CMDS.find(c => c.name === text.split(' ')[0]);
    if (cmd) { inp.value = ''; closePal(); cmd.fn(); return; }
  }

  if (!model) { line('✗ no model — try /model', 'error'); return; }

  inputHist.push(text); histPos = -1;
  inp.value = ''; closePal();

  line('', 'blank');
  line(`❯ ${text}`, 'user');
  line('', 'blank');

  await chat(text);
}

// ── CHAT ──────────────────────────────────────────────────────────────────────
async function chat(msg) {
  streaming = true; inp.disabled = true; sbtn.disabled = true;
  convo.push({ role: 'user', content: msg });

  const think = document.createElement('div');
  think.className = 'line thinking';
  think.innerHTML = 'thinking<span>.</span><span>.</span><span>.</span>';
  out.appendChild(think);
  out.scrollTop = out.scrollHeight;

  const resp = document.createElement('div');
  resp.className = 'line ai';
  let full = '';

  try {
    const r = await fetch(`${BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: convo, stream: true }),
    });

    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    think.remove();
    out.appendChild(resp);

    const reader  = r.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const ln of decoder.decode(value, { stream: true }).split('\n').filter(Boolean)) {
        try {
          const j = JSON.parse(ln);
          if (j.message?.content) { full += j.message.content; resp.textContent = full; out.scrollTop = out.scrollHeight; }
        } catch {}
      }
    }

    convo.push({ role: 'assistant', content: full });
    line('', 'blank');

  } catch (err) {
    think.remove();
    line(`✗ ${err.message}`, 'error');
    line('  is ollama running? → ollama serve', 'system');
    line('', 'blank');
  } finally {
    streaming = false; inp.disabled = false; sbtn.disabled = false; inp.focus();
  }
}

// ── STORAGE ───────────────────────────────────────────────────────────────────
const get = k => new Promise(r => chrome.storage.local.get([k], d => r(d[k] ?? null)));
const set = (k,v) => new Promise(r => chrome.storage.local.set({ [k]: v }, r));

boot();
inp.focus();
