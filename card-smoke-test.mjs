
const base = 'http://localhost:3001';
const unique = Date.now();
const email = `cardtest-${unique}@example.com`;
const password = 'TemporaryTestPassword123!';
const slug = `cardtest-${unique}`;

async function request(path, method = 'GET', body, token) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json();
  return { status: response.status, data };
}

function check(label, actual, expected) {
  const passed = actual === expected;
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}: ${actual}`);
  if (!passed) process.exitCode = 1;
}

const registration = await request('/auth/register', 'POST', {
  name: 'Card Test User',
  email,
  password,
});

check('Registration', registration.status, 201);

const token = registration.data.accessToken;

if (!token) {
  console.error('Registration did not return a token.');
  process.exit(1);
}

const created = await request('/cards', 'POST', {
  slug,
  fullName: 'Alex Morgan',
  jobTitle: 'Software Engineer',
  company: 'Demo Company',
  email: 'alex@example.com',
  website: 'https://example.com',
}, token);

check('Create card', created.status, 201);

const cardId = created.data.id;

if (!cardId) {
  console.error('Card creation did not return an ID.');
  process.exit(1);
}

const listed = await request('/cards', 'GET', undefined, token);
check('List cards', listed.status, 200);

const publicCard = await request(`/cards/public/${slug}`);
check('Public card', publicCard.status, 200);

const updated = await request(`/cards/${cardId}`, 'PATCH', {
  jobTitle: 'Senior Software Engineer',
}, token);

check('Update card', updated.status, 200);

const unauthorized = await request(`/cards/${cardId}`);
check('Reject unauthenticated access', unauthorized.status, 401);

const removed = await request(`/cards/${cardId}`, 'DELETE', undefined, token);
check('Deactivate card', removed.status, 200);

const inactive = await request(`/cards/public/${slug}`);
check('Hide inactive public card', inactive.status, 404);

console.log('\nBusiness-card API smoke test completed.');
console.log("Running card smoke test...");
