import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, MoreVertical, Pencil, Trash2, Calendar, ChevronDown, Download } from 'lucide-react';
import api from '../api';
import EntryForm from '../components/EntryForm';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

function PointDetail() {
  const { pointNo } = useParams();
  const navigate = useNavigate();
  const [point, setPoint] = useState(null);
  const [searchParams] = useSearchParams();
  const currentMonth = searchParams.get('month');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [openMenuId, setOpenMenuId] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/points/${pointNo}/`),
      api.get(`/entries/?point=${pointNo}&month=${currentMonth}`),
    ])
      .then(([pointRes, entriesRes]) => {
        setPoint(pointRes.data);
        setEntries(entriesRes.data);
      })
      .catch((error) => console.error('Failed to load point', error))
      .finally(() => setLoading(false));
  }, [pointNo, currentMonth]);


  useEffect(() => {
    if (!currentMonth) return;
    api.get(`/month-status/?month=${currentMonth}`).then((res) => setIsLocked(res.data.is_locked));
  }, [currentMonth]);

  const refreshEntries = (message) => {
    api.get(`/entries/?point=${pointNo}&month=${currentMonth}`).then((res) => setEntries(res.data));
    setShowForm(false);
    setEditingEntry(null);
    if (message) setToastMessage(message);
  };




  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const confirmDelete = async () => {
    await api.delete(`/entries/${deleteTarget}/`);
    setDeleteTarget(null);
    refreshEntries();
  };



  const formatDate = (iso) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  };
  const handleExport = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/points/${pointNo}/export/?month=${currentMonth}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `point_${pointNo}_${currentMonth}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed', error);
    } finally {
      setDownloading(false);
    }
  };
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
  if (!point) return <p className="p-6 text-red-500">Point not found</p>;

  return (
    <div className="min-h-screen bg-[#eef1f7] px-4 py-5 sm:px-6">

      {/* Main container */}
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/points')}
              className="
              w-11 h-11
              flex items-center justify-center
              rounded-2xl
              bg-[#eef1f7]
              text-slate-500
              shadow-[-5px_-5px_10px_rgba(255,255,255,0.9),5px_5px_10px_rgba(163,177,198,0.35)]
              hover:text-indigo-600
              active:shadow-[inset_-3px_-3px_6px_rgba(255,255,255,0.8),inset_3px_3px_6px_rgba(163,177,198,0.35)]
              transition
            "
            >
              <ArrowLeft size={22} />
            </button>

            <h1 className="text-2xl font-bold text-slate-900">
              Point {point.point_no || point.id}
            </h1>
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={downloading}
            className="
            flex items-center gap-2
            px-5 py-3
            rounded-2xl
            bg-indigo-600
            text-white
            font-semibold
            shadow-[5px_5px_12px_rgba(79,70,229,0.25)]
            hover:bg-indigo-700
            active:scale-95
            disabled:opacity-50
            transition
          "
          >
            <Download size={18} />
            <span className="hidden sm:inline">
              {downloading ? 'Exporting...' : 'Export'}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-300/70 mb-7" />

        {/* Point title clay card */}
        <div
          className="
          relative
          overflow-hidden
          rounded-[28px]
          bg-gradient-to-br from-indigo-100 via-white to-violet-100
          px-6 py-6
          mb-8
          shadow-[-6px_-6px_14px_rgba(255,255,255,0.9),8px_8px_18px_rgba(163,177,198,0.35)]
        "
        >
          <div className="relative z-10">
            <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-relaxed">
              {point.title_kn}
            </p>

            <p className="text-sm sm:text-base text-slate-500 mt-2">
              {point.title_en}
            </p>
          </div>

          {/* Decorative clay circle */}
          <div
            className="
            absolute
            -right-8
            -top-8
            w-28
            h-28
            rounded-full
            bg-indigo-200/40
            shadow-[inset_-5px_-5px_10px_rgba(255,255,255,0.7),inset_5px_5px_10px_rgba(129,140,248,0.15)]
          "
          />
        </div>

        {/* Locked message */}
        {isLocked && (
          <div
            className="
            mb-7
            rounded-2xl
            bg-amber-50
            border border-amber-100
            px-5 py-4
            text-sm
            text-amber-700
            shadow-[3px_3px_8px_rgba(163,177,198,0.2)]
          "
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🔒</span>
              <div>
                <p className="font-semibold">
                  This month is locked
                </p>
                <p className="text-amber-600 mt-0.5">
                  Entries cannot be added or edited.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Entry / Form */}
        {!isLocked && (entries.length === 0 || editingEntry) && (
          showForm ? (
            <div className="mb-8">
              <EntryForm
                point={point}
                month={currentMonth}
                existingEntry={editingEntry}
                onSaved={refreshEntries}
                onCancel={() => {
                  setShowForm(false);
                  setEditingEntry(null);
                }}
              />
            </div>
          ) : (
            entries.length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="
                flex items-center gap-2
                px-5 py-3
                mb-8
                rounded-2xl
                bg-white
                text-indigo-600
                font-semibold
                shadow-[-5px_-5px_10px_rgba(255,255,255,0.9),6px_6px_12px_rgba(163,177,198,0.35)]
                hover:text-indigo-700
                active:shadow-[inset_-3px_-3px_6px_rgba(255,255,255,0.8),inset_3px_3px_6px_rgba(163,177,198,0.3)]
                transition
              "
              >
                <Plus size={18} />
                Add Entry
              </button>
            )
          )
        )}

        {/* Entries heading */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            Entries ({entries.length})
          </h2>

          {currentMonth && (
            <span
              className="
              px-4 py-2
              rounded-xl
              bg-[#eef1f7]
              text-sm
              font-semibold
              text-indigo-600
              shadow-[inset_-3px_-3px_6px_rgba(255,255,255,0.8),inset_3px_3px_6px_rgba(163,177,198,0.25)]
            "
            >
              {currentMonth}
            </span>
          )}
        </div>

        {/* Entries */}
        <div className="space-y-5">

          {entries.map((entry) => {
            const { date, time } = formatDate(entry.created_at);
            const isExpanded = expandedIds.has(entry.id);
            const visibleCols = isExpanded
              ? point.columns
              : point.columns.slice(0, 3);

            return (
              <div
                key={entry.id}
                className="
                relative
                rounded-[28px]
                bg-white/80
                p-5
                sm:p-6
                border border-white
                shadow-[-7px_-7px_16px_rgba(255,255,255,0.9),8px_8px_18px_rgba(163,177,198,0.32)]
              "
              >

                {/* Entry header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/70">

                  <div className="flex items-center gap-3">

                    {/* Calendar clay button */}
                    <div
                      className="
                      w-11 h-11
                      flex items-center justify-center
                      rounded-2xl
                      bg-[#eef1f7]
                      text-indigo-500
                      shadow-[inset_-4px_-4px_8px_rgba(255,255,255,0.9),inset_4px_4px_8px_rgba(163,177,198,0.25)]
                    "
                    >
                      <Calendar size={19} />
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        {date}
                      </p>

                      <p className="text-xs text-slate-400 mt-0.5">
                        {time}
                      </p>
                    </div>
                  </div>

                  {/* Three dots - hide completely when locked */}
                  {!isLocked && (
                    <button
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === entry.id ? null : entry.id
                        )
                      }
                      className="
                      w-10 h-10
                      flex items-center justify-center
                      rounded-xl
                      bg-[#eef1f7]
                      text-slate-400
                      shadow-[-3px_-3px_6px_rgba(255,255,255,0.8),3px_3px_6px_rgba(163,177,198,0.25)]
                      hover:text-indigo-600
                      transition
                    "
                    >
                      <MoreVertical size={18} />
                    </button>
                  )}

                  {/* Dropdown */}
                  {openMenuId === entry.id && !isLocked && (
                    <div
                      className="
                      absolute
                      right-5
                      top-16
                      w-36
                      bg-white
                      rounded-2xl
                      border border-slate-100
                      p-2
                      z-20
                      shadow-[0_12px_30px_rgba(15,23,42,0.15)]
                    "
                    >
                      <button
                        onClick={() => {
                          setEditingEntry(entry);
                          setShowForm(true);
                          setOpenMenuId(null);
                        }}
                        className="
                        w-full
                        flex items-center gap-2
                        px-3 py-2.5
                        rounded-xl
                        text-sm
                        text-slate-700
                        hover:bg-indigo-50
                        hover:text-indigo-600
                        transition
                      "
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        onClick={() => {
                          setDeleteTarget(entry.id);
                          setOpenMenuId(null);
                        }}
                        className="
                        w-full
                        flex items-center gap-2
                        px-3 py-2.5
                        rounded-xl
                        text-sm
                        text-red-500
                        hover:bg-red-50
                        transition
                      "
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Entry fields */}
                <div className="space-y-3">

                  {visibleCols.map((col) => (
                    <div
                      key={col.id}
                      className="
                      flex
                      justify-between
                      items-start
                      gap-5
                      py-2
                    "
                    >
                      <span className="text-sm text-slate-500 leading-relaxed">
                        {col.label_kn}
                      </span>

                      <span
                        className="
                        text-sm
                        font-semibold
                        text-slate-800
                        text-right
                        leading-relaxed
                      "
                      >
                        {col.id === 'month'
                          ? (entry.month ?? '-')
                          : (entry.data[col.id] ?? '-')}
                      </span>
                    </div>
                  ))}

                </div>

                {/* Show more */}
                {point.columns.length > 3 && (
                  <div className="pt-4 mt-3 border-t border-slate-200/70">
                    <button
                      onClick={() => toggleExpanded(entry.id)}
                      className="
                      flex items-center gap-2
                      text-indigo-600
                      text-sm
                      font-semibold
                      px-3 py-2
                      rounded-xl
                      hover:bg-indigo-50
                      transition
                    "
                    >
                      {isExpanded ? 'Show less' : 'Show more'}

                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''
                          }`}
                      />
                    </button>
                  </div>
                )}

              </div>
            );
          })}

        </div>

        {/* Delete dialog */}
        {deleteTarget && (
          <ConfirmDialog
            title="Delete this entry?"
            message="This action cannot be undone."
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}

        {/* Toast */}
        {toastMessage && (
          <Toast
            message={toastMessage}
            onDismiss={() => setToastMessage(null)}
          />
        )}

      </div>
    </div>
  );
}

export default PointDetail;