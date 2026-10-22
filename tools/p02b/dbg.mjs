import { launch } from '../p02/cdp.mjs';
const [role, hash, expr] = process.argv.slice(2);
const b = await launch({ port: 9354 });
await b.viewport(1920, 1080);
await b.goto('http://127.0.0.1:5312/?role=' + role + '#/' + hash.replace(/^[/]+/, ''));
await b.wait(1200);
console.log(await b.eval(expr));
console.log('errors', JSON.stringify(b.errors().slice(0, 3)));
await b.close();
