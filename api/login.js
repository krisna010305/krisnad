const { allUsers, sign, safeUser, json } = require('./_common');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const { username = '', password = '' } = req.body || {};
    const user = allUsers().find(u => u.username === String(username).trim() && u.password === String(password));
    if (!user) return json(res, 401, { error: 'Username atau password salah.' });
    const token = sign({ uid: user.id, username: user.username, role: user.role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    return json(res, 200, { user: safeUser(user), token });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};
