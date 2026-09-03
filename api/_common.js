const crypto = require('crypto');
const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function json(res, status, body, headers = {}) {
  res.status(status).json(body);
}

function parseStudents() {
  const raw = process.env.MURID_DATA || '{}';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('MURID_DATA di Environment Variables bukan JSON yang valid.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('MURID_DATA harus berupa object JSON.');
  }
  return parsed;
}

function allUsers() {
  const students = parseStudents();
  const rows = Object.entries(students).map(([username, data]) => ({
    id: userId(username),
    username,
    role: 'student',
    password: String(data?.password ?? '')
  }));
  if (ADMIN_USERNAME) rows.push({ id: userId(ADMIN_USERNAME), username: ADMIN_USERNAME, role: 'admin', password: ADMIN_PASSWORD });
  return rows;
}

function userId(username) {
  return crypto.createHash('sha256').update(`terakoya:${String(username).trim().toLowerCase()}`).digest('hex').slice(0, 24);
}

function sign(payload) {
  if (!SESSION_SECRET) throw new Error('SESSION_SECRET belum diatur.');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token) {
  if (!token || !SESSION_SECRET) return null;
  const [body, sig] = String(token).split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

function auth(req) {
  const header = String(req.headers.authorization || '');
  const token = header.replace(/^Bearer\s+/i, '');
  const payload = verify(token);
  if (!payload) return null;
  const user = allUsers().find(u => u.id === payload.uid && u.username === payload.username && u.role === payload.role);
  return user || null;
}

function safeUser(u) { return { id: u.id, username: u.username, role: u.role }; }

async function leaderboard() {
  const users = allUsers().filter(u => u.role === 'student');
  const pipe = redis.pipeline();
  users.forEach(u => pipe.get(`score:${u.username.toLowerCase()}`));
  const values = await pipe.exec();
  return users
    .map((u, i) => ({ user_id: u.id, username: u.username, points: Number(values[i] || 0) }))
    .sort((a, b) => (b.points - a.points) || a.username.localeCompare(b.username, 'id'));
}

function rankOf(rows, user) {
  const idx = rows.findIndex(r => r.user_id === user.id);
  return idx < 0 ? null : idx + 1;
}

module.exports = { redis, json, allUsers, userId, sign, auth, safeUser, leaderboard, rankOf };
