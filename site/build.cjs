// Builds dist-site/ from site/: a Traditional Chinese tree at /zh/ and an English tree at /en/,
// generated from the same bilingual sources (elements carrying lang="zh" / lang="en").
// Adds canonical + hreflang links, rewrites links to extensionless same-language URLs,
// writes sitemap.xml and _redirects (/ and the old unprefixed URLs go to /zh/), then copies
// the three game builds in. SITE_ONLY=1 skips the games.
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = __dirname;
const OUT = path.join(ROOT, 'dist-site');
const HOST = 'https://yore-tw.com';
const GAMES = ['meowcaron', 'souls-in-abyss', 'planet-wanderer', 'prism-defense'];
const LANGS = {
  zh: { html: 'zh-TW', hreflang: 'zh-Hant', prefix: '/zh', locale: 'zh_TW', label: '中文' },
  en: { html: 'en', hreflang: 'en', prefix: '/en', locale: 'en_US', label: 'EN' },
};
const VOID = new Set(['meta', 'link', 'img', 'br', 'hr', 'input', 'source']);
const SKIP = new Set(['build.cjs', 'serve.cjs', 'sitemap.xml']);

function walk(dir, rel = '') {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name), r = path.posix.join(rel, name);
    if (fs.statSync(p).isDirectory()) out.push(...walk(p, r));
    else out.push(r);
  }
  return out;
}

const files = walk(SRC).filter((f) => !SKIP.has(f));
const pages = new Set(files.filter((f) => f.endsWith('.html')));

// '/games/x.html' -> '/games/x', '/index.html' -> '/', with the language prefix
function pageUrl(rootPath, lang) {
  const p = rootPath.replace(/index\.html$/, '').replace(/\.html$/, '');
  return LANGS[lang].prefix + (p || '/');
}

// remove every element carrying lang="<drop>", nested same-name tags included
function removeLang(html, drop) {
  const open = new RegExp(`<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*\\slang="${drop}"[^>]*>`, 'g');
  let m;
  while ((m = open.exec(html))) {
    const tag = m[1], start = m.index;
    let end = start + m[0].length;
    if (!VOID.has(tag.toLowerCase())) {
      const tags = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'g');
      tags.lastIndex = end;
      let depth = 1, t;
      while (depth > 0 && (t = tags.exec(html))) {
        if (t[0].endsWith('/>')) continue;
        depth += t[1] ? -1 : 1;
        end = t.index + t[0].length;
      }
      if (depth > 0) throw new Error(`unclosed <${tag} lang="${drop}"> at ${start}`);
    }
    html = html.slice(0, start) + html.slice(end);
    open.lastIndex = start;
  }
  return html;
}

function rewriteLinks(html, rel, lang) {
  const dir = '/' + path.posix.dirname(rel).replace(/^\.$/, '');
  return html.replace(/\b(href|src)="([^"]*)"/g, (all, attr, url) => {
    if (/^(https?:|\/\/|#|mailto:|data:|\/)/.test(url)) return all;
    const hashAt = url.indexOf('#');
    const hash = hashAt >= 0 ? url.slice(hashAt) : '';
    const bare = hashAt >= 0 ? url.slice(0, hashAt) : url;
    let abs = path.posix.normalize(path.posix.join(dir, bare || './'));
    if (abs.endsWith('/') && pages.has(path.posix.join(abs, 'index.html').slice(1))) abs += 'index.html';
    const isPage = pages.has(abs.slice(1));
    return `${attr}="${isPage ? pageUrl(abs, lang) : abs}${hash}"`;
  });
}

function gitDate(p) {
  try {
    const d = cp.execFileSync('git', ['log', '-1', '--format=%cs', '--', p], { cwd: ROOT, encoding: 'utf8' }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  } catch (e) {}
  return new Date().toISOString().slice(0, 10);
}

function render(src, rel, lang) {
  const L = LANGS[lang], other = lang === 'zh' ? 'en' : 'zh', O = LANGS[other];
  const here = HOST + pageUrl('/' + rel, lang), there = pageUrl('/' + rel, other);
  let html = removeLang(src, other);
  html = html.replace(/\slang="(zh|en)"/g, '');
  html = rewriteLinks(html, rel, lang);
  html = html.replace(/<html[^>]*>/, `<html lang="${L.html}" data-lang="${lang}">`);
  const head = [
    `<link rel="canonical" href="${here}" />`,
    `<link rel="alternate" hreflang="${LANGS.zh.hreflang}" href="${HOST + pageUrl('/' + rel, 'zh')}" />`,
    `<link rel="alternate" hreflang="${LANGS.en.hreflang}" href="${HOST + pageUrl('/' + rel, 'en')}" />`,
    `<link rel="alternate" hreflang="x-default" href="${HOST + pageUrl('/' + rel, 'zh')}" />`,
    `<meta property="og:url" content="${here}" />`,
    `<meta property="og:locale" content="${L.locale}" />`,
  ].map((l) => '  ' + l).join('\n');
  html = html.replace(/(<\/title>)/, `$1\n${head}`);
  html = html.replace(
    /<button id="lang"[^>]*>[^<]*<\/button>/,
    `<a id="lang" class="lang-btn" href="${there}" hreflang="${O.hreflang}" rel="alternate">${O.label}</a>`,
  );
  return html;
}

fs.rmSync(OUT, { recursive: true, force: true });
for (const rel of files) {
  const from = path.join(SRC, rel);
  if (!pages.has(rel)) {
    const to = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    continue;
  }
  const src = fs.readFileSync(from, 'utf8');
  for (const lang of Object.keys(LANGS)) {
    const to = path.join(OUT, LANGS[lang].prefix.slice(1), rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, render(src, rel, lang));
  }
}

// sitemap: one entry per page per language, each listing both alternates; game roots once
const urls = [];
for (const rel of [...pages].sort()) {
  const lastmod = gitDate(path.join('site', rel));
  const alts = ['zh', 'en']
    .map((l) => `    <xhtml:link rel="alternate" hreflang="${LANGS[l].hreflang}" href="${HOST + pageUrl('/' + rel, l)}" />`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${HOST + pageUrl('/' + rel, 'zh')}" />`)
    .join('\n');
  for (const l of ['zh', 'en']) {
    urls.push(`  <url>\n    <loc>${HOST + pageUrl('/' + rel, l)}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alts}\n  </url>`);
  }
}
for (const g of GAMES) urls.push(`  <url>\n    <loc>${HOST}/${g}/</loc>\n    <lastmod>${gitDate(g)}</lastmod>\n  </url>`);
fs.writeFileSync(
  path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
);

// Cloudflare assets _redirects: the root and the old unprefixed page URLs go to the Chinese tree
const redirects = ['/ /zh/ 302', '/index.html /zh/ 301'];
for (const rel of [...pages].sort()) {
  if (rel === 'index.html') continue;
  const to = pageUrl('/' + rel, 'zh');
  redirects.push(`${to.replace(/^\/zh/, '')} ${to} 301`, `/${rel} ${to} 301`);
}
fs.writeFileSync(path.join(OUT, '_redirects'), redirects.join('\n') + '\n');

if (!process.env.SITE_ONLY) {
  for (const g of GAMES) {
    const dist = path.join(ROOT, g, 'dist');
    if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error(`${g}/dist is missing; run npm run build first`);
    fs.cpSync(dist, path.join(OUT, g), { recursive: true });
  }
}
console.log(`dist-site: ${pages.size} pages x 2 languages, ${files.length - pages.size} static files${process.env.SITE_ONLY ? ' (games skipped)' : ''}`);
