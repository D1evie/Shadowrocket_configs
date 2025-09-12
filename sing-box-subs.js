const { type, name } = $arguments;

let config = JSON.parse($files[0]);
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
});

config.outbounds.push(...proxies);

function fill(tags, regex) {
  const list = proxies.filter(p => regex.test(p.tag)).map(p => p.tag);
  config.outbounds.forEach(o => {
    if (Array.isArray(o.outbounds) && tags.includes(o.tag)) {
      o.outbounds.push(...list);
    }
  });
}

function fillAll(tags) {
  const list = proxies.map(p => p.tag);
  config.outbounds.forEach(o => {
    if (Array.isArray(o.outbounds) && tags.includes(o.tag)) {
      o.outbounds.push(...list);
    }
  });
}

fillAll(['all', 'all-auto']);

const reUS = /(?:🇺🇸|united\s*states|\busa\b|(?:^|\W)us(?:\W|$)|america|ashburn|new\s*york|los\s*angeles|dallas|miami|chicago|seattle|lax|iad|ord|sea|dfw|atl)/i;
const reNL = /(?:🇳🇱|netherlands|amsterdam|rotterdam|eindhoven|\bnl\b|(?:^|\W)nl(?:\W|$)|\bams\b)/i;
const rePL = /(?:🇵🇱|poland|warsaw|warszawa|wroclaw|wrocław|krakow|kraków|poznan|poznań|gdansk|gdańsk|\bpl\b|(?:^|\W)pl(?:\W|$))/i;

fill(['us', 'us-auto', 'USA', 'USA-auto'], reUS);
fill(['nl', 'nl-auto', 'netherlands', 'netherlands-auto'], reNL);
fill(['pl', 'pl-auto', 'poland', 'poland-auto'], rePL);

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