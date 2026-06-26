import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'manager' ? '/admin' : '/home');
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700">DriveGuard</h1>
          <p className="text-gray-500 text-sm mt-1">フリート管理システム</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-3 text-base font-semibold mt-2 disabled:opacity-50 hover:bg-blue-700 active:bg-blue-800"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400 text-center mb-2">デモ用クイックログイン</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setEmail('driver1@example.com'); setPassword('password123'); }}
              className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 text-xs font-medium hover:bg-gray-200 active:bg-gray-300"
            >
              運転者でログイン
            </button>
            <button
              type="button"
              onClick={() => { setEmail('manager@example.com'); setPassword('password123'); }}
              className="flex-1 bg-blue-50 text-blue-700 rounded-lg py-2 text-xs font-medium hover:bg-blue-100 active:bg-blue-200"
            >
              管理者でログイン
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
