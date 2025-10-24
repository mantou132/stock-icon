/**@type import("webextension-polyfill") */
const browser = self.browser || self.chrome;

/**@type {HTMLFormElement} */
const form = document.querySelector("#form");
/**@type {HTMLAnchorElement} */
const apply = document.querySelector("#apply");

async function setValue() {
  const data = await browser.storage.sync.get();
  for (let key in data) {
    /**@type {HTMLInputElement} */
    const ele = form.querySelector(`[name=${key}]`);
    if (ele) {
      ele.value = data[key];
    }
  }
}

const save = (v = {}) => {
  const data = Object.fromEntries(new FormData(form).entries());
  return browser.storage.sync.set({ ...data, ...v });
};

async function update() {
  form.inert = true;
  apply.inert = true;
  try {
    const res = await fetch("https://qos-reg.709922234.workers.dev?email=1");
    const { data } = await res.json();
    await save({ key: data.key });
    await setValue();
  } finally {
    form.inert = false;
    apply.inert = false;
  }
}

addEventListener("load", () => setValue());
form.addEventListener("change", () => save());
apply.addEventListener("click", () => update());
