import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';
const JWT_EXPIRES_IN = '7d';

const SALT_LENGTH = 32;
const HASH_ALGO = 'sha256';
const HASH_ITERATIONS = 10000;
const HASH_KEYLEN = 64;

function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const generatedSalt = salt || crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, HASH_ITERATIONS, HASH_KEYLEN, HASH_ALGO).toString('hex');
  return { salt: generatedSalt, hash };
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const { hash } = hashPassword(password, salt);
  return hash === storedHash;
}

const loginAttempts = new Map<string, { count: number; windowStart: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || (now - record.windowStart) > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

router.post('/register', async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const { salt, hash } = hashPassword(password);
    const userId = 'user-' + Date.now().toString() + '-' + crypto.randomBytes(4).toString('hex');
    const userRole = email.toLowerCase() === 'annierfq01@gmail.com' ? 'admin' : 'cliente';

    const { data: dbUser, error: dbError } = await supabaseAdmin.from('users').upsert({
      id: userId,
      email: email.toLowerCase(),
      name,
      password: hash,
      salt,
      role: userRole,
      active: true,
      created_at: new Date().toISOString(),
    }).select().single();

    if (dbError) throw dbError;

    const token = jwt.sign(
      { id: dbUser.id, email: dbUser.email, role: dbUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, salt: _s, ...userWithoutPassword } = dbUser;
    res.status(201).json({ ...userWithoutPassword, session: { access_token: token } });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 1 hora.' });
    }

    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!dbUser) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!dbUser.active) {
      return res.status(403).json({ error: 'Cuenta bloqueada. Contacta al administrador.' });
    }

    if (!dbUser.salt || !dbUser.password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValid = verifyPassword(password, dbUser.salt, dbUser.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: dbUser.id, email: dbUser.email, role: dbUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    loginAttempts.delete(clientIp);

    const { password: _, salt: _s, ...userWithoutPassword } = dbUser;
    res.json({
      ...userWithoutPassword,
      session: { access_token: token },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
  }
});

router.post('/google-callback', async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(access_token);
    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { email, user_metadata } = userData.user;
    const userEmail = email || '';
    const userName = user_metadata?.full_name || user_metadata?.name || userEmail.split('@')[0] || 'Google User';

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      if (!existingUser.active) {
        return res.status(403).json({ error: 'Cuenta bloqueada. Contacta al administrador.' });
      }
      const token = jwt.sign(
        { id: existingUser.id, email: existingUser.email, role: existingUser.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      const { password: _, salt: _s, ...userWithoutPassword } = existingUser;
      return res.json({ ...userWithoutPassword, isGoogleAuth: true, session: { access_token: token } });
    }

    const userId = userData.user.id;
    const { data: newUser, error: dbError } = await supabaseAdmin.from('users').insert({
      id: userId,
      email: userEmail.toLowerCase(),
      name: userName,
      role: userEmail.toLowerCase() === 'annierfq01@gmail.com' ? 'admin' : 'cliente',
      active: true,
      created_at: new Date().toISOString(),
    }).select().single();

    if (dbError) throw dbError;

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    const { password: _, salt: _s, ...userWithoutPassword } = newUser;
    res.json({ ...userWithoutPassword, isGoogleAuth: true, session: { access_token: token } });
  } catch (err) {
    console.error('[Auth] Google callback error:', err);
    res.status(500).json({ error: 'Error al procesar autenticación con Google' });
  }
});

export default router;
