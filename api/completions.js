const crypto = require('crypto');
const { redis, auth, leaderboard, rankOf, json } = require('./_common');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const user = auth(req);
  if (!user) return json(res, 401, { error: 'Unauthorized' });

  try {
    const body = req.body || {};
    const runId = String(body.runId || '').trim();
    const packageResults = Array.isArray(body.packageResults) ? body.packageResults : [];
    if (!runId || !/^[A-Za-z0-9._:-]{8,120}$/.test(runId)) return json(res, 400, { error: 'runId tidak valid.' });
    if (packageResults.length !== 4 || !packageResults.every(x => x && x.completed === true)) {
      return json(res, 400, { error: 'Poin hanya diberikan setelah Sesi 1–4 selesai.' });
    }

    const safeKey = `completion:${user.username.toLowerCase()}:${crypto.createHash('sha256').update(runId).digest('hex')}`;
    const locked = await redis.set(safeKey, JSON.stringify({ at: Date.now() }), { nx: true, ex: 60 * 60 * 24 * 90 });
    const duplicate = locked !== 'OK';

    if (!duplicate) {
      await redis.incr(`score:${user.username.toLowerCase()}`);
      await redis.set(`completion:last:${user.username.toLowerCase()}`, JSON.stringify({
        runId,
        at: new Date().toISOString(),
        totalScore: packageResults.reduce((s, r) => s + Number(r.earned || 0), 0),
        totalCorrect: packageResults.reduce((s, r) => s + Number(r.correct || 0), 0),
        totalWrong: packageResults.reduce((s, r) => s + Number(r.wrong || 0), 0),
        wrongQuestions: packageResults.flatMap((r, i) => (r.wrongQuestions || []).map(q => ({ session: i + 1, ...q })))
      }), { ex: 60 * 60 * 24 * 90 });
    }

    const rows = await leaderboard();
    return json(res, 200, { ok: true, duplicate, rows, me: rankOf(rows, user) });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
