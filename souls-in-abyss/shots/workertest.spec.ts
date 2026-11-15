import { test, expect } from '@playwright/test';
import * as fs from 'fs';
test('feedback worker routes (in-browser)', async ({ page }) => {
  await page.goto('/'); // localhost is a secure context, so crypto.subtle exists
  const src = fs.readFileSync('/Users/yore/Documents/side_project/kuso_game/.claude/worktrees/souls-release/worker/index.js', 'utf8').replace('export default', 'window.__worker =');
  await page.addScriptTag({ content: src });
  const out = await page.evaluate(async () => {
    const mod = (window as any).__worker; const store = new Map<string, string>();
    const KV = { get: async (k: string) => store.get(k) ?? null, put: async (k: string, v: string) => { store.set(k, v); }, list: async ({ prefix }: any) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })) }) };
    const env = { FEEDBACK: KV, ADMIN_TOKEN: 'secret-token', ASSETS: { fetch: async () => new Response('asset') } };
    const req = (method: string, path: string, body?: any) => new Request('https://yore-tw.com' + path, { method, headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '1.2.3.4', Origin: 'https://claude.ai' }, body: body ? JSON.stringify(body) : undefined });
    const log: string[] = [];
    const r1 = await mod.fetch(req('POST', '/api/feedback', { game: 'souls-in-abyss', lang: 'zh', msg: '寶箱汪一直卡在牆裡', contact: 'me@x.tw', meta: { lvl: 3 } }), env); log.push('post ' + r1.status + ' ' + r1.headers.get('Access-Control-Allow-Origin'));
    log.push('short ' + (await mod.fetch(req('POST', '/api/feedback', { msg: 'x' }), env)).status);
    log.push('honeypot ' + (await mod.fetch(req('POST', '/api/feedback', { msg: 'bot', hp: 'filled' }), env)).status);
    for (let i = 0; i < 6; i++) await mod.fetch(req('POST', '/api/feedback', { msg: 'again ' + i }), env);
    log.push('rate ' + (await mod.fetch(req('POST', '/api/feedback', { msg: 'one more' }), env)).status);
    log.push('wrong token ' + (await mod.fetch(req('GET', '/api/feedback?token=wrong'), env)).status);
    const r6 = await mod.fetch(req('GET', '/api/feedback?token=secret-token&limit=2'), env); const j = await r6.json(); log.push('inbox ' + r6.status + ' ' + j.count + ' ' + j.items.map((i: any) => i.msg).join('|'));
    log.push('asset ' + (await mod.fetch(req('GET', '/zh/'), env)).status);
    log.push('nokv ' + (await mod.fetch(req('POST', '/api/feedback', { msg: 'hello' }), { ASSETS: env.ASSETS })).status);
    log.push('options ' + (await mod.fetch(req('OPTIONS', '/api/feedback'), env)).status);
    return log;
  });
  console.log(out.join('\n'));
  expect(out[0]).toContain('post 202'); expect(out).toContain('rate 429'); expect(out).toContain('wrong token 403'); expect(out).toContain('nokv 503');
});
