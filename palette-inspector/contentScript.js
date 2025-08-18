(() => {
  if (window.__frontendHelperInjected) return; // evita múltiples listeners
  window.__frontendHelperInjected = true;

  chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    if (req?.type === 'COLLECT_COLORS') {
      collectColors().then(sendResponse);
      return true;
    }
  });

  async function collectColors(){
    const styleProps = [
      'color', 'backgroundColor',
      'borderTopColor','borderRightColor','borderBottomColor','borderLeftColor',
      'fill','stroke'
    ];

    const els = Array.from(document.querySelectorAll('*'));
    const map = new Map();
    let total = 0;

    for (const el of els){
      const cs = getComputedStyle(el);
      for (const prop of styleProps){
        let v = cs[prop];
        if (!v || v === 'transparent' || v === 'none') continue;
        const rgba = parseColor(v);
        if (!rgba || rgba.a === 0) continue;
        const key = `${rgba.r},${rgba.g},${rgba.b},${rgba.a}`;
        const cur = map.get(key) || { ...rgba, count: 0 };
        cur.count++;
        map.set(key, cur);
        total++;
      }
    }

    // Ordenar por frecuencia y limitar a 32 colores
    const colors = Array.from(map.values())
      .sort((a,b) => b.count - a.count)
      .slice(0, 32)
      .map(rgba => toFormats(rgba));

    return { colors, total, unique: map.size };
  }
  function parseColor(input){
    input = input.trim().toLowerCase();

    if(input.startsWith('rgb')){
      const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\)/);
      if(m){
        return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
      }
    } else if(input.startsWith('#')){
      const rgb = hexToRgb(input);
      if(rgb) return { ...rgb, a: 1 };
    }

    const dummy = document.createElement('div');
    dummy.style.color = input;
    document.body.appendChild(dummy);
    const cs = getComputedStyle(dummy).color;
    document.body.removeChild(dummy);
    if(cs) return parseColor(cs);

    return null;
  }

  function hexToRgb(hex){
    hex = hex.replace('#','');
    if(hex.length === 3){
      hex = hex.split('').map(c => c+c).join('');
    }
    if(hex.length !== 6) return null;
    const r = parseInt(hex.slice(0,2),16);
    const g = parseInt(hex.slice(2,4),16);
    const b = parseInt(hex.slice(4,6),16);
    return { r,g,b };
  }

  function clampInt(val,min,max){
    return Math.min(Math.max(Math.round(val), min), max);
  }

  function toFormats({r,g,b,a}){
    const hex = `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`;
    const rgb = `rgb(${r},${g},${b})`;
    const rgba = `rgba(${r},${g},${b},${a})`;
    return { hex, rgb, rgba, a };
  }
})();