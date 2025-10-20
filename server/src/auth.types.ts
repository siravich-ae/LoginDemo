// กำหนด type ของข้อมูลภายใน JWT Token
export type JwtPayload = {
  sub: number;             // id ของผู้ใช้
  email: string;           // อีเมลของผู้ใช้
  role: 'USER' | 'ADMIN';  // บทบาทของผู้ใช้ (สองแบบเท่านั้น)
};
