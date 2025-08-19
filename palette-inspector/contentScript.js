chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'COLLECT_COLORS') {
    const colors = collectColorsFromPage();
    sendResponse({ 
      colors, 
      total: colors.length, 
      unique: new Set(colors.map(c => c.hex)).size 
    });
  }
});