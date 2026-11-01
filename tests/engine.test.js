import test from "node:test";
import assert from "node:assert/strict";
import { searchURL, safeURL, imageResults } from "../site/engine.js";
test("query is encoded and fixed to the public Commons API", () => {
  const url = new URL(searchURL("bridge & sky"));
  assert.equal(url.hostname, "commons.wikimedia.org");
  assert.equal(url.searchParams.get("gsrnamespace"), "6");
  assert.ok(url.searchParams.get("gsrsearch").startsWith("bridge & sky"));
  assert.throws(() => searchURL(""));
});
test("unsafe image/page links cannot enter the gallery", () => {
  for (const u of [
    "javascript:alert(1)",
    "http://upload.wikimedia.org/x",
    "https://evil.test/x",
    "https://upload.wikimedia.org.evil.test/x",
  ])
    assert.equal(safeURL(u, "image"), null);
});
test("source metadata is preserved and missing results stay empty", () => {
  const r = imageResults({
    query: {
      pages: {
        1: {
          title: "File:Demo.jpg",
          imageinfo: [
            {
              thumburl: "https://upload.wikimedia.org/demo.jpg",
              descriptionurl:
                "https://commons.wikimedia.org/wiki/File:Demo.jpg",
              extmetadata: {
                Artist: { value: "Example" },
                LicenseShortName: { value: "CC BY 4.0" },
              },
            },
          ],
        },
      },
    },
  });
  assert.equal(r[0].artist, "Example");
  assert.equal(r[0].license, "CC BY 4.0");
  assert.deepEqual(imageResults({ query: { pages: {} } }), []);
  assert.throws(() => imageResults({ error: {} }));
});
