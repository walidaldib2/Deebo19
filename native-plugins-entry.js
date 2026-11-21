import { Capacitor, registerPlugin } from '@capacitor/core';

// Capacitor 7 custom native plugins must be registered in JavaScript.
// Keep the web/PWA build free of native calls and use browser fallbacks there.
window.DEEBNativePlugins = Capacitor.isNativePlatform()
  ? {
      FileExport: registerPlugin('FileExport'),
      CurrentLocation: registerPlugin('CurrentLocation'),
      ShareIntent: registerPlugin('ShareIntent')
    }
  : {};
