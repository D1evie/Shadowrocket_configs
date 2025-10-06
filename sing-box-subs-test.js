const { type, name } = $arguments;

let cfg = JSON.parse($files[0]);

const proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal'
});

cfg.outbounds.push(...proxies);

const norm = s => (s && s.normalize ? s.normalize('NFKC').replace(/\uFE0F/g, '') : s);

const findOutboundIndex = tag => {
  const t = norm(tag);
  return cfg.outbounds.findIndex(x => norm(x.tag) === t);
};

const getOutbound = tag => {
  const i = findOutboundIndex(tag);
  return i >= 0 ? cfg.outbounds[i] : null;
};

const upsertOutbound = obj => {
  const i = findOutboundIndex(obj.tag);
  if (i >= 0) cfg.outbounds[i] = obj;
  else cfg.outbounds.push(obj);
};

const removeOutbound = tag => {
  const i = findOutboundIndex(tag);
  if (i >= 0) cfg.outbounds.splice(i, 1);
};

for (let i = cfg.outbounds.length - 1; i >= 0; i--) {
  if (cfg.outbounds[i].type === 'urltest') cfg.outbounds.splice(i, 1);
}

const us = proxies.filter(p => /@US\b/.test(p.tag)).map(p => p.tag);
const nl = proxies.filter(p => /@NL\b/.test(p.tag)).map(p => p.tag);
const pl = proxies.filter(p => /@PL\b/.test(p.tag)).map(p => p.tag);
const de = proxies.filter(p => /@DE\b/.test(p.tag)).map(p => p.tag);
const wl = proxies.filter(p => /@WL\b/.test(p.tag)).map(p => p.tag);

const collapse = (displayTag, list) => {
  if (!list || list.length === 0) {
    removeOutbound(displayTag);
    return null;
  }
  const first = list[0];
  const ob = getOutbound(first);
  if (!ob) return null;
  const cloned = JSON.parse(JSON.stringify(ob));
  cloned.tag = displayTag;
  upsertOutbound(cloned);
  for (const t of list) {
    if (t !== first) removeOutbound(t);
  }
  if (first !== displayTag) removeOutbound(first);
  return displayTag;
};

const displayTags = [
  collapse('🇺🇸 USA', us),
  collapse('🇳🇱 Netherlands', nl),
  collapse('🇵🇱 Poland', pl),
  collapse('🇩🇪 Germany', de),
  collapse('🕊️ White List', wl)
].filter(Boolean);

const selector = cfg.outbounds.find(x => x.type === 'selector' && norm(x.tag) === norm('proxy'));
if (selector) {
  selector.outbounds = displayTags.length ? displayTags : ['direct'];
  const want = selector.default ? norm(selector.default) : null;
  const has = want && selector.outbounds.some(t => norm(t) === want);
  selector.default = has ? selector.default : selector.outbounds[0];
}

$content = JSON.stringify(cfg, null, 2);