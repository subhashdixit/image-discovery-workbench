import { searchURL, imageResults } from "./engine.js";
import { $, announce, download } from "./ui.js";
let results = [];
const plain = (value) =>
  String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
async function search() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    $("search").disabled = true;
    announce("Searching Wikimedia Commons…");
    const response = await fetch(searchURL($("query").value), {
      signal: controller.signal,
      credentials: "omit",
    });
    if (!response.ok)
      throw Error("Commons API unavailable: " + response.status);
    const text = await response.text();
    if (text.length > 3 * 1024 * 1024) throw Error("Response too large.");
    results = imageResults(JSON.parse(text)).map((r) => ({
      ...r,
      artist: plain(r.artist),
      credit: plain(r.credit),
      license: plain(r.license),
    }));
    $("gallery").replaceChildren();
    for (const r of results) {
      const card = document.createElement("article"),
        img = document.createElement("img"),
        title = document.createElement("h3"),
        credit = document.createElement("p"),
        a = document.createElement("a");
      img.src = r.image;
      img.alt = r.title;
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.style.width = "100%";
      title.textContent = r.title;
      credit.textContent = `${r.artist} · ${r.license} · ${r.credit}`;
      a.href = r.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Read source and license ↗";
      card.append(img, title, credit, a);
      $("gallery").append(card);
    }
    $("export").disabled = !results.length;
    announce(
      results.length
        ? `${results.length} candidate images. Check each source's attribution and reuse requirements.`
        : "No supported bitmap results. Try another phrase.",
    );
  } catch (error) {
    announce(
      error.name === "AbortError"
        ? "Search timed out. Retry later."
        : error.message,
    );
  } finally {
    clearTimeout(timer);
    $("search").disabled = false;
  }
}
$("search").addEventListener("click", search);
$("query").addEventListener("keydown", (e) => {
  if (e.key === "Enter") search();
});
$("export").addEventListener("click", () =>
  download(
    "commons-image-metadata.json",
    JSON.stringify(results, null, 2),
    "application/json",
  ),
);
