import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Search,
  CheckCircle2,
  Send,
  CalendarDays,
  Bell,
  BellOff,
  Info,
  LogOut,
  Menu,
  MapPin,
  RefreshCw,
  School,
  Upload,
  X,
} from 'lucide-react';

import api from '../api';
import { clearTokens } from '../auth';
import schoolIllustration from '../assets/school-illustration.png';
import '../notifications.css';
import NotificationModal from '../components/NotificationModal';

const MONTHS = [
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
  'April',
];

function getCurrentMonthName() {
  const idx = new Date().getMonth();
  return new Date(2000, idx, 1).toLocaleString('en-US', {
    month: 'long',
  });
}

/* -----------------------------
   Circular Progress Component
------------------------------ */

function ProgressCircle({ percentage = 0, size = 72 }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(
          #6d4aff ${percentage * 3.6}deg,
          #e9e7f5 ${percentage * 3.6}deg
        )`,
      }}
    >
      <div
        className="absolute rounded-full bg-[#f8f8fc] flex items-center justify-center font-bold text-gray-800"
        style={{
          width: size - 12,
          height: size - 12,
        }}
      >
        {percentage}%
      </div>
    </div>
  );
}

/* -----------------------------
   Main Component
------------------------------ */

function PointsList() {
  const [points, setPoints] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonthName());

  const [monthStatus, setMonthStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [popupNotification, setPopupNotification] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('all');
  

  const navigate = useNavigate();

  /* -----------------------------
     Load points + user
  ------------------------------ */

  useEffect(() => {
    Promise.all([
      api.get('/points/'),
      api.get('/me/'),
    ])
      .then(([pointsRes, meRes]) => {
        setPoints(pointsRes.data);
        setMe(meRes.data);
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          navigate('/login');
        } else {
          console.error('Failed to load', error);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  useEffect(() => {
  api.get('/notifications/')
    .then((res) => {
      setNotifications(res.data);

      const firstUnread = res.data.find(
  (n) => !n.is_read && n.message.toLowerCase().startsWith('reminder for')
);
      if (firstUnread) {
        setPopupNotification(firstUnread);
      }
    })
    .catch((error) => {
      console.error('Failed to load notifications', error);
    });
}, []);

  /* -----------------------------
     Load selected month status
  ------------------------------ */

  useEffect(() => {
    setError('');

    api
      .get(`/month-status/?month=${selectedMonth}`)
      .then((res) => {
        setMonthStatus(res.data);
      })
      .catch((err) => {
        console.error('Failed to load month status', err);
      });
  }, [selectedMonth]);

  /* -----------------------------
     Filter points
  ------------------------------ */

  const filteredPoints = points.filter((point) => {
    const searchText = search.toLowerCase();

    return (
      point.title_kn?.toLowerCase().includes(searchText) ||
      point.title_en?.toLowerCase().includes(searchText)
    );
  });

  /* -----------------------------
     Progress calculation
  ------------------------------ */

  const completedCount =
    monthStatus?.completed_point_ids?.length || 0;

  const totalPoints =
    monthStatus?.total_points || points.length || 0;

  const progress =
    totalPoints > 0
      ? Math.round((completedCount / totalPoints) * 100)
      : 0;

  const allComplete =
    monthStatus?.all_complete ||
    (totalPoints > 0 && completedCount === totalPoints);

  const isLocked = monthStatus?.is_locked;

  const displayName =
    me?.first_name || me?.username || 'HM';

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/`, { is_read: true });
      setNotifications((previous) => previous.map((notification) => (
        notification.id === id ? { ...notification, is_read: true } : notification
      )));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };
  const dismissPopup = async () => {
  if (!popupNotification) return;

  try {
    await markAsRead(popupNotification.id);

    const updatedNotifications = notifications.map((n) =>
      n.id === popupNotification.id
        ? { ...n, is_read: true }
        : n
    );

    setNotifications(updatedNotifications);

    const nextUnread = updatedNotifications.find(
  (n) =>
    !n.is_read &&
    n.message.toLowerCase().startsWith('reminder for')
);

    setPopupNotification(nextUnread || null);

  } catch (error) {
    console.error('Failed to mark notification as read', error);
  }
};

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((notification) => !notification.is_read);
    if (!unreadNotifications.length) return;

    try {
      await Promise.all(unreadNotifications.map((notification) => (
        api.patch(`/notifications/${notification.id}/`, { is_read: true })
      )));
      setNotifications((previous) => previous.map((notification) => ({ ...notification, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const visibleNotifications = notifications.filter((notification) => {
    if (notificationFilter === 'all') return true;
    return notification.message?.toLowerCase().includes(notificationFilter);
  });

  const notificationVisual = (notification) => {
    const message = notification.message?.toLowerCase() || '';
    if (message.includes('verif')) return { title: 'Report verified', icon: CheckCircle2, tone: 'verified' };
    if (message.includes('submit')) return { title: 'Report submitted', icon: Upload, tone: 'submitted' };
    if (message.includes('remind')) return { title: 'Reminder', icon: CalendarDays, tone: 'reminder' };
    return { title: 'New update', icon: Info, tone: 'update' };
  };

  const handleLogout = () => {
    clearTokens();
    navigate('/login');
  };

  const refreshDashboard = async () => {
    if (refreshing) return;

    setRefreshing(true);
    setError('');
    try {
      const [pointsRes, meRes, statusRes, notificationsRes] = await Promise.all([
        api.get('/points/'),
        api.get('/me/'),
        api.get(`/month-status/?month=${selectedMonth}`),
        api.get('/notifications/'),
      ]);
      setPoints(pointsRes.data);
      setMe(meRes.data);
      setMonthStatus(statusRes.data);
      setNotifications(notificationsRes.data);
    } catch (err) {
      console.error('Failed to refresh dashboard', err);
      setError('Could not refresh the dashboard. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  /* -----------------------------
     Submit report
     
     NOTE:
     Keep your existing backend
     submission endpoint here when
     it is available.
  ------------------------------ */

  const handleSubmit = async () => {
  if (!allComplete || isLocked || submitting) {
    return;
  }

  const confirmed = window.confirm(
    `Submit ${selectedMonth}'s report?\n\nOnce submitted, this month's entries will be locked and cannot be edited.`
  );

  if (!confirmed) {
    return;
  }

  setSubmitting(true);
  setError('');

  try {
    // Submit the month
    const response = await api.post(
      '/submit-month/',
      { month: selectedMonth },
      { responseType: 'blob' }
    );

    // Download the generated Excel report
    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement('a');
    link.href = url;

    link.setAttribute(
      'download',
      `${me?.school?.name || 'report'}_${selectedMonth}.xlsx`
    );

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

    // Refresh the month status
    const statusResponse = await api.get(
      `/month-status/?month=${selectedMonth}`
    );

    setMonthStatus(statusResponse.data);

  } catch (err) {
    console.error('Submission failed:', err);

    const message =
      err.response?.data?.error ||
      err.response?.data?.detail ||
      err.response?.data?.non_field_errors?.[0] ||
      'Failed to submit the report.';

    setError(message);

  } finally {
    setSubmitting(false);
  }
};

  /* -----------------------------
     Loading
  ------------------------------ */

  if (loading) {
  return (
    <div className="min-h-screen bg-[#eef1f7] flex items-center justify-center">
      <div className="relative w-20 h-20">

        {/* Track */}
        <div className="absolute inset-0 rounded-full border border-dashed border-slate-300/60" />

        {/* Comet trail + head, spinning together */}
        <div className="absolute inset-0 animate-spin [animation-duration:1.4s]">

          {/* Fading trail */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 90deg, rgba(79,70,229,0) 0deg, rgba(79,70,229,0.55) 60deg, rgba(79,70,229,0) 90deg)",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 6px))",
              mask:
                "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 6px))",
            }}
          />

          {/* Comet head */}
          <div
            className="
              absolute top-0 left-1/2
              -translate-x-1/2
              w-4 h-4
              rounded-full
              bg-indigo-600
              shadow-[0_0_12px_4px_rgba(79,70,229,0.6)]
            "
          />
        </div>

      </div>
    </div>
  );
}
  /* -----------------------------
     UI
  ------------------------------ */

  return (
    <div className="min-h-screen bg-[#f6f6fa] text-[#17213b] pb-32">

      {/* =========================
          HEADER
      ========================== */}

      <header className="px-5 pt-5 md:px-8 md:pt-8">

        <div className="max-w-6xl mx-auto flex items-center justify-between">

          {/* Menu */}

          <button
            type="button"
            onClick={() => setShowMenu(true)}
            aria-label="Open menu"
            aria-expanded={showMenu}
            className="
              w-12 h-12
              rounded-2xl
              bg-[#f8f8fc]
              shadow-[6px_6px_14px_#dcdce5,-6px_-6px_14px_#ffffff]
              flex items-center justify-center
              text-gray-600
              hover:text-indigo-600
              transition
            "
          >
            <Menu size={22} />
          </button>

          {/* Title */}

          <div className="flex-1 px-4">

            <h1 className="text-lg md:text-2xl font-bold">
              29-Point Programme Tracker
            </h1>

            {me?.school?.name && (
              <p className="text-sm md:text-base text-gray-500 mt-1">
                {me.school.name}
              </p>
            )}

          </div>

          {/* Notification */}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((previous) => !previous)}
              aria-label="Notifications"
              aria-expanded={showNotifications}
              className="
                relative w-12 h-12 rounded-2xl bg-[#f8f8fc]
                shadow-[6px_6px_14px_#dcdce5,-6px_-6px_14px_#ffffff]
                flex items-center justify-center text-gray-600 transition hover:text-indigo-600
              "
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

          </div>

        </div>

      </header>


      {/* =========================
          MAIN
      ========================== */}

      <main className="max-w-6xl mx-auto px-5 md:px-8">

        {/* =========================
            WELCOME CARD
        ========================== */}

        <section
          className="
            mt-6
            relative
            overflow-hidden
            rounded-[30px]
            min-h-[220px]
            bg-[#e9e4ff]
            shadow-[10px_10px_25px_#d8d6e2,-10px_-10px_25px_#ffffff]
          "
        >

          <div className="relative z-10 p-7 md:p-10 max-w-[60%]">

            <p className="text-gray-600 text-sm md:text-base">
              Welcome back,
            </p>

            <h2 className="text-2xl md:text-4xl font-bold mt-2">
              {displayName} 👋
            </h2>

            

          </div>

          {/* School illustration */}

          <img
            src={schoolIllustration}
            alt="School"
            className="
              absolute
              right-0
              bottom-0
              h-[190px]
              md:h-[230px]
              object-contain
              pointer-events-none
            "
          />

        </section>


        {/* =========================
            SUMMARY CARDS
        ========================== */}

        <section className="grid grid-cols-3 gap-3 md:gap-5 mt-6">

          {/* Completed */}

          <div
            className="
              rounded-[24px]
              bg-[#eefbf1]
              p-4 md:p-6
              text-center
              shadow-[7px_7px_16px_#dcdfe0,-7px_-7px_16px_#ffffff]
            "
          >

            <div
              className="
                mx-auto
                w-12 h-12
                rounded-full
                bg-[#dcf8e2]
                flex items-center justify-center
                text-green-600
                shadow-inner
              "
            >
              <CheckCircle2 size={26} />
            </div>

            <p className="text-2xl md:text-3xl font-bold mt-3">
              {completedCount}
            </p>

            <p className="text-xs md:text-sm text-gray-600 mt-1">
              Completed
            </p>

          </div>


          {/* Progress */}

          <div
            className="
              rounded-[24px]
              bg-[#f8f7ff]
              p-4 md:p-6
              text-center
              shadow-[7px_7px_16px_#dcdfe0,-7px_-7px_16px_#ffffff]
            "
          >

            <div className="flex justify-center">

              <ProgressCircle
                percentage={progress}
                size={70}
              />

            </div>

            <p className="text-xs md:text-sm text-gray-600 mt-3">
              Progress
            </p>

          </div>


          {/* Total */}

          <div
            className="
              rounded-[24px]
              bg-[#fff8ed]
              p-4 md:p-6
              text-center
              shadow-[7px_7px_16px_#dcdfe0,-7px_-7px_16px_#ffffff]
            "
          >

            <div
              className="
                mx-auto
                w-12 h-12
                rounded-full
                bg-[#ffedcf]
                flex items-center justify-center
                text-orange-500
              "
            >
              <CalendarDays size={24} />
            </div>

            <p className="text-2xl md:text-3xl font-bold mt-3">
              {totalPoints}
            </p>

            <p className="text-xs md:text-sm text-gray-600 mt-1">
              Total points
            </p>

          </div>

        </section>


        {/* =========================
            MONTH SELECTOR
        ========================== */}

        <section className="mt-6 flex items-center gap-3">

          <div
            className="
              flex-1
              max-w-md
              rounded-2xl
              bg-[#f8f8fc]
              px-5 py-4
              flex items-center gap-3
              shadow-[6px_6px_14px_#dcdce5,-6px_-6px_14px_#ffffff]
            "
          >

            <CalendarDays
              size={21}
              className="text-indigo-600 shrink-0"
            />

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="
                bg-transparent
                outline-none
                font-semibold
                text-gray-800
                flex-1
                cursor-pointer
              "
            >

              {MONTHS.map((month) => (
                <option
                  key={month}
                  value={month}
                >
                  {month}
                </option>
              ))}

            </select>

          </div>

          <button
            type="button"
            onClick={refreshDashboard}
            disabled={refreshing}
            aria-label="Refresh dashboard"
            className="
              w-14 h-14
              rounded-2xl
              bg-[#f8f8fc]
              flex items-center justify-center
              shadow-[6px_6px_14px_#dcdce5,-6px_-6px_14px_#ffffff]
              text-gray-500 disabled:cursor-wait disabled:opacity-70
            "
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />

          </button>

        </section>


        {/* =========================
            STATUS
        ========================== */}

        <div className="mt-4 flex items-center justify-between">

          <p className="text-sm text-gray-500">
            {completedCount}/{totalPoints} points completed
          </p>

          {isLocked && (
            <span
              className="
                text-xs
                font-semibold
                px-3 py-1.5
                rounded-full
                bg-green-100
                text-green-700
              "
            >
              ✓ Submitted
            </span>
          )}

        </div>


        {/* =========================
            SEARCH
        ========================== */}

        <div className="relative mt-4">

          <Search
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-gray-400
            "
            size={20}
          />

          <input
            type="text"
            placeholder="Search points..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full
              rounded-2xl
              bg-[#f8f8fc]
              px-12 py-4
              outline-none
              text-gray-700
              shadow-[6px_6px_14px_#dcdce5,-6px_-6px_14px_#ffffff]
              focus:ring-2
              focus:ring-indigo-300
            "
          />

        </div>


        {/* =========================
            POINT HEADER
        ========================== */}

        <div className="flex items-center justify-between mt-7 mb-3">

          <h3 className="font-bold text-gray-800">
            POINTS ({totalPoints})
          </h3>

          <div className="flex items-center gap-4 text-xs text-gray-500">

            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              Completed
            </span>

            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full border-2 border-gray-400" />
              Pending
            </span>

          </div>

        </div>


        {/* =========================
            POINT LIST
        ========================== */}

        <div className="space-y-3">

          {filteredPoints.map((point) => {

            const isDone =
              monthStatus?.completed_point_ids?.includes(
                point.id
              );

            return (
              <div
                key={point.id}
                onClick={() =>
                  navigate(
                    `/points/${point.id}?month=${selectedMonth}`
                  )
                }
                className={`
                  flex
                  items-center
                  gap-4
                  rounded-[22px]
                  p-4
                  cursor-pointer
                  transition
                  ${
                    isDone
                      ? 'bg-[#f0fbf2]'
                      : 'bg-[#f9f9fc]'
                  }
                  shadow-[6px_6px_14px_#dcdce5,-6px_-6px_14px_#ffffff]
                  hover:scale-[1.01]
                `}
              >

                {/* Number */}

                <div
                  className={`
                    w-12
                    h-12
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-lg
                    shrink-0
                    ${
                      isDone
                        ? 'bg-[#dff7e4] text-green-600'
                        : 'bg-[#e8e8f1] text-gray-500'
                    }
                  `}
                >
                  {String(point.id).padStart(2, '0')}
                </div>


                {/* Text */}

                <div className="flex-1 min-w-0">

                  <p className="font-semibold text-gray-900 truncate">
                    {point.title_kn}
                  </p>

                  <p className="text-sm text-gray-500 truncate">
                    {point.title_en}
                  </p>

                </div>


                {/* Completion circle */}

                <div
                  className={`
                    w-10
                    h-10
                    rounded-full
                    flex
                    items-center
                    justify-center
                    shrink-0
                    ${
                      isDone
                        ? 'bg-green-500 text-white shadow-md'
                        : 'border-[3px] border-gray-300 text-transparent'
                    }
                  `}
                >

                  {isDone && (
                    <CheckCircle2
                      size={25}
                      strokeWidth={2.5}
                    />
                  )}

                </div>


                {/* Arrow */}

                <ChevronRight
                  size={21}
                  className="text-gray-400 shrink-0"
                />

              </div>
            );
          })}

        </div>


        {/* No search result */}

        {filteredPoints.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No points found.
          </div>
        )}


        {/* =========================
            ERROR
        ========================== */}

        {error && (
          <div
            className="
              mt-5
              rounded-2xl
              bg-red-50
              text-red-600
              p-4
              text-sm
            "
          >
            {error}
          </div>
        )}

      </main>

      {showMenu && (
        <div className="account-menu-layer" role="dialog" aria-modal="true" aria-label="School account menu">
          <button className="account-menu-backdrop" type="button" aria-label="Close menu" onClick={() => setShowMenu(false)} />
          <aside className="account-menu-drawer">
            <button className="account-menu-close" type="button" onClick={() => setShowMenu(false)} aria-label="Close menu"><X size={29} /></button>
            <div className="account-school-mark"><School size={72} strokeWidth={1.7} /></div>
            <h2>{me?.school?.name || 'School'}</h2>
            <p className="account-type">School Account</p>

            <div className="account-details">
              <div><span className="account-detail-icon"><MapPin size={28} fill="currentColor" /></span><p><small>District</small><strong>{me?.school?.district || 'Not available'}</strong></p></div>
              <div><span className="account-detail-icon"><School size={27} /></span><p><small>Taluk</small><strong>{me?.school?.taluk || 'Not available'}</strong></p></div>
            </div>

            <div className="account-menu-divider" />
            <button className="account-logout" type="button" onClick={handleLogout}><LogOut size={30} /> Logout</button>
          </aside>
        </div>
      )}

      {showNotifications && (
        <div className="notification-layer" role="dialog" aria-modal="true" aria-label="Notifications">
          <button className="notification-backdrop" type="button" aria-label="Close notifications" onClick={() => setShowNotifications(false)} />
          <aside className="notification-drawer">
            <div className="drawer-handle" />
            <header className="notification-heading">
              <h2>Notifications</h2>
              <button type="button" onClick={() => setShowNotifications(false)} aria-label="Close notifications"><X size={26} /></button>
            </header>

            <div className="notification-tabs" role="tablist" aria-label="Notification categories">
              {['all', 'verified', 'submitted'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  role="tab"
                  aria-selected={notificationFilter === filter}
                  onClick={() => setNotificationFilter(filter)}
                  className={notificationFilter === filter ? 'active' : ''}
                >
                  {filter === 'all' ? 'All' : `${filter[0].toUpperCase()}${filter.slice(1)}`}
                </button>
              ))}
            </div>

            <div className="notification-items">
              {visibleNotifications.length === 0 ? (
                <div className="notification-empty"><BellOff size={33} /><p>No notifications yet.</p></div>
              ) : visibleNotifications.map((notification) => {
                const visual = notificationVisual(notification);
                const Icon = visual.icon;
                return <button
                  key={notification.id}
                  type="button"
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                  className={`notification-card notification-${visual.tone} ${notification.is_read ? 'is-read' : ''}`}
                >
                  <span className="notification-icon"><Icon size={27} /></span>
                  <span className="notification-copy">
                    <strong>{visual.title}</strong>
                    <span>{notification.message}</span>
                    <time>{new Date(notification.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
                  </span>
                  <ChevronRight className="notification-arrow" size={23} />
                </button>;
              })}
            </div>

            <button type="button" className="mark-all-read" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <BellOff size={20} /> Mark all as read
            </button>
          </aside>
        </div>
      )}


      {/* =========================
          SUBMIT SECTION
      ========================== */}

      {/* =========================
    SUBMIT BUTTON
    ONLY APPEARS WHEN ALL
    POINTS ARE COMPLETED
========================= */}

{!isLocked && allComplete && (
  <div
    className="
      fixed
      bottom-5
      left-5
      right-5
      md:left-1/2
      md:right-auto
      md:-translate-x-1/2
      md:w-[520px]
      z-40
    "
  >
    <button
      type="button"
      onClick={handleSubmit}
      disabled={submitting}
      className="
        w-full
        rounded-[24px]
        bg-gradient-to-r
        from-[#7357ff]
        to-[#8b72ff]
        text-white
        px-6
        py-4
        shadow-[8px_8px_20px_#d0cde0]
        hover:scale-[1.01]
        transition
        disabled:opacity-60
      "
    >
      <div className="flex items-center justify-center gap-3">

        <div
          className="
            w-11 h-11
            rounded-xl
            bg-white/20
            flex items-center justify-center
          "
        >
          <Send size={21} />
        </div>

        <div className="text-left">
          <p className="font-bold text-base">
            {submitting ? 'Submitting...' : 'Submit Report'}
          </p>

          <p className="text-xs text-indigo-100">
            All {totalPoints} points completed
          </p>
        </div>

      </div>
    </button>
  </div>
)}


      {/* =========================
          SUBMIT BUTTON
          ONLY WHEN COMPLETE
      ========================== */}

      {isLocked && (
  <div
    className="
      fixed
      bottom-5
      left-5
      right-5
      md:left-1/2
      md:right-auto
      md:-translate-x-1/2
      md:w-[520px]
      z-40
    "
  >
    <div
      className="
        rounded-[24px]
        bg-[#eaf9ee]
        px-5 py-4
        shadow-[8px_8px_20px_#d7ded9,-8px_-8px_20px_#ffffff]
      "
    >
      <div className="flex items-center gap-3">

        <div
          className="
            w-11 h-11
            rounded-full
            bg-green-500
            text-white
            flex items-center justify-center
          "
        >
          <CheckCircle2 size={25} />
        </div>

        <div>
          <p className="font-bold text-gray-800">
            Report Submitted
          </p>

          <p className="text-xs text-gray-500 mt-1">
            {selectedMonth} is locked and cannot be edited.
          </p>
        </div>

      </div>
    </div>
  </div>
)}


      {/* =========================
          LOCKED MESSAGE
      ========================== */}

      {isLocked && (
        <div
          className="
            fixed
            bottom-5
            left-5
            right-5
            md:left-1/2
            md:right-auto
            md:-translate-x-1/2
            md:w-[520px]
            z-40
          "
        >

          <div
            className="
              rounded-[24px]
              bg-[#eaf9ee]
              px-5 py-4
              shadow-[8px_8px_20px_#d7ded9,-8px_-8px_20px_#ffffff]
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  w-11 h-11
                  rounded-full
                  bg-green-500
                  text-white
                  flex items-center justify-center
                "
              >
                <CheckCircle2 size={25} />
              </div>

              <div>

                <p className="font-bold text-gray-800">
                  {selectedMonth} Report Submitted
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  This month is locked and cannot be edited.
                </p>

              </div>

            </div>

          </div>

        </div>
      )}

      {popupNotification && (
      <NotificationModal
        message={popupNotification.message}
        onDismiss={dismissPopup}
      />
    )}

    </div>
  );
}

export default PointsList;
