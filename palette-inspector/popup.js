const statusEl = document.getElementById('status');
const analyzeBtn = document.getElementById('analyzeBtn');
const paletteEl = document.getElementById('palette');
const summaryEl = document.getElementById('summary');
const formatSelect = document.getElementById('formatSelect');

analyzeBtn.addEventListener('click', async () => {
  setStatus('Injecting script and analyzing…');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('Active tab not found.');

    // Inject contentScript only in the active tab
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['contentScript.js']
    });

    // Send message to collect colors
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

function setStatus(msg) {
  statusEl.textContent = msg;
}

function sendMessage(tabId, payload) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, payload, (response) => {
      const err = chrome.runtime.lastError;
      if (err) return reject(err);
      resolve(response);
    });
  });
}

function renderSummary({ total, unique }) {
  summaryEl.classList.remove('hidden');
  summaryEl.textContent = `${unique} unique colors detected (out of ${total} occurrences)`;
}

function renderPalette(colors) {
  paletteEl._lastColors = colors;
  const fmt = formatSelect.value;
  paletteEl.innerHTML = '';

  colors.forEach(c => {
    const value = c[fmt];
    const el = document.createElement('div');
    el.className = 'swatch';

    const colorBox = document.createElement('div');
    colorBox.style.width = '40px';
    colorBox.style.height = '40px';
    colorBox.style.backgroundColor = c.css;
    colorBox.style.border = '1px solid #ccc';
    colorBox.style.marginRight = '10px';

    const colorCode = document.createElement('span');
    colorCode.textContent = value;

    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.marginBottom = '5px';

    el.appendChild(colorBox);
    el.appendChild(colorCode);
    paletteEl.appendChild(el);
  });
}
