const tg = window.Telegram?.WebApp;

function setStatus(text, type = '') {
  const el = document.getElementById('status');
  el.textContent = text;
  el.className = `status ${type}`;
}

function setMessage(text, type = '') {
  const el = document.getElementById('message');
  el.textContent = text;
  el.className = `message ${type}`;
}

function formatAmount(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
}

function renderUser(user) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Telegram User';
  document.getElementById('name').textContent = fullName;
  document.getElementById('username').textContent = user.username ? `@${user.username}` : `ID: ${user.telegram_id}`;
  document.getElementById('avatar').textContent = (user.first_name || 'S').charAt(0).toUpperCase();
  document.getElementById('balance').textContent = formatAmount(user.balance);
  document.getElementById('totalEarned').textContent = formatAmount(user.total_earned);
  document.getElementById('miningRate').textContent = formatAmount(user.mining_rate);
  document.getElementById('referralBonus').textContent = formatAmount(user.referral_bonus);
}

async function connectTelegramUser() {
  if (!tg) {
    setStatus('Open this app from Telegram', 'error');
    setMessage('This page must be opened inside your Telegram Mini App.', 'error');
    return;
  }

  tg.ready();
  tg.expand();

  const initData = tg.initData;
  if (!initData) {
    setStatus('Telegram session not available', 'error');
    setMessage('Open the Mini App from @S_Money_Earn_Bot to continue.', 'error');
    return;
  }

  try {
    const response = await fetch('/api/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not connect your account');
    }

    renderUser(data.user);
    setStatus('Telegram account connected ✓', 'success');
    setMessage(`Welcome, ${data.user.first_name || 'user'}! Your account is saved in S MONEY EARN.`, 'success');
  } catch (error) {
    console.error(error);
    setStatus('Connection failed', 'error');
    setMessage(error.message || 'Could not connect your account.', 'error');
  }
}

connectTelegramUser();
