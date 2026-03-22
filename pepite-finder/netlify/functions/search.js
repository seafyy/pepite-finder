exports.handler = async function(event) {
  const { q, maxPrice, cat } = event.queryStringParameters || {};

  if (!q) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing query' }) };
  }

  const RAPIDAPI_KEY = '0c87e93a52msh57b015d02c22896p1ef01djsn35ae445a0258';

  try {
    const url = `https://ebay-search-result.p.rapidapi.com/search/${encodeURIComponent(q)}?marketplace_id=EBAY_FR&limit=50&sort=price`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'ebay-search-result.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.results || data.itemSummaries || data.items || [];

    const maxP = parseFloat(maxPrice) || 9999;

    const items = raw.map(item => {
      const price = parseFloat(
        item.price?.value ||
        item.price ||
        item.sellingStatus?.[0]?.currentPrice?.[0]?.['__value__'] ||
        0
      );
      return {
        title: item.title?.[0] || item.title || 'Annonce eBay',
        price: Math.round(price * 100) / 100,
        location: item.postalCode || item.location || item.itemLocation?.city || 'France',
        condition: item.condition?.[0]?.conditionDisplayName?.[0] || item.condition || 'Occasion',
        bids: parseInt(item.sellingStatus?.[0]?.bidCount?.[0] || item.bidCount || 0),
        url: item.viewItemURL?.[0] || item.url || item.itemWebUrl || null
      };
    }).filter(i => i.price > 0 && i.price <= maxP);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ items, total: items.length })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message, items: [] })
    };
  }
};
