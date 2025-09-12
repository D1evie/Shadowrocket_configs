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
const usTags = proxies.filter(p => /@US\b/.test(p.tag)).map(p => p.tag);
const nlTags = proxies.filter(p => /@NL\b/.test(p.tag)).map(p => p.tag);
const plTags = proxies.filter(p => /@PL\b/.test(p.tag)).map(p => p.tag);

setOutbounds('🌍 Auto', allTags);
setOutbounds('🇺🇸 USA (Auto)', usTags);
setOutbounds('🇳🇱 Netherlands (Auto)', nlTags);
setOutbounds('🇵🇱 Poland (Auto)', plTags);

$content = JSON.stringify(config, null, 2);