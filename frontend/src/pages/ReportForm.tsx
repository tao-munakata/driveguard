import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createReport, createTrip, getVehicles } from '../api';
import type { Vehicle } from '../types';

type Step = 1 | 2 | 3 | 4;

export default function ReportForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportId, setReportId] = useState('');

  // Step 1
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [vehicleId, setVehicleId] = useState('');
  const [workContent, setWorkContent] = useState('');

  // Step 2
  const [departAt, setDepartAt] = useState('');
  const [arriveAt, setArriveAt] = useState('');
  const [distanceKm, setDistanceKm] = useState('');

  // Step 3
  const [refueled, setRefueled] = useState(false);
  const [fuelAmount, setFuelAmount] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelPlace, setFuelPlace] = useState('');

  useEffect(() => {
    getVehicles().then((r) => setVehicles(r.data));
  }, []);

  const handleStep1 = async () => {
    if (!reportDate || !vehicleId || !workContent) {
      setError('すべての項目を入力してください');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await createReport({ report_date: reportDate, vehicle_id: vehicleId, work_content: workContent });
      setReportId(res.data.id);
      setStep(2);
    } catch {
      setError('日報の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = () => {
    if (!departAt || !arriveAt || !distanceKm) {
      setError('すべての項目を入力してください');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleStep3 = () => {
    setError('');
    setStep(4);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await createTrip(reportId, {
        depart_at: departAt,
        arrive_at: arriveAt,
        distance_km: parseFloat(distanceKm),
        refueled,
        fuel_amount: refueled && fuelAmount ? parseFloat(fuelAmount) : null,
        fuel_cost: refueled && fuelCost ? parseFloat(fuelCost) : null,
        fuel_place: refueled && fuelPlace ? fuelPlace : null,
      });
      navigate('/records');
    } catch {
      setError('送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = ['日報基本情報', '走行記録', '給油情報', '確認・送信'];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => step === 1 ? navigate('/home') : setStep((s) => (s - 1) as Step)} className="text-white text-xl">←</button>
        <h1 className="text-lg font-bold">日報入力</h1>
      </header>

      {/* Step indicator */}
      <div className="flex bg-white shadow">
        {stepLabel.map((label, i) => (
          <div key={i} className={`flex-1 py-2 text-center text-xs font-medium border-b-2 ${
            step === i + 1 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'
          }`}>
            {i + 1}. {label}
          </div>
        ))}
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <h2 className="font-semibold text-gray-700">日報基本情報</h2>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">日付</label>
              <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">車両</label>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">選択してください</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">業務内容</label>
              <textarea value={workContent} onChange={(e) => setWorkContent(e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="本日の業務内容を入力してください" />
            </div>
            <button onClick={handleStep1} disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl py-4 text-base font-semibold disabled:opacity-50">
              次へ →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <h2 className="font-semibold text-gray-700">走行記録</h2>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">出発日時</label>
              <input type="datetime-local" value={departAt} onChange={(e) => setDepartAt(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">到着日時</label>
              <input type="datetime-local" value={arriveAt} onChange={(e) => setArriveAt(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">走行距離 (km)</label>
              <input type="number" step="0.1" min="0" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.0" />
            </div>
            <button onClick={handleStep2}
              className="w-full bg-blue-600 text-white rounded-xl py-4 text-base font-semibold">
              次へ →
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <h2 className="font-semibold text-gray-700">給油情報</h2>
            <div className="flex items-center justify-between py-2">
              <span className="text-base font-medium text-gray-700">給油しましたか？</span>
              <button
                onClick={() => setRefueled(!refueled)}
                className={`w-14 h-7 rounded-full transition-colors ${refueled ? 'bg-blue-600' : 'bg-gray-300'} relative`}
              >
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${refueled ? 'translate-x-7' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {refueled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">給油量 (L)</label>
                  <input type="number" step="0.1" min="0" value={fuelAmount} onChange={(e) => setFuelAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">給油金額 (円)</label>
                  <input type="number" min="0" value={fuelCost} onChange={(e) => setFuelCost(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">給油場所</label>
                  <input type="text" value={fuelPlace} onChange={(e) => setFuelPlace(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: ENEOSxx店" />
                </div>
              </>
            )}
            <button onClick={handleStep3}
              className="w-full bg-blue-600 text-white rounded-xl py-4 text-base font-semibold">
              次へ →
            </button>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow p-4 space-y-2">
              <h2 className="font-semibold text-gray-700 mb-3">確認</h2>
              <div className="flex justify-between text-sm"><span className="text-gray-500">日付</span><span>{reportDate}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">業務内容</span><span className="text-right max-w-xs">{workContent}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">出発</span><span>{departAt.replace('T', ' ')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">到着</span><span>{arriveAt.replace('T', ' ')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">走行距離</span><span>{distanceKm} km</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">給油</span><span>{refueled ? `${fuelAmount}L / ¥${fuelCost}` : 'なし'}</span></div>
            </div>
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-green-600 text-white rounded-xl py-4 text-base font-semibold disabled:opacity-50">
              {loading ? '送信中...' : '送信する'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
