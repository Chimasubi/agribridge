import puppeteer from "/home/chimasubi/summit-whatsapp-bot/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const BASE = "http://localhost:4000";
const ROUTES = [
  "/", "/suppliers", "/suppliers/7", "/suppliers/10",
  "/products", "/compliance", "/deals",
  "/deals/1", "/deals/2", "/deals/3", "/deals/5",
  "/escrow", "/logistics", "/broker", "/admin",
];

const browser = await puppeteer.launch({
  executablePath: "/snap/bin/chromium",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const results = {};
let totalErrors = 0;

for (const route of ROUTES) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e.message).slice(0, 130)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console: " + m.text().slice(0, 130));
  });
  let heading = "";
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle0", timeout: 25000 });
    await new Promise((r) => setTimeout(r, 600));
    heading = await page.evaluate(() => document.querySelector("h1")?.innerText?.slice(0, 40) || document.title || "(no h1)");
  } catch (e) {
    heading = "NAVFAIL " + String(e.message).slice(0, 50);
  }
  totalErrors += errors.length;
  results[route] = { heading, errors };
  await page.close();
}

await browser.close();
for (const [route, r] of Object.entries(results)) {
  console.log((r.errors.length ? "!! " : "ok ") + route.padEnd(16) + " → " + r.heading + (r.errors.length ? "  [" : "") + r.errors.join(" | ") + (r.errors.length ? "]" : ""));
}
console.log("\nROUTES: " + ROUTES.length + "   TOTAL_ERRORS: " + totalErrors);
