const { type, name } = $arguments;

let config = JSON.parse($files[0]);

const proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
});

config.outbounds.push(...proxies);

function setOutbounds(tag, tags) {
  const o = config.outbounds.find(x => Array.isArray(x.outbounds) && x.tag === tag);
  if (o) o.outbounds = tags.slice();
}

const allTags = proxies.map(p => p.tag);

const reUS = /(?:🇺🇸|united\s*states|\busa\b|(^|\W)us(\W|$)|america|ashburn|new\s*york|los\s*angeles|dallas|miami|chicago|seattle|\blax\b|\biad\b|\bord\b|\bsea\b|\bdfw\b|\batl\b)/i;
const reNL = /(?:🇳🇱|netherlands|amsterdam|rotterdam|eindhoven|\bnl\b|(^|\W)nl(\W|$)|\bams\b)/i;
const rePL = /(?:🇵🇱|poland|warsaw|warszawa|wroclaw|wrocław|krakow|kraków|poznan|poznań|gdansk|gdańsk|\bpl\b|(^|\W)pl(\W|$))/i;

const usTags = proxies.filter(p => reUS.test(p.tag)).map(p => p.tag);
const nlTags = proxies.filter(p => reNL.test(p.tag)).map(p => p.tag);
const plTags = proxies.filter(p => rePL.test(p.tag)).map(p => p.tag);

setOutbounds('🌍 Auto', allTags);
setOutbounds('🇺🇸 USA (Auto)', usTags);
setOutbounds('🇳🇱 Netherlands (Auto)', nlTags);
setOutbounds('🇵🇱 Poland (Auto)', plTags);

$content = JSON.stringify(config, null, 2);