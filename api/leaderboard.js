const { auth, leaderboard, rankOf, json } = require('./_common');
module.exports = async (req, res) => {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  const user = auth(req);
  if (!user) return json(res, 401, { error: 'Unauthorized' });
  try {
    const rows = await leaderboard();
    return json(res, 200, { rows, me: rankOf(rows, user), updatedAt: Date.now() });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
