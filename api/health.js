const { redis, json } = require('./_common');
module.exports = async (req, res) => {
  try {
    await redis.set('terakoya:health', Date.now(), { ex: 60 });
    return json(res, 200, { ok: true, storage: 'upstash-redis' });
  } catch (e) {
    return json(res, 500, { ok: false, error: e.message });
  }
};
