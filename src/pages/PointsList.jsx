import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search, FileText } from 'lucide-react';
import api from '../api';
import schoolIllustration from '../assets/school-illustration.png';
import governmentLogo from '../assets/government-logo.png';

// A palette we cycle through so each point gets a distinct color, same idea as the mockup
const COLORS = [
  'bg-indigo-600', 'bg-emerald-600', 'bg-amber-600',
  'bg-blue-600', 'bg-pink-600', 'bg-teal-600',
];

function PointsList() {
  const [points, setPoints] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/points/'), api.get('/me/')])
      .then(([pointsRes, meRes]) => {
        setPoints(pointsRes.data);
        setMe(meRes.data);
      })
      .catch((error) => {
        if (error.response?.status === 401) navigate('/login');
        else console.error('Failed to load', error);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredPoints = points.filter((point) =>
    point.title_kn.toLowerCase().includes(search.toLowerCase()) ||
    point.title_en.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 animate-spin" />

        <div className="absolute inset-[3px] rounded-[14px] bg-gray-50 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-indigo-600 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
  const displayName = me?.first_name || me?.username;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div>
  <div className="flex items-center gap-4">
    <div className="w-16 h-16 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center">
      <img
        src={governmentLogo}
        alt="Government Logo"
        className="w-12 h-12 object-contain"
      />
    </div>

    <div className="leading-tight">
      <h1 className="text-3xl font-bold text-gray-900">
        Programme Tracker
      </h1>

      {me?.school?.name && (
        <p className="text-base text-gray-500 mt-1">
          {me.school.name}
        </p>
      )}
    </div>
  </div>

  <hr className="mt-5 border-gray-400" />
</div>
      <div
        className="mt-6 rounded-2xl text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
      >
        <div className="p-6 pr-40">
          <h2 className="text-xl font-bold">
            Welcome, {displayName} 👋
          </h2>

          <p className="text-indigo-100 mt-1 text-sm">
            Select a point to view and add entries
          </p>
        </div>

        <img
          src={schoolIllustration}
          alt=""
          className="absolute right-0 bottom-0 h-28 w-40 object-contain"
        />
      </div>
      {/* Search bar */}
      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search points..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Points list */}
      <div className="mt-6 space-y-3">
        {filteredPoints.map((point, index) => (
          <div
            key={point.id}
            onClick={() => navigate(`/points/${point.id}`)}
            className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-200 transition"
          >
            <div className={`${COLORS[index % COLORS.length]} text-white font-bold rounded-lg w-12 h-12 flex items-center justify-center text-lg shrink-0`}>
              {String(point.id).padStart(2, '0')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{point.title_kn}</p>
              <p className="text-sm text-gray-500 truncate">{point.title_en}</p>
            </div>
            <FileText size={18} className="text-gray-300 shrink-0" />
            <ChevronRight size={20} className="text-gray-400 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default PointsList;