import crypto from 'node:crypto';

const MAX_INIT_DATA_AGE = 24 * 60 * 60; // 24 hours

function verifyTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');
  const authDate = Number(params.get('auth_date'));
  const userRaw = params.get('user');

  if (!receivedHash || !authDate || !userRaw) return null;

  const now = Math.floor(Date.now() / 1000);
  if (authDate > now + 60 || now - authDate > MAX_INIT_DATA_AGE) return null;

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const a = Buffer.from(calculatedHash, 'hex');
  const b = Buffer.from(receivedHash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(userRaw);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!botToken || !supabaseUrl || !supabaseSecretKey) {
    console.error('Missing server environment variables');
    return res.status(500).json({ ok: false, error: 'Server is not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const initData = body?.initData;
    const telegramUser = verifyTelegramInitData(initData, botToken);

    if (!telegramUser?.id) {
      return res.status(401).json({ ok: false, error: 'Invalid Telegram session' });
    }

    const telegramId = String(telegramUser.id);
    const row = {
      telegram_id: telegramId,
      username: telegramUser.username ?? null,
      first_name: telegramUser.first_name ?? null,
      last_name: telegramUser.last_name ?? null,
      last_seen: new Date().toISOString(),
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/users?on_conflict=telegram_id`, {
      method: 'POST',
      headers: {
        apikey: supabaseSecretKey,
        Authorization: `Bearer ${supabaseSecretKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(row),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('Supabase error:', response.status, data);
      return res.status(500).json({ ok: false, error: 'Could not save user' });
    }

    const user = Array.isArray(data) ? data[0] : data;

    return res.status(200).json({
      ok: true,
      user: {
        telegram_id: String(user.telegram_id),
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        balance: user.balance,
        total_earned: user.total_earned,
        mining_rate: user.mining_rate,
        referral_bonus: user.referral_bonus,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Unexpected server error' });
  }
}
