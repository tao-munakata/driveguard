import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports } from '../api';
import { useAuth } from '../context/AuthContext';
import type { DrivingReport } from '../types';

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">承認済み</span>;
  if (status === 'rejected') return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">差し戻し</span>;
  return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">未確認</span>;
}

export default function RecordList() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<DrivingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    getReports({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      status: statusFilter || undefined,
    })
      .then((r) => setReports(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(user?.role === 'manager' ? '/admin' : '/home')} className="text-white text-xl">←</button>
          <h1 className="text-lg font-bold">記録一覧</h1>
        </div>
        <button onClick={logout} className="text-blue-200 text-sm underline">ログアウト</button>
      </header>

      {/* Filters */}
      <div className="bg-white shadow px-4 py-3 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">開始日</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">終了日</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
          </div>
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-sm">
            <option value="">すべてのステータス</option>
            <option value="pending">未確認</option>
            <option value="approved">承認済み</option>
            <option value="rejected">差し戻し</option>
          </select>
          <button onClick={load} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            検索
          </button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <p className="text-center text-gray-400 py-8">読み込み中...</p>
        ) : reports.length === 0 ? (
          <p className="text-center text-gray-400 py-8">記録が見つかりません</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id}
                onClick={() => navigate(`/records/${r.id}`)}
                className="bg-white rounded-xl shadow p-4 active:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{r.report_date}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-sm text-gray-500 mb-1">{r.driver_name} / {r.vehicle_name}</p>
                <p className="text-sm text-gray-600 truncate">{r.work_content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
