/* Browser fallback. Android builds replace this file with the bundled native plugin. */
window.DebooBiometric = {
  check: async () => ({ isAvailable: false, reason: "فتح البصمة متاح داخل نسخة Android المثبتة." }),
  authenticate: async () => { throw new Error("ميزة البصمة متاحة داخل نسخة Android المثبتة فقط."); }
};
