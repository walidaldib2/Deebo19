/* DEBOO16 appearance preferences — v1 */
(() => {
  "use strict";
  const THEME_KEY = "deboo16_theme_v1";
  const FONT_KEY = "deboo16_font_v1";
  const root = document.documentElement;

  function applyPreferences() {
    const theme = localStorage.getItem(THEME_KEY) || "dark";
    const fontSize = Math.max(14, Math.min(22, Number(localStorage.getItem(FONT_KEY) || 16)));
    root.dataset.theme = theme;
    root.style.setProperty("--deboo-font-size", fontSize + "px");
  }

  function addAppearanceSettings() {
    const area = document.querySelector("#contentArea");
    if (!area || !document.querySelector("#savePin") || document.querySelector("#debooAppearanceCard")) return;

    const card = document.createElement("section");
    card.className = "card";
    card.id = "debooAppearanceCard";

    const heading = document.createElement("h3");
    heading.textContent = "المظهر وحجم الخط";
    const description = document.createElement("p");
    description.className = "muted";
    description.textContent = "غيّر حجم النص واختر الوضع المناسب. سيتم حفظ اختيارك على هذا الجهاز.";
    card.append(heading, description);

    const controls = document.createElement("div");
    controls.className = "deboo-appearance-controls";

    const themeLabel = document.createElement("label");
    themeLabel.textContent = "نظام الألوان";
    const themeSelect = document.createElement("select");
    themeSelect.id = "debooThemeSelect";
    themeSelect.innerHTML = '<option value="dark">الوضع الداكن</option><option value="light">الوضع الفاتح</option>';
    themeSelect.value = localStorage.getItem(THEME_KEY) || "dark";
    themeLabel.append(themeSelect);

    const fontLabel = document.createElement("label");
    fontLabel.textContent = "حجم الخط";
    const fontValue = document.createElement("strong");
    fontValue.id = "debooFontValue";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "14";
    slider.max = "22";
    slider.step = "1";
    slider.value = String(Math.max(14, Math.min(22, Number(localStorage.getItem(FONT_KEY) || 16))));
    fontLabel.append(fontValue, slider);

    controls.append(themeLabel, fontLabel);
    card.append(controls);
    area.prepend(card);

    const updateFont = () => {
      localStorage.setItem(FONT_KEY, slider.value);
      fontValue.textContent = slider.value + " px";
      applyPreferences();
    };
    themeSelect.addEventListener("change", () => {
      localStorage.setItem(THEME_KEY, themeSelect.value);
      applyPreferences();
    });
    slider.addEventListener("input", updateFont);
    updateFont();
  }

  applyPreferences();
  document.addEventListener("click", event => {
    if (event.target.closest('[data-page="settings"]')) {
      setTimeout(addAppearanceSettings, 100);
    }
  });
  new MutationObserver(() => {
    if (document.querySelector("#savePin")) addAppearanceSettings();
  }).observe(document.body, { childList: true, subtree: true });
})();
