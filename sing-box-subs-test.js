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

const findOutboundIndex = (tag) => {
  const t = norm(tag);
  return cfg.outbounds.findIndex(x => norm(x.tag) === t);
};

const getOutbound = (tag) => {
  const i = findOutboundIndex(tag);
  return i >= 0 ? cfg.outbounds[i] : null;
};

const upsertOutbound = (obj) => {
  const i = findOutboundIndex(obj.tag);
  if (i >= 0) cfg.outbounds[i] = obj;
  else cfg.outbounds.push(obj);
};

const removeOutbound = (tag) => {
  const i = findOutboundIndex(tag);
  if (i >= 0) cfg.outbounds.splice(i, 1);
};

const ensureUrlTest = (tag, list) => {
  upsertOutbound({
    type: 'urltest',
    tag,
    outbounds: list.slice(),
    url: 'https://www.gstatic.com/generate_204',
    interval: '5m',
    tolerance: 100,
    interrupt_exist_connections: false
  });
};

const us  = proxies.filter(p => /@US\b/.test(p.tag)).map(p => p.tag);
const nl  = proxies.filter(p => /@NL\b/.test(p.tag)).map(p => p.tag);
const pl  = proxies.filter(p => /@PL\b/.test(p.tag)).map(p => p.tag);
const de  = proxies.filter(p => /@DE\b/.test(p.tag)).map(p => p.tag);

const groups = [
  { tag: '🇺🇸 USA', list: us },
  { tag: '🇳🇱 Netherlands', list: nl },
  { tag: '🇵🇱 Poland', list: pl },
  { tag: '🇩🇪 Germany', list: de },
];

for (const g of groups) {
  if (g.list && g.list.length > 0) {
    ensureUrlTest(g.tag, g.list);
  } else {
    removeOutbound(g.tag);
  }
}

const selector = cfg.outbounds.find(x => x.type === 'selector' && norm(x.tag) === norm('proxy'));
if (selector) {
  const validTags = groups
    .map(g => g.tag)
    .filter(tag => {
      const ob = getOutbound(tag);
      return ob && ob.type === 'urltest' && Array.isArray(ob.outbounds) && ob.outbounds.length > 0;
    });

  if (validTags.length > 0) {
    selector.outbounds = validTags;
    const want = selector.default ? norm(selector.default) : null;
    const hasDefault = want && validTags.some(t => norm(t) === want);
    selector.default = hasDefault ? selector.default : validTags[0];
  } else {
    selector.outbounds = ['direct'];
    selector.default = 'direct';
  }
}

$content = JSON.stringify(cfg, null, 2);