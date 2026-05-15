import http from 'node:http';
import { fakeTheses } from './data/fakes.js';

const PORT = process.env.PORT || 3000;  // Use porta diferente (3000 por defeito)

const theses = fakeTheses.map((thesis) => ({ ...thesis, university: { ...thesis.university } }));

const server = http.createServer(async (request, response) => {
  // CORS headers PRIMEIRO, antes de qualquer resposta
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Access-Control-Max-Age', '3600');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? `localhost:${PORT}`}`);

  try {
    if (request.method === 'GET' && requestUrl.pathname === '/api/search') {
      console.log(`[${new Date().toISOString()}] GET /api/search?query=${requestUrl.searchParams.get('query')}&page=${requestUrl.searchParams.get('page')}&size=${requestUrl.searchParams.get('size')}`);
      return handleSearch(requestUrl, response);
    }

    return sendJson(response, 404, { error: `Route not found: ${request.method} ${requestUrl.pathname}` });
  } catch (error) {
    console.error('Error:', error);
    return sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Unexpected fake backend error'
    });
  }
});

server.listen(PORT, () => {
  console.log(`Fake UniDoc Finder API running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/search?query=&page=1&size=10');
});

function handleSearch(requestUrl, response) {
  const query = normalizeText(requestUrl.searchParams.get('query') ?? '');
  const page = readPositiveInteger(requestUrl.searchParams.get('page'), 1);
  const size = readPositiveInteger(requestUrl.searchParams.get('size'), 10);

  const filteredTheses = theses.filter((thesis) => {
    if (!query) return true;

    return normalizeText([
      thesis.title,
      thesis.abstract,
      String(thesis.year),
      thesis.url,
      thesis.university.name,
      thesis.university.repoUrl
    ].join(' ')).includes(query);
  });

  const paginatedResults = paginate(filteredTheses, page, size);
  console.log(`   ✅ Found ${filteredTheses.length} results, returning ${paginatedResults.length} (page ${page}, size ${size})`);

  return sendJson(response, 200, paginatedResults);
}

function paginate(items, page, size) {
  const startIndex = (page - 1) * size;
  return items.slice(startIndex, startIndex + size);
}

function normalizeText(value) {
  return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
}

function readPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload, null, 2));
}