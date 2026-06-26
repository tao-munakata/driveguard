import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAlcoholChecks, getReports } from '../api';
import type { AlcoholCheck, DrivingReport } from '../types';

export default function DriverHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [checks, setChecks] = useState<AlcoholCheck[]>([]);
  const [report, setReport] = useState<DrivingReport | null>(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    getAlcoholChecks({ date: today }).then((r) => setChecks(r.data));
    getReports({ date_from: today, date_to: today }).then((r) => {
      setReport(r.data[0] || null);
    });
  }, [today]);

  const hasBefore = checks.some((c) => c.phase === 'before');
  const hasAfter = checks.some((c) => c.phase === 'after');

  const statusBadge = (status: string) => {
    if (status === 'approved') return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">承認済み</span>;
    if (status === 'rejected') return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">差し戻し</span>;
    return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">未確認</span>;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">DriveGuard</h1>
          <p className="text-blue-200 text-sm">{user?.name}</p>
        </div>
        <button onClick={logout} className="text-blue-200 text-sm underline">ログアウト</button>
      </header>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        <p className="text-gray-500 text-sm">{today}</p>

        {/* Alcohol check status */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-700 mb-3">アルコールチェック</h2>
          <div className="flex gap-3">
            <div className={`flex-1 rounded-lg p-3 text-center ${hasBefore ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="text-2xl mb-1">{hasBefore ? '✓' : '−'}</div>
              <div className="text-sm font-medium text-gray-600">乗務前</div>
            </div>
            <div className={`flex-1 rounded-lg p-3 text-center ${hasAfter ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="text-2xl mb-1">{hasAfter ? '✓' : '−'}</div>
              <div className="text-sm font-medium text-gray-600">乗務後</div>
            </div>
          </div>
        </div>

        {/* Report status */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-700 mb-3">本日の日報</h2>
          {report ? (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">{report.work_content.substring(0, 30)}...</span>
              {statusBadge(report.status)}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">日報が未作成です</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/alcohol-check')}
            className="w-full bg-blue-600 text-white rounded-xl py-4 text-base font-semibold shadow active:bg-blue-700"
          >
            アルコールチェック
          </button>
          <button
            onClick={() => navigate('/report/new')}
            className="w-full bg-white text-blue-600 border-2 border-blue-600 rounded-xl py-4 text-base font-semibold shadow active:bg-blue-50"
          >
            日報入力
          </button>
          <button
            onClick={() => navigate('/records')}
            className="w-full bg-white text-gray-700 border border-gray-300 rounded-xl py-4 text-base font-semibold shadow active:bg-gray-50"
          >
            記録一覧
          </button>
        </div>
      </div>
    </div>
  );
}
