import { useState } from 'react';
import api from '../api';

const MONTHS = ['May', 'June', 'July', 'August', 'September', 'October',
  'November', 'December', 'January', 'February', 'March', 'April'];

function EntryForm({ point, month, existingEntry, onSaved, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(() => {
    if (existingEntry) {
      return { ...existingEntry.data, month: existingEntry.month };
    }
    return { month };
  });

  const handleChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handlePhotoUpload = async (id, file) => {
    setUploadingPhoto(id);
    const data = new FormData();
    data.append('photo', file);
    try {
      const response = await api.post('/upload-photo/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      handleChange(id, response.data.url);
    } catch (error) {
      console.error('Photo upload failed', error);
    } finally {
      setUploadingPhoto(null);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSaving(true);
  try {
    const payload = { point: point.id, month: formData.month, data: { ...formData } };
    delete payload.data.month;
    if (existingEntry) {
      await api.patch(`/entries/${existingEntry.id}/`, payload);
    } else {
      await api.post('/entries/', payload);
    }
    onSaved();
  } catch (err) {
  console.log('Backend error:', err.response?.data);

  const data = err.response?.data;

  const message =
    data?.non_field_errors?.[0] ||
    data?.month?.[0] ||
    data?.point?.[0] ||
    data?.academic_year?.[0] ||
    'Failed to save entry';

  setError(message);
}finally {
    setSaving(false);
  }
};

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>}
      
        <div className="bg-indigo-50 text-indigo-700 text-sm font-medium rounded-xl px-4 py-2.5">
  Adding entry for: {month}
</div>
      

      {point.columns.map((col) => (
        <div key={col.id}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {col.label_kn}
            {col.required === false && <span className="text-gray-400 font-normal"> (optional)</span>}
          </label>

          {col.type === 'number' && (
            <input
              type="number"
              required={col.required !== false}
              value={formData[col.id] || ''}
              onChange={(e) => handleChange(col.id, e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}

          {col.type === 'text' && (
            <textarea
              required={col.required !== false}
              value={formData[col.id] || ''}
              onChange={(e) => handleChange(col.id, e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}

          {col.type === 'date' && (
            <input
              type="date"
              required={col.required !== false}
              value={formData[col.id] || ''}
              onChange={(e) => handleChange(col.id, e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}

          {col.type === 'yes_no' && (
            <div className="flex gap-3">
              {['Yes', 'No'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
                  <input
                    type="radio"
                    name={col.id}
                    required={col.required !== false}
                    checked={formData[col.id] === opt}
                    onChange={() => handleChange(col.id, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {col.type === 'photo' && (
            <div>
              <label
                htmlFor={`photo-${col.id}`}
                className="flex flex-col items-center justify-center w-full h-32 
                 border-2 border-dashed border-gray-200 rounded-xl 
                 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 
                 cursor-pointer transition"
              >
                <div className="text-2xl mb-2">📷</div>

                <p className="text-sm font-semibold text-gray-700">
                  Upload Photo
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG or JPEG
                </p>
              </label>

              <input
                id={`photo-${col.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files[0] &&
                  handlePhotoUpload(col.id, e.target.files[0])
                }
              />

              {uploadingPhoto === col.id && (
                <p className="text-sm text-indigo-500 mt-2">
                  Uploading...
                </p>
              )}

              {formData[col.id] && uploadingPhoto !== col.id && (
                <div className="mt-3">
                  <img
                    src={formData[col.id]}
                    alt="Uploaded"
                    className="h-24 w-24 object-cover rounded-xl border border-gray-200"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default EntryForm;