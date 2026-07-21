import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { AUTHOR_URL, isExactPublicUrl } from "./site-url-policy.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = resolve(projectRoot, "site");
const pages = [
  { path: resolve(siteRoot, "index.html"), language: "es" },
  { path: resolve(siteRoot, "en", "index.html"), language: "en" },
];
const errors = [];

function fail(message) {
  errors.push(message);
}

function relativeLabel(path) {
  return relative(projectRoot, path).split(sep).join("/");
}

function attributeUrls(html) {
  return [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
}

for (const page of pages) {
  if (!existsSync(page.path)) {
    fail(`${relativeLabel(page.path)} does not exist`);
    continue;
  }

  const html = readFileSync(page.path, "utf8");
  const label = relativeLabel(page.path);
  const references = attributeUrls(html);
  if (!html.includes(`<html lang="${page.language}">`)) fail(`${label} has the wrong language`);
  if (!references.some((reference) => isExactPublicUrl(reference, AUTHOR_URL))) fail(`${label} is missing the exact canonical author URL`);
  if (!html.includes('rel="canonical"')) fail(`${label} is missing its canonical URL`);
  if (!html.includes('hreflang="es"') || !html.includes('hreflang="en"')) fail(`${label} is missing bilingual alternate links`);
  if (!html.includes("application/ld+json")) fail(`${label} is missing structured data`);
  if (!html.includes('"softwareVersion":"0.5.0"')) fail(`${label} does not describe the current 0.5.0 release`);
  const releaseSection = page.language === "es" ? 'id="novedades"' : 'id="whats-new"';
  if (!html.includes(releaseSection)) fail(`${label} is missing the 0.5.0 feature section`);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) fail(`${label} contains duplicate IDs: ${[...new Set(duplicateIds)].join(", ")}`);

  for (const reference of references) {
    if (/^(?:https?:|mailto:|data:)/.test(reference)) continue;
    if (reference.startsWith("#")) {
      if (!ids.includes(reference.slice(1))) fail(`${label} points to missing section ${reference}`);
      continue;
    }

    const cleanReference = reference.split(/[?#]/, 1)[0];
    const target = resolve(dirname(page.path), cleanReference, cleanReference.endsWith("/") ? "index.html" : "");
    if (!target.startsWith(siteRoot + sep) && target !== siteRoot) fail(`${label} contains an escaping path: ${reference}`);
    else if (!existsSync(target)) fail(`${label} points to missing file: ${reference}`);
  }

  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  if (jsonLd) {
    try { JSON.parse(jsonLd); } catch (error) { fail(`${label} has invalid JSON-LD: ${error.message}`); }
  }
}

for (const asset of ["styles.css", "assets/launcher-home.png", "assets/projects-library.png", "robots.txt", "sitemap.xml", ".nojekyll"]) {
  const path = resolve(siteRoot, asset);
  if (!existsSync(path)) fail(`site/${asset} does not exist`);
  else if (asset.endsWith(".png") && statSync(path).size === 0) fail(`site/${asset} is empty`);
}

const css = readFileSync(resolve(siteRoot, "styles.css"), "utf8");
const openingBraces = (css.match(/{/g) || []).length;
const closingBraces = (css.match(/}/g) || []).length;
if (openingBraces !== closingBraces) fail(`site/styles.css has unbalanced braces (${openingBraces}/${closingBraces})`);

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Landing check passed: Spanish, English, local links, assets, JSON-LD and CSS.");
}
