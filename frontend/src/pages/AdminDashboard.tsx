import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, approveReport, rejectReport } from '../api';
import { useAuth } from '../context/AuthContext';
import type { DashboardStats, DrivingReport } from '../types';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    setLoading(true);
    getDashboard()
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await approveReport(id);
      load();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(true);
    try {
      await rejectReport(id, rejectNote);
      setRejectTarget(null);
      setRejectNote('');
      load();
    } finally {
      setActionLoading(false);
    }
  };

  const pendingReports = stats?.recent_reports.filter((r: DrivingReport) => r.status === 'pending') || [];
  const failChecks = stats?.recent_checks.filter((c) => c.result === 'fail') || [];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">管理ダッシュボード</h1>
          <p className="text-blue-200 text-sm">{user?.name}</p>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={() => navigate('/records')} className="text-blue-200 text-sm underline">記録一覧</button>
          <button onClick={logout} className="text-blue-200 text-sm underline">ログアウト</button>
        </div>
      </header>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {loading ? (
          <p className="text-center text-gray-400 py-8">読み込み中...</p>
        ) : stats ? (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-yellow-700">{stats.pending}</div>
                <div className="text-sm text-yellow-600 mt-1">未確認</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-700">{stats.approved}</div>
                <div className="text-sm text-green-600 mt-1">承認済み</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-700">{stats.rejected}</div>
                <div className="text-sm text-red-600 mt-1">差し戻し</div>
              </div>
              <div className="bg-red-100 border border-red-300 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-800">{stats.alcohol_fails}</div>
                <div className="text-sm text-red-700 mt-1">アルコール異常</div>
              </div>
            </div>

            {/* Pending reports */}
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">承認待ち日報</h2>
              {pendingReports.length === 0 ? (
                <p className="text-gray-400 text-sm">承認待ちの日報はありません</p>
              ) : (
                <div className="space-y-3">
                  {pendingReports.map((r: DrivingReport) => (
                    <div key={r.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">{r.report_date}</span>
                        <button
                          onClick={() => navigate(`/records/${r.id}`)}
                          className="text-blue-600 text-xs underline"
                        >
                          詳細
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{r.driver_name} / {r.vehicle_name}</p>
                      <p className="text-sm text-gray-600 mb-3 truncate">{r.work_content}</p>

                      {rejectTarget === r.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="差し戻し理由（任意）"
                            rows={2}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(r.id)}
                              disabled={actionLoading}
                              className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
                            >
                              差し戻し確定
                            </button>
                            <button
                              onClick={() => { setRejectTarget(null); setRejectNote(''); }}
                              className="flex-1 bg-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={actionLoading}
                            className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
                          >
                            承認
                          </button>
                          <button
                            onClick={() => setRejectTarget(r.id)}
                            disabled={actionLoading}
                            className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
                          >
                            差し戻し
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Alcohol anomalies */}
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">
                アルコール異常記録
                {failChecks.length > 0 && (
                  <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{failChecks.length}</span>
                )}
              </h2>
              {failChecks.length === 0 ? (
                <p className="text-gray-400 text-sm">異常記録はありません</p>
              ) : (
                <div className="space-y-2">
                  {failChecks.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-red-100 last:border-0 bg-red-50 rounded-lg px-3">
                      <div>
                        <span className="text-sm font-medium text-red-700">{c.driver_name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {c.phase === 'before' ? '乗務前' : '乗務後'}
                        </span>
                        <div className="text-xs text-gray-400">
                          {new Date(c.measured_at).toLocaleString('ja-JP')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-700 font-mono">
                          {parseFloat(c.value).toFixed(3)}
                        </div>
                        <div className="text-xs text-red-500">mg/L</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-400">データを取得できませんでした</p>
        )}
      </div>
    </div>
  );
}
