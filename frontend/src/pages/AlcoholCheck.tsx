import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAlcoholCheck, getAlcoholChecks } from '../api';
import type { AlcoholCheck as AlcoholCheckType } from '../types';

export default function AlcoholCheck() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'before' | 'after'>('before');
  const [value, setValue] = useState('0.000');
  const [result, setResult] = useState<'pass' | 'fail' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<AlcoholCheckType[]>([]);

  const loadHistory = () => {
    getAlcoholChecks().then((r) => setHistory(r.data));
  };

  useEffect(() => { loadHistory(); }, []);

  const handleSubmit = async () => {
    setError('');
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 0.999) {
      setError('0.000〜0.999 の範囲で入力してください');
      return;
    }
    setLoading(true);
    try {
      const res = await createAlcoholCheck({ phase, value: num });
      setResult(res.data.result);
      loadHistory();
    } catch {
      setError('送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/home')} className="text-white text-xl">←</button>
        <h1 className="text-lg font-bold">アルコールチェック</h1>
      </header>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Phase toggle */}
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm font-medium text-gray-600 mb-3">種別を選択</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setPhase('before'); setResult(null); }}
              className={`flex-1 py-4 rounded-xl text-base font-semibold border-2 ${
                phase === 'before' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              乗務前
            </button>
            <button
              onClick={() => { setPhase('after'); setResult(null); }}
              className={`flex-1 py-4 rounded-xl text-base font-semibold border-2 ${
                phase === 'after' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              乗務後
            </button>
          </div>
        </div>

        {/* Value input */}
        <div className="bg-white rounded-xl shadow p-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            測定値 (mg/L)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            max="0.999"
            value={value}
            onChange={(e) => { setValue(e.target.value); setResult(null); }}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-3xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* Result display */}
        {result && (
          <div className={`rounded-xl p-6 text-center font-bold text-2xl ${
            result === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {result === 'pass' ? '合格 (PASS)' : '不合格 (FAIL)'}
            <p className="text-base font-normal mt-1">
              {result === 'pass' ? '問題ありません' : '上長に報告してください'}
            </p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-xl py-4 text-base font-semibold shadow disabled:opacity-50 active:bg-blue-700"
        >
          {loading ? '送信中...' : '記録する'}
        </button>

        {/* History */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-700 mb-3">履歴</h2>
          {history.length === 0 ? (
            <p className="text-gray-400 text-sm">記録がありません</p>
          ) : (
            <div className="space-y-2">
              {history.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      {c.phase === 'before' ? '乗務前' : '乗務後'}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(c.measured_at).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{parseFloat(c.value).toFixed(3)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.result === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {c.result === 'pass' ? '合格' : '不合格'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
