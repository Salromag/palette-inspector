chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'COLLECT_COLORS') {
    // logic to collect colors from the page
    const colors = collectColorsFromPage(); // your existing function
    sendResponse({ 
      colors, 
      total: colors.length, 
      unique: new Set(colors.map(c => c.hex)).size 
    });
  }
});