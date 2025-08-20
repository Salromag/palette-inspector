chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'COLLECT_COLORS') {
    try {
      const result = collectColors();
      sendResponse(result);
    } catch (err) {
      console.error("Error collecting colors:", err);
      sendResponse({ colors: [], total: 0, unique: 0 });
    }
    return true;
  }
});

function collectColors() {
  const allElements = Array.from(document.querySelectorAll('*'));
  const colorsMap = new Map();

  allElements.forEach(el => {
    const style = getComputedStyle(el);
    const colorProps = ['color', 'backgroundColor', 'borderColor'];

    colorProps.forEach(prop => {
      const c = normalizeColor(style[prop]);
      if (c) {
        if (colorsMap.has(c)) {
          colorsMap.set(c, colorsMap.get(c) + 1);
        } else {
          colorsMap.set(c, 1);
        }
      }
    });
  });

  const colors = Array.from(colorsMap.entries()).map(([css, count]) => ({
    css,
    hex: css,
    count
  }));

  return {
    total: colorsMap.size,
    unique: colors.length,
    colors
  };
}

function normalizeColor(color) {
  if (!color) return null;
  color = color.trim().toLowerCase();

  // Hex directo
  if (color.startsWith('#')) {
    if (color.length === 4) {
      return '#' + color[1]+color[1] + color[2]+color[2] + color[3]+color[3];
    }
    if (color.length === 7) return color;
    return null;
  }

  // rgb(...)
  const m = color.match(/^rgb\s*\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/);
  if (m) return rgbToHex(m[1], m[2], m[3]);

  try {
    const dummy = document.createElement('div');
    dummy.style.color = color;
    document.body.appendChild(dummy);
    const cs = getComputedStyle(dummy).color;
    document.body.removeChild(dummy);
    const m2 = cs.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (m2) return rgbToHex(m2[1], m2[2], m2[3]);
  } catch(e) {}

  return null;
}

function rgbToHex(r, g, b) {
  const toHex = n => {
    const num = parseInt(n);
    if (isNaN(num) || num < 0) return '00';
    if (num > 255) return 'ff';
    return num.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
