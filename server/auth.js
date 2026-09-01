const crypto = require('crypto');
const express = require('express');
const store = require('./store');

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

function isConfigured() {
  return Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);
}

function appUrl(req) {
  return process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
}

const router = express.Router();

router.get('/github', (req, res) => {
  if (!isConfigured()) {
    return res
      .status(500)
      .send(
        'Login con GitHub non configurato. Imposta GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET (vedi README) e riavvia il server.'
      );
  }
  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;
  const redirectUri = `${appUrl(req)}/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'read:user',
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || state !== req.session.oauthState) {
    console.error('GitHub OAuth state mismatch:', {
      sessionId: req.sessionID,
      hasCode: Boolean(code),
      receivedState: state,
      expectedState: req.session.oauthState,
      cookieHeader: req.headers.cookie,
    });
    return res.status(400).send('Login fallito: richiesta non valida o scaduta. Riprova.');
  }
  delete req.session.oauthState;

  try {
    const redirectUri = `${appUrl(req)}/auth/github/callback`;
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('GitHub OAuth token error:', tokenData);
      return res.status(400).send('Login fallito: impossibile ottenere il token da GitHub.');
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'kedalion-app',
        Accept: 'application/vnd.github+json',
      },
    });
    const ghUser = await userRes.json();
    if (!ghUser || !ghUser.id) {
      console.error('GitHub user fetch error:', ghUser);
      return res.status(400).send('Login fallito: impossibile leggere il profilo GitHub.');
    }

    const user = store.findOrCreateUser({
      githubId: ghUser.id,
      username: ghUser.login,
      avatarUrl: ghUser.avatar_url,
    });
    req.session.userId = user.id;
    res.redirect('/');
  } catch (err) {
    console.error('GitHub OAuth callback error:', err);
    res.status(500).send('Login fallito per un errore imprevisto. Riprova.');
  }
});

router.get('/local', (req, res) => {
  const user = store.getOrCreateLocalUser();
  req.session.userId = user.id;
  res.redirect('/');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.status(204).end());
});

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'not authenticated' });
  next();
}

module.exports = { router, requireAuth, isConfigured };
