const { handle } = require('./handler');

let client, PutItemCommand;
function ddb() {
  if (!client) {
    const sdk = require('@aws-sdk/client-dynamodb'); // included in the Lambda runtime
    client = new sdk.DynamoDBClient({});
    PutItemCommand = sdk.PutItemCommand;
  }
  return client;
}

async function logCheck(responseBody) {
  try {
    const data = JSON.parse(responseBody);
    const summary = {};
    for (const [cat, row] of Object.entries(data.results)) {
      summary[cat] = row.map(r => r.verdict);
    }
    const now = Date.now();
    await ddb().send(new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        id: { S: now + '-' + Math.random().toString(36).slice(2, 8) },
        ts: { S: new Date(now).toISOString() },
        summary: { S: JSON.stringify(summary) },
        ttl: { N: String(Math.floor(now / 1000) + 30 * 86400) },
      },
    }));
  } catch (e) {
    console.error('log failed', e); // logging must never break a check
  }
}

exports.handler = async (event) => {
  const method = event.requestContext.http.method;
  const path = event.rawPath;
  let body = event.body || '';
  if (event.isBase64Encoded) body = Buffer.from(body, 'base64').toString('utf8');
  if (body.length > 100000) return { statusCode: 413, body: 'Too large' };

  const out = await handle(method, path, body);
  if (method === 'POST' && path === '/check' && out.status === 200 && process.env.TABLE_NAME) {
    await logCheck(out.body);
  }
  return {
    statusCode: out.status,
    headers: { 'Content-Type': out.type, 'Cache-Control': 'no-store' },
    body: out.body,
  };
};