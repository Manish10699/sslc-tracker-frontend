import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Check, Clock3, School, ChevronRight, ChevronDown,
  CalendarDays, UserRound, MapPin, Building2, X, LogOut,
} from 'lucide-react';
import api from '../api';
import { clearTokens } from '../auth';
import '../admin-dashboard.css';

const MONTHS = ['May', 'June', 'July', 'August', 'September', 'October',
  'November', 'December', 'January', 'February', 'March', 'April'];

function getCurrentMonthName() {
  const idx = new Date().getMonth();
  return new Date(2000, idx, 1).toLocaleString('en-US', { month: 'long' });
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthName());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [admin, setAdmin] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/admin/schools/?month=${selectedMonth}`)
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 403) navigate('/points');
        else console.error(err);
      })
      .finally(() => setLoading(false));
  }, [selectedMonth, navigate]);

  useEffect(() => {
    api.get('/me/')
      .then((res) => setAdmin(res.data))
      .catch((err) => console.error('Failed to load admin profile', err));
  }, []);

  const logout = () => {
    clearTokens();
    navigate('/login');
  };

  const filteredSchools = data?.schools?.filter((school) => {
    const matchesSearch = school.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'submitted' ? school.is_submitted : !school.is_submitted);
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <main className="admin-dashboard">
      <div className="dashboard-orb dashboard-orb-top" />
      <div className="dashboard-orb dashboard-orb-bottom" />
      <section className="dashboard-content">
        <button className="profile-button" type="button" aria-label="Open profile" aria-expanded={showProfile} onClick={() => setShowProfile(true)}><UserRound size={29} strokeWidth={1.8} /></button>
        <header className="dashboard-header">
          <div className="dashboard-logo"><Building2 size={47} strokeWidth={2} /></div>
          <div><h1>Admin Dashboard</h1><p>29-Point Programme submission overview</p></div>
        </header>

        {loading ? <div className="dashboard-loading">Loading dashboard…</div> : !data ? null : <>
          <section className="stats-grid" aria-label="Submission summary">
            <article className="stat-card stat-card-school"><div className="stat-icon"><Building2 size={39} /></div><strong>{data.total_schools}</strong><span>Total Schools</span></article>
            <article className="stat-card stat-card-submitted"><div className="stat-icon"><Check size={42} strokeWidth={3} /></div><strong>{data.submitted_count}</strong><span>Submitted</span></article>
            <article className="stat-card stat-card-pending"><div className="stat-icon"><Clock3 size={42} strokeWidth={2.6} /></div><strong>{data.pending_count}</strong><span>Pending</span></article>
          </section>

          <section className="dashboard-filters" aria-label="School filters">
            <label className="select-control"><CalendarDays size={29} /><select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} aria-label="Month">{MONTHS.map((month) => <option key={month} value={month}>{month}</option>)}</select><ChevronDown className="select-chevron" size={27} /></label>
            <label className="select-control"><School size={29} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="School status"><option value="all">All Schools</option><option value="submitted">Submitted</option><option value="pending">Pending</option></select><ChevronDown className="select-chevron" size={27} /></label>
          </section>

          <label className="dashboard-search"><Search size={34} /><input type="search" placeholder="Search schools..." value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          <section className="school-list" aria-label="Schools">
            {filteredSchools.map((school) => {
              const submitted = school.is_submitted;
              return <button key={school.id} type="button" onClick={() => navigate(`/admin/schools/${school.id}?month=${selectedMonth}`)} className={`school-card ${submitted ? 'school-card-submitted' : 'school-card-pending'}`}>
                <div className="school-icon"><School size={55} strokeWidth={2.15} /></div>
                <div className="school-details"><h2>{school.name}</h2><p><MapPin size={23} fill="currentColor" /> {school.district}, {school.taluk}</p><span className="points-pill"><i />{school.completed_points}/{school.total_points} points</span></div>
                <span className="school-chevron"><ChevronRight size={39} /></span>
              </button>;
            })}
            {filteredSchools.length === 0 && <p className="empty-schools">No schools match your filters.</p>}
          </section>
        </>}
      </section>
      {showProfile && (
        <div className="admin-profile-layer" role="dialog" aria-modal="true" aria-label="Admin profile">
          <button className="admin-profile-backdrop" type="button" aria-label="Close profile" onClick={() => setShowProfile(false)} />
          <aside className="admin-profile-drawer">
            <button className="admin-profile-close" type="button" aria-label="Close profile" onClick={() => setShowProfile(false)}><X size={27} /></button>
            <div className="admin-avatar"><UserRound size={55} strokeWidth={1.7} /></div>
            <h2>{admin?.first_name || admin?.username || 'Admin'}</h2>
            <p className="admin-role">Administrator Account</p>
            <div className="admin-profile-details">
              <div><span><School size={27} /></span><p><small>School</small><strong>{admin?.school?.name || admin?.school_name || 'District Administrator'}</strong></p></div>
              <div><span><MapPin size={27} fill="currentColor" /></span><p><small>District</small><strong>{admin?.school?.district || admin?.district || 'Not available'}</strong></p></div>
            </div>
            <div className="admin-profile-divider" />
            <button className="admin-logout" type="button" onClick={logout}><LogOut size={27} /> Logout</button>
          </aside>
        </div>
      )}
    </main>
  );
}

export default AdminDashboard;
