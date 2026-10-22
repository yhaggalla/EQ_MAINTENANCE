// Ad-hoc screenshot helper: node tools/p02b/shot.mjs <out.png> <role> <hash> [w] [h] [waitMs]
import { launch } from '../p02/cdp.mjs';
const [out, role, hash, w = '1920', h = '1080', wait = '1200'] = process.argv.slice(2);
const b = await launch({ port: 9353 });
await b.viewport(Number(w), Number(h));
b.clearEvents();
await b.goto('http://127.0.0.1:5312/?role=' + role + '#/' + hash.replace(/^[/]+/, ''));
await b.wait(Number(wait));
console.log('errors', JSON.stringify(b.errors().slice(0, 3)));
await b.screenshot(out);
await b.close();
