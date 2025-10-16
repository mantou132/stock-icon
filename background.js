/**@type import("webextension-polyfill") */
const browser = self.browser || self.chrome;

class MyError extends Error {
  constructor(code, msg) {
    super(`${code}: ${msg}`);
  }
}

const ErrorType = {
  unknown: "0E00",
  notOk: "0E01",
};

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
  const { key, code } = await browser.storage.sync.get();
  const response = await fetch(
    `https://qos.hk/snapshot?${new URLSearchParams({ key })}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codes: [code] }),
    },
  );
  const { data, msg } = await response.json();
  if (!response.ok) throw new MyError(ErrorType.notOk, msg);
  return data;
}

const fontFile = new FontFace(
  "JetBrains Mono",
  'url("https://font.download/cdn/webfont/jetbrains-mono/JetbrainsMonoRegular-RpvmM.woff") format("woff")',
);
fontFile.load();

/**@type {FontFaceSet} */
const fonts = self.document?.fonts || self.fonts;
fonts.add(fontFile);

async function getImageData() {
  const size = 128;
  const fontSize = 64;
  const offscreen = new OffscreenCanvas(size, size);
  const ctx = offscreen.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, size, size);

  let lp = "";
  try {
    const result = await fetchStockData();
    lp = result[0].lp;
  } catch (e) {
    if (e instanceof MyError) {
      lp = e.message;
    } else {
      lp = new MyError(ErrorType.unknown, e.message || e).message;
    }
  }
  await fontFile.loaded;
  ctx.font = `normal ${fontSize}px "${fontFile.family}", sans-serif`;
  ctx.fillStyle = "white";
  const text = lp.replace(".", "").slice(1, 4).padEnd(3, "0");
  const mea = ctx.measureText(text);
  ctx.fillText(text, (size - mea.width) / 2, (size - fontSize) / 2 + fontSize);

  return {
    imageData: ctx.getImageData(0, 0, size, size),
    title: isNaN(Number(lp)) ? lp : `Your mood today is ${lp}°`,
  };
}

browser.alarms.create("period", { periodInMinutes: 12.1 / 60 });
browser.alarms.create("first", { delayInMinutes: 0 });

browser.alarms.onAlarm.addListener(async () => {
  console.log("Alarm triggered! Executing periodic task.");
  const { imageData, title } = await getImageData();
  browser.action.setIcon({ imageData });
  browser.action.setTitle({ title });
});
