const { type, name } = $arguments;

let cfg = JSON.parse($files[0]);
const proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
});

cfg.outbounds.push(...proxies);

const norm = s => (s && s.normalize ? s.normalize('NFKC').replace(/\uFE0F/g, '') : s);

function setOutbounds(tag, list) {
  const t = norm(tag);
  const o = cfg.outbounds.find(x => Array.isArray(x.outbounds) && norm(x.tag) === t);
  if (o) o.outbounds = list.slice();
}

const all = proxies.map(p => p.tag);
const us = proxies.filter(p => /@US\b/.test(p.tag)).map(p => p.tag);
const nl = proxies.filter(p => /@NL\b/.test(p.tag)).map(p => p.tag);
const pl = proxies.filter(p => /@PL\b/.test(p.tag)).map(p => p.tag);

setOutbounds('🌍 Auto', all);
setOutbounds('🇺🇸 USA (Auto)', us);
setOutbounds('🇳🇱 Netherlands (Auto)', nl);
setOutbounds('🇵🇱 Poland (Auto)', pl);

$content = JSON.stringify(cfg, null, 2);