// Run before every push: node tools/check-locks.js index.html
// Fails if any chapter has content for a part that OPEN doesn't list.
// A public page's source can be read, so locked content must not be in the file.
const fs = require("fs");
const { JSDOM } = require("jsdom");
const html = fs.readFileSync(process.argv[2] || "index.html", "utf8");
const probe = `<script>window.__hub = {OPEN, NOTES, QUIZ, CARDS, QUIZ_X, CARDS_X, PRACTICE, PAST: typeof PAST !== "undefined" ? PAST : {}};</script></body>`;
const dom = new JSDOM(html.replace("</body>", probe), { runScripts: "dangerously", url: "https://check.local/" });
const h = dom.window.__hub;
if (!h) { console.error("FAIL: could not read the hub data. Does the page still parse?"); process.exit(1); }
const map = { notes: ["NOTES"], quiz: ["QUIZ", "QUIZ_X"], cards: ["CARDS", "CARDS_X"], exam: ["PRACTICE"], past: ["PAST"] };
const problems = [];
for (const [part, objs] of Object.entries(map)) for (const o of objs) for (const k of Object.keys(h[o] || {})) {
  const has = Array.isArray(h[o][k]) ? h[o][k].length > 0 : !!h[o][k];
  if (has && !(h.OPEN[k] || []).includes(part)) problems.push(`${o}.${k} has content but "${part}" is locked for ${k}`);
}
for (const k of Object.keys(h.OPEN)) for (const part of h.OPEN[k]) {
  const has = map[part].some(o => h[o] && h[o][k] && (!Array.isArray(h[o][k]) || h[o][k].length));
  if (!has) problems.push(`${k}: "${part}" is open but has no content`);
}
if (problems.length) { console.error("FAIL\n" + problems.join("\n")); process.exit(1); }
console.log("OK: open parts", JSON.stringify(h.OPEN));
