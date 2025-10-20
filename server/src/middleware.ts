import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload as CustomPayload } from './auth.types';

// type guard ตรวจว่า object เป็น CustomPayload จริง ๆ
function isCustomPayload(p: any): p is CustomPayload {
  return p && typeof p === 'object' && 'sub' in p && 'email' in p && 'role' in p;
}

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  try {
    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET as string;

    const decoded = jwt.verify(token, secret);

    if (!isCustomPayload(decoded)) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    (req as any).user = decoded; // ตรงนี้คือ CustomPayload แน่นอนแล้ว
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response,next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)){
      return res.status(403).json({message: 'Forbidden'});
    }
    next();
  };
}


