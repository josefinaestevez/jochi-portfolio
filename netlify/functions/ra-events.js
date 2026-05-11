const RA_SLUG = 'jochi';

function eventsQuery(type) {
  return JSON.stringify({
    query: `{
      artist(slug: "${RA_SLUG}") {
        events(type: ${type}, limit: 20) {
          id
          title
          date
          contentUrl
          venue {
            name
            area { name country { name } }
          }
        }
      }
    }`
  });
}

exports.handler = async (event) => {
  const type = event.queryStringParameters?.type || 'FROMDATE';

  try {
    const res = await fetch('https://ra.co/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://ra.co/',
      },
      body: eventsQuery(type),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
