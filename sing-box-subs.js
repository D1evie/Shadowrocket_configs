const { type, name } = $arguments;

let config = JSON.parse($files[0]);
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
});

config.outbounds.push(...proxies);

function pushToTargets(targetTags, tags) {
  config.outbounds.forEach(o => {
    if (Array.isArray(o.outbounds) && targetTags.includes(o.tag)) {
      o.outbounds.push(...tags);
    }
  });
}

const allTags = proxies.map(p => p.tag);
pushToTargets(['all', 'all-auto'], allTags);

const reUS = /(?:🇺🇸|united\s*states|\busa\b|(^|\W)us(\W|$)|america|ashburn|new\s*york|los\s*angeles|dallas|miami|chicago|seattle|\blax\b|\biad\b|\bord\b|\bsea\b|\bdfw\b|\batl\b)/i;
const reNL = /(?:🇳🇱|netherlands|amsterdam|rotterdam|eindhoven|\bnl\b|(^|\W)nl(\W|$)|\bams\b)/i;
const rePL = /(?:🇵🇱|poland|warsaw|warszawa|wroclaw|wrocław|krakow|kraków|poznan|poznań|gdansk|gdańsk|\bpl\b|(^|\W)pl(\W|$))/i;

const usTags = proxies.filter(p => reUS.test(p.tag)).map(p => p.tag);
const nlTags = proxies.filter(p => reNL.test(p.tag)).map(p => p.tag);
const plTags = proxies.filter(p => rePL.test(p.tag)).map(p => p.tag);

pushToTargets(['🇺🇸 USA (Auto)'], usTags);
pushToTargets(['🇳🇱 NL (Auto)'], nlTags);
pushToTargets(['🇵🇱 PL (Auto)'], plTags);

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