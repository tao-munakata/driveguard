import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getReport } from '../api';
import type { DrivingReport } from '../types';

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">承認済み</span>;
  if (status === 'rejected') return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">差し戻し</span>;
  return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">未確認</span>;
}

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<DrivingReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getReport(id)
      .then((r) => setReport(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-400">読み込み中...</p>
    </div>
  );

  if (!report) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-400">日報が見つかりません</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/records')} className="text-white text-xl">←</button>
        <h1 className="text-lg font-bold">日報詳細</h1>
      </header>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Basic info */}
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">{report.report_date}</h2>
            <StatusBadge status={report.status} />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ドライバー</span>
              <span className="text-gray-800">{report.driver_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">車両</span>
              <span className="text-gray-800">{report.vehicle_name} ({report.vehicle_plate})</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-gray-500">業務内容</span>
              <span className="text-gray-800">{report.work_content}</span>
            </div>
          </div>
        </div>

        {/* Trip records */}
        {report.trips && report.trips.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-gray-700 mb-3">走行記録</h2>
            {report.trips.map((t) => (
              <div key={t.id} className="space-y-2 text-sm border-b border-gray-100 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                <div className="flex justify-between">
                  <span className="text-gray-500">出発</span>
                  <span>{new Date(t.depart_at).toLocaleString('ja-JP')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">到着</span>
                  <span>{new Date(t.arrive_at).toLocaleString('ja-JP')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">走行距離</span>
                  <span>{parseFloat(t.distance_km).toFixed(1)} km</span>
                </div>
                {t.refueled && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">給油量</span>
                      <span>{t.fuel_amount ? `${t.fuel_amount}L` : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">給油金額</span>
                      <span>{t.fuel_cost ? `¥${parseInt(t.fuel_cost).toLocaleString()}` : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">給油場所</span>
                      <span>{t.fuel_place || '-'}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Alcohol checks */}
        {report.alcohol_checks && report.alcohol_checks.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-gray-700 mb-3">アルコールチェック</h2>
            {report.alcohol_checks.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-sm font-medium">{c.phase === 'before' ? '乗務前' : '乗務後'}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(c.measured_at).toLocaleString('ja-JP')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">{parseFloat(c.value).toFixed(3)} mg/L</span>
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
  );
}
