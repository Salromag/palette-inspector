const statusEl = document.getElementById('status');
const paletteEl = document.getElementById('palette');
const summaryEl = document.getElementById('summary');
const formatSelect = document.getElementById('formatSelect');
const analyzeBtn = document.getElementById('analyzeBtn');

analyzeBtn.addEventListener('click', async () => {
  setStatus('Inyectando script y analizando…');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('Unable to find active tab.');
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['contentScript.js']
    });

    const result = await sendMessage(tab.id, { type: 'COLLECT_COLORS' });
    if (!result || !result.colors) throw new Error('No response from the page.');

    renderSummary(result);
    renderPalette(result.colors);
    setStatus('Ready');
  } catch (err) {
    console.error(err);
    setStatus('Error: ' + err.message);
  }
});


formatSelect.addEventListener('change', () => {
  const data = paletteEl._lastColors;
  if (data) renderPalette(data);
});

function setStatus(msg){ statusEl.textContent = msg; }

function sendMessage(tabId, payload){
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, payload, (response) => {
      const err = chrome.runtime.lastError;
      if (err) return reject(err);
      resolve(response);
    });
  });
}

function renderSummary({ total, unique }){
  summaryEl.classList.remove('hidden');
  summaryEl.textContent = `${unique} unique colores detected (from ${total} ocurrences)`;
}

function renderPalette(colors){
  paletteEl._lastColors = colors;
  const fmt = formatSelect.value;
  paletteEl.innerHTML = '';

  colors.forEach(c => {
    const value = c[fmt];
    console.log(c);
    const el = document.createElement('div');
    el.className = 'swatch';
    el.innerHTML = `
      <div class="chip" style="background-color:${value}"></div>
      <div class="meta">
        <div class="value">${escapeHtml(value)}</div>
        <button class="copy" data-copy="${value}">Copy</button>
      </div>
    `;
    paletteEl.appendChild(el);
  });

  paletteEl.querySelectorAll('.copy').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const val = e.currentTarget.getAttribute('data-copy');
      try { await navigator.clipboard.writeText(val); btn.textContent = 'Copied ✓'; }
      catch { btn.textContent = 'Copy (permission)'; }
      setTimeout(() => (btn.textContent = 'Copy'), 1200);
    });
  });
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

