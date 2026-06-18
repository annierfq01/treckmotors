import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: 'admin' | 'cliente';
        active: boolean;
      };
    }
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
        const { data: dbUser } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', decoded.email.toLowerCase())
          .maybeSingle();

        if (dbUser && dbUser.active) {
          req.user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            active: dbUser.active,
          };
          return next();
        }
      } catch {
        // Token inválido o expirado, continuar a otros métodos
      }
    }

    const userEmail = req.headers['x-user-email'] as string;
    if (userEmail) {
      const { data: dbUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', userEmail.toLowerCase())
        .maybeSingle();

      if (dbUser && dbUser.active) {
        req.user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: 'cliente',
          active: dbUser.active,
        };
        return next();
      }
    }

    return res.status(401).json({ error: 'Token de autenticación requerido' });
  } catch (err) {
    console.error('[Auth Middleware] Error:', err);
    return res.status(500).json({ error: 'Error de autenticación en el servidor' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }

  next();
}
