export function searchURL(query) {
  if (typeof query !== "string" || !query.trim() || query.length > 120)
    throw Error("Enter 1–120 search characters.");
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: query.trim() + " filetype:bitmap",
    gsrnamespace: "6",
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "500",
  });
  return "https://commons.wikimedia.org/w/api.php?" + params;
}
export function safeURL(value, kind = "page") {
  try {
    const u = new URL(value);
    const hosts =
      kind === "image" ? ["upload.wikimedia.org"] : ["commons.wikimedia.org"];
    return u.protocol === "https:" && hosts.includes(u.hostname) && !u.username
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export function imageResults(data) {
  if (!data || typeof data !== "object" || data.error)
    throw Error("Commons returned an error or invalid response.");
  return Object.values(data.query?.pages || {})
    .slice(0, 12)
    .flatMap((page) => {
      const info = page.imageinfo?.[0],
        meta = info?.extmetadata || {};
      const image = safeURL(info?.thumburl || info?.url, "image"),
        url = safeURL(info?.descriptionurl);
      if (!image || !url) return [];
      return [
        {
          title: String(page.title || "Untitled file").slice(0, 500),
          image,
          url,
          artist: meta.Artist?.value || "Author metadata not supplied",
          license: meta.LicenseShortName?.value || "Check source license",
          credit: meta.Credit?.value || "",
          attribution: meta.AttributionRequired?.value || "unknown",
        },
      ];
    });
}
