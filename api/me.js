const { auth, safeUser, json } = require('./_common');
module.exports = async (req, res) => {
  const user = auth(req);
  if (!user) return json(res, 401, { error: 'Sesi login tidak valid atau sudah kedaluwarsa.' });
  return json(res, 200, { user: safeUser(user) });
};
