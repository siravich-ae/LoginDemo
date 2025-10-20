import { useEffect, useState } from 'react';
import { api } from '../api';

type ProfileType = { Id:number; Email:string; FullName:string; Role:string; CreatedAt:string };

export default function Profile() {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/auth/profile')
      .then(r => setProfile(r.data.profile))
      .catch(() => setMsg('Failed to load profile'));
  }, []);

  const loadUsers = async () => {
    setMsg('');
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data.users);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Failed to load users');
    }
  };

  const logout = () => { localStorage.removeItem('token'); window.location.href = '/login'; };

  return (
    <div className="card">
      <h2>Profile</h2>
      {profile ? (
        <div className="grid">
          <div><b>Name:</b> {profile.FullName}</div>
          <div><b>Email:</b> {profile.Email}</div>
          <div><b>Role:</b> {profile.Role}</div>
          <div><b>Created:</b> {new Date(profile.CreatedAt).toLocaleString()}</div>
        </div>
      ) : <p>Loading...</p>}

      <div className="row">
        <button onClick={logout}>Logout</button>
        <button onClick={loadUsers} title="ADMIN only">Load all users (ADMIN)</button>
      </div>

      {msg && <p className="msg">{msg}</p>}

      {users.length > 0 && (
        <>
          <h3>Users</h3>
          <table className="table">
            <thead><tr><th>Id</th><th>Email</th><th>Name</th><th>Role</th><th>Created</th></tr></thead>
            <tbody>
              {users.map((u:any) => (
                <tr key={u.Id}>
                  <td>{u.Id}</td><td>{u.Email}</td><td>{u.FullName}</td>
                  <td>{u.Role}</td><td>{new Date(u.CreatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
