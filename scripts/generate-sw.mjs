import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const distArg = process.argv[2] ?? "dist";
const distDir = new URL(`../${distArg}/`, import.meta.url).pathname;

const listFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });

const urls = listFiles(distDir)
  .map((file) => relative(distDir, file).split(sep).join("/"))
  .sort();

const hash = createHash("sha256");
for (const url of urls) {
  hash.update(url);
  hash.update(readFileSync(join(distDir, ...url.split("/"))));
}
const cacheName = `panda-jump-${hash.digest("hex").slice(0, 16)}`;

const swSource = `const CACHE_NAME = ${JSON.stringify(cacheName)};
const PRECACHE_URLS = ${JSON.stringify(urls)};

const dropStaleCaches = async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(dropStaleCaches().then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode === "navigate") {
    event.respondWith(caches.match("index.html").then((cached) => cached ?? fetch(request)));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
});
`;

writeFileSync(join(distDir, "sw.js"), swSource);
