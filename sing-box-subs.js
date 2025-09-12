const { type, name } = $arguments;

let config = JSON.parse($files[0]);
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
});

config.outbounds.push(...proxies);

function pushTo(targetTags, tags) {
  config.outbounds.forEach(o => {
    if (Array.isArray(o.outbounds) && targetTags.includes(o.tag)) {
      o.outbounds.push(...tags);
    }
  });
}

const all = proxies.map(p => p.tag);
pushTo(['🌍 Auto'], all);

const reUS = /(?:🇺🇸|united\s*states|\busa\b|(^|\W)us(\W|$)|america|ashburn|new\s*york|los\s*angeles|dallas|miami|chicago|seattle|\blax\b|\biad\b|\bord\b|\bsea\b|\bdfw\b|\batl\b)/i;
const reNL = /(?:🇳🇱|netherlands|amsterdam|rotterdam|eindhoven|\bnl\b|(^|\W)nl(\W|$)|\bams\b)/i;
const rePL = /(?:🇵🇱|poland|warsaw|warszawa|wroclaw|wrocław|krakow|kraków|poznan|poznań|gdansk|gdańsk|\bpl\b|(^|\W)pl(\W|$))/i;

pushTo(['🇺🇸 USA (Auto)'], proxies.filter(p => reUS.test(p.tag)).map(p => p.tag));
pushTo(['🇳🇱 NL (Auto)'], proxies.filter(p => reNL.test(p.tag)).map(p => p.tag));
pushTo(['🇵🇱 PL (Auto)'], proxies.filter(p => rePL.test(p.tag)).map(p => p.tag));

let compatAdded = false;
config.outbounds.forEach(o => {
  if (Array.isArray(o.outbounds) && o.outbounds.length === 0) {
    if (!compatAdded) {
      config.outbounds.push({ tag: 'COMPATIBLE', type: 'direct' });
      compatAdded = true;
    }
    o.outbounds.push('COMPATIBLE');
  }
});

$content = JSON.stringify(config, null, 2);