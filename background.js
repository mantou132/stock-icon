/**@type import("webextension-polyfill") */
const browser = self.browser || self.chrome;

/**
 * @typedef {Object} Snap
 * @property {string} c - code
 * @property {string} lp - current price
 * @property {string} yp - yesterday price
 * @property {string} o - open price
 */

/**
 * @returns {Promise<Snap[]>}
 */
async function fetchStockData() {
  const { key, code } = await browser.storage.sync.get("config_v1");
  const response = await fetch(
    `https://qos.hk/snapshot?${new URLSearchParams({ key })}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codes: [code] }),
    },
  );
  if (!response.ok) throw new Error("not ok");
  return (await response.json()).data;
}

async function getImageData() {
  const size = 128;
  const fontSize = 56;
  const offscreen = new OffscreenCanvas(size, size);
  let ctx = offscreen.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, size, size);

  const [{ lp }] = await fetchStockData();
  ctx.font = `normal ${fontSize}px sans-serif`;
  ctx.fillStyle = "white";
  const text = lp.replace(".", "").slice(1, 4);
  const mea = ctx.measureText(text);
  ctx.fillText(text, (size - mea.width) / 2, (size - fontSize) / 2 + fontSize);

  return ctx.getImageData(0, 0, size, size);
}

browser.alarms.create("period", { periodInMinutes: 12.1 / 60 });
browser.alarms.create("first", { delayInMinutes: 0 });

browser.alarms.onAlarm.addListener(() => {
  console.log("Alarm triggered! Executing periodic task.");
  getImageData().then((imageData) => {
    browser.action.setIcon({ imageData });
  });
});
