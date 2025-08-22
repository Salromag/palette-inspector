const statusEl = document.getElementById('status');
const analyzeBtn = document.getElementById('analyzeBtn');
const paletteEl = document.getElementById('palette');
const summaryEl = document.getElementById('summary');
const formatSelect = document.getElementById('formatSelect');
const saveBtn = document.getElementById('savePaletteBtn');

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

/**
 * Render the palette of the colors in the popup
 * @param {*} colors 
 */
function renderPalette(colors) {
  paletteEl._lastColors = colors;
  const fmt = formatSelect.value;
  paletteEl.innerHTML = '';

  colors.forEach(c => {
    const value = c[fmt];

    const swatch = document.createElement('div');
    swatch.className = 'swatch';

    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.style.backgroundColor = c.css;

    const meta = document.createElement('div');
    meta.className = 'meta';

    const code = document.createElement('div');
    code.textContent = value;

    const freq = document.createElement('div');
    freq.className = 'freq';
    freq.textContent = `${c.count} uses`;

    const copyBtn = document.createElement('div');
    copyBtn.className = 'copy';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(value).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 1000);
      });
    });

    meta.appendChild(code);
    meta.appendChild(freq);
    meta.appendChild(copyBtn);

    swatch.appendChild(chip);
    swatch.appendChild(meta);
    paletteEl.appendChild(swatch);

    saveBtn.style.display = colors.length ? 'inline-block' : 'none';
  });
}

/**
 * Save palette file
 */
saveBtn.addEventListener('click', () => {
  const colors = paletteEl._lastColors || [];
  if (!colors.length) return;

  const data = colors.map(c => c[formatSelect.value]);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'palette.json';
  a.click();
  URL.revokeObjectURL(url);
});

