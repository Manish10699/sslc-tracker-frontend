import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MoreVertical, Pencil, Trash2, Calendar, ChevronDown, Download } from 'lucide-react';
import api from '../api';
import EntryForm from '../components/EntryForm';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

function PointDetail() {
  const { pointNo } = useParams();
  const navigate = useNavigate();
  const [point, setPoint] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [openMenuId, setOpenMenuId] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/points/${pointNo}/`),
      api.get(`/entries/?point=${pointNo}`),
    ])
      .then(([pointRes, entriesRes]) => {
        setPoint(pointRes.data);
        setEntries(entriesRes.data);
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          navigate('/login');
        } else {
          console.error('Failed to load point', error);
        }
      })
      .finally(() => setLoading(false));
  }, [pointNo]);

const refreshEntries = (message) => {
    api.get(`/entries/?point=${pointNo}`).then((res) => setEntries(res.data));
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
      const response = await api.get(`/points/${pointNo}/export/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `point_${pointNo}.xlsx`);
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
  if (!point) return <p className="p-6 text-red-500">Point not found</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/points')} className="text-gray-500 hover:text-gray-900">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Point {point.id}</h1>
        </div>
        <button
          onClick={handleExport}
          disabled={downloading}
          className="flex items-center gap-2 text-sm bg-indigo-600 text-white font-semibold border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50"
        >
          <Download size={16} /> {downloading ? 'Exporting...' : 'Export'}
        </button>

      </div>
      <hr className="mb-4 border-gray-400" />


      <div className="bg-gradient-to-r from-indigo-100 via-blue-50 to-violet-100 rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
        <p className="font-semibold text-gray-900">{point.title_kn}</p>
        <p className="text-sm text-gray-500 mt-1">{point.title_en}</p>
      </div>

      {showForm ? (
        <div className="mb-6">
          <EntryForm
    point={point}
    existingEntry={editingEntry}
    onSaved={() => refreshEntries(editingEntry ? 'Entry updated' : 'Entry added successfully')}
    onCancel={() => { setShowForm(false); setEditingEntry(null); }}
  />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition mb-6"
        >
          <Plus size={18} /> Add Entry
        </button>
      )}

      <h2 className="font-semibold text-gray-900 mb-3">Entries ({entries.length})</h2>

      <div className="space-y-3">
        {entries.map((entry) => {
          const { date, time } = formatDate(entry.created_at);
          const isExpanded = expandedIds.has(entry.id);
          const visibleCols = isExpanded ? point.columns : point.columns.slice(0, 3);

          return (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{date}</p>
                    <p className="text-xs text-gray-400">{time}</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenMenuId(openMenuId === entry.id ? null : entry.id)}
                  className="text-gray-400 hover:text-gray-700 p-1"
                >
                  <MoreVertical size={18} />
                </button>
                {openMenuId === entry.id && (
                  <div className="absolute right-4 top-10 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10 w-32">
                    <button
                      onClick={() => { setEditingEntry(entry); setShowForm(true); setOpenMenuId(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => { setDeleteTarget(entry.id); setOpenMenuId(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>

              {visibleCols.map((col) => (
                <div key={col.id} className="flex justify-between text-sm py-1 gap-4">
                  <span className="text-gray-500">{col.label_kn}</span>
                  <span className="text-gray-900 font-medium text-right">
                    {col.id === 'month' ? (entry.month ?? '-') : (entry.data[col.id] ?? '-')}
                  </span>
                </div>
              ))}

              {point.columns.length > 3 && (
                <button
                  onClick={() => toggleExpanded(entry.id)}
                  className="flex items-center gap-1 text-indigo-600 text-sm font-medium mt-2"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                  <ChevronDown size={14} className={isExpanded ? 'rotate-180' : ''} />
                </button>
              )}


            </div>
          );
        })}
      </div>
      {deleteTarget && (
        <ConfirmDialog
          title="Delete this entry?"
          message="This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

       {toastMessage && (
    <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
  )}
    </div>
  );
}

export default PointDetail;