import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download } from 'lucide-react';
import api from '../api';

function AdminSchoolDetail() {
  const { schoolId } = useParams();
  const [searchParams] = useSearchParams();
  const month = searchParams.get('month');
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const load = () => {
    api.get(`/admin/schools/${schoolId}/?month=${month}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [schoolId, month]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await api.post(`/admin/schools/${schoolId}/verify/`, { month });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async () => {
  const response = await api.get(`/admin/schools/${schoolId}/export/?month=${month}`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${data.school.name}_${month}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-900">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{data.school.name}</h1>
          <p className="text-sm text-gray-500">{data.school.district}, {data.school.taluk} · {month}</p>
        </div>
      </div>

      {data.is_submitted && (
        <div className="flex items-center gap-3 mb-6">
          
            <button onClick={handleDownload} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition">
  <Download size={18} /> Download Report
</button>
          {data.is_verified ? (
            <span className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 size={18} /> Verified
            </span>
          ) : (
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="flex items-center gap-2 bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              <CheckCircle2 size={18} /> {verifying ? 'Verifying...' : 'Verify'}
            </button>
          )}
        </div>
      )}

      {!data.is_submitted && (
        <div className="bg-amber-50 text-amber-700 text-sm rounded-xl p-4 mb-6">
          This school hasn't submitted {month}'s report yet.
        </div>
      )}

      <div className="space-y-3">
        {data.points.map((point) => (
          <div key={point.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="font-semibold text-gray-900">{point.title_kn}</p>
            <p className="text-sm text-gray-500 mb-2">{point.title_en}</p>
            {point.entry ? (
              point.columns.map((col) => (
                <div key={col.id} className="flex justify-between text-sm py-1 gap-4">
                  <span className="text-gray-500">{col.label_kn}</span>
                  <span className="text-gray-900 font-medium text-right">
                    {col.id === 'month' ? point.entry.month : (point.entry.data[col.id] ?? '-')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">Not filled in yet.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminSchoolDetail;