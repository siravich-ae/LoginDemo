import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

type Role = 'USER' | 'ADMIN';

export default function Register() {
  const nav = useNavigate();

  const [form, setForm] = useState<{
    email: string;
    password: string;
    fullName: string;
    role: Role;
  }>({
    email: '',
    password: '',
    fullName: '',
    role: 'USER',
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [ok, setOk] = useState<string>('');
  const [showPwd, setShowPwd] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setOk('');
    setLoading(true);

    try {
      // เรียก API สมัครสมาชิก
      await api.post('/auth/register', form);

      setOk('Registered successfully. Redirecting to login…');
      // สมัครสำเร็จ → กลับไปหน้า login
      setTimeout(() => nav('/login'), 900);
    } catch (err: any) {
      // รองรับ error จาก zod (flatten), หรือ message ปกติ
      const zodIssues =
        err?.response?.data?.fieldErrors ||
        err?.response?.data?.formErrors;
      const message =
        err?.response?.data?.message ||
        (Array.isArray(zodIssues)
          ? zodIssues.join(', ')
          : 'Register failed');
      setMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create account</h2>

      <form className="form" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="Full name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ flex: 1 }}
            type={showPwd ? 'text' : 'password'}
            placeholder="Password (min 8 chars)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            title={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? 'Hide' : 'Show'}
          </button>
        </div>

        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <div style={{ marginTop: 10 }}>
        <small>
          Already have an account? <Link to="/login">Sign in</Link>
        </small>
      </div>

      {msg && <p className="msg">{msg}</p>}
      {ok && <p className="msg" style={{ color: '#4ade80' }}>{ok}</p>}
    </div>
  );
}
