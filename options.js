/**@type import("webextension-polyfill") */
const browser = self.browser || self.chrome;

/**@type {HTMLFormElement} */
const form = document.querySelector("#form");

addEventListener("load", async () => {
  const data = await browser.storage.sync.get();
  for (let key in data) {
    /**@type {HTMLInputElement} */
    const ele = form.querySelector(`[name=${key}]`);
    if (ele) {
      ele.value = data[key];
    }
  }
});

form.addEventListener("change", () => {
  const data = Object.fromEntries(new FormData(form).entries());
  browser.storage.sync.set(data);
});
