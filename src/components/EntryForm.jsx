import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../api';

const MONTHS = ['May', 'June', 'July', 'August', 'September', 'October',
  'November', 'December', 'January', 'February', 'March', 'April'];

function EntryForm({ point, month, existingEntry, onSaved, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const [error, setError] = useState('');
  const [photoErrors, setPhotoErrors] = useState({});
  const [formData, setFormData] = useState(() => {
    if (existingEntry) {
      return { ...existingEntry.data, month: existingEntry.month };
    }
    return { month };
  });

  useEffect(() => {
    const updates = {};
    point.columns.forEach((col) => {
      if (col.computed_from) {
        const [aId, bId] = col.computed_from;
        const a = parseFloat(formData[aId]);
        const b = parseFloat(formData[bId]);
        if (!isNaN(a) && !isNaN(b)) {
          updates[col.id] = a - b;
        }
      }
    });
    if (Object.keys(updates).length > 0) {
      setFormData((prev) => ({ ...prev, ...updates }));
    }
  }, [point.columns, JSON.stringify(formData)]);

  const handleChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handlePhotoUpload = async (id, file) => {
    const minPhotoSize = 40 * 1024;
    const maxPhotoSize = 70 * 1024;

    if (file.size < minPhotoSize || file.size > maxPhotoSize) {
      setPhotoErrors((prev) => ({
        ...prev,
        [id]: 'Photo size must be between 40 KB and 70 KB.',
      }));
      return;
    }

    setPhotoErrors((prev) => ({ ...prev, [id]: null }));
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

  const removePhoto = (id) => {
    setFormData((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setPhotoErrors((prev) => ({ ...prev, [id]: null }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  const missingRequiredPhotos = point.columns.filter(
    (col) => col.type === 'photo' && col.required !== false && !formData[col.id]
  );

  if (missingRequiredPhotos.length > 0) {
    setPhotoErrors((prev) => ({
      ...prev,
      ...Object.fromEntries(
        missingRequiredPhotos.map((col) => [col.id, 'Please upload a photo.'])
      ),
    }));
    return;
  }

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

          {col.type === 'number' && col.computed_from && (
            <input
              type="number"
              value={formData[col.id] ?? ''}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
            />
          )}

          {col.type === 'number' && !col.computed_from && (
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
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handlePhotoUpload(col.id, file);
                  e.target.value = '';
                }}
              />

              {uploadingPhoto === col.id && (
                <p className="text-sm text-indigo-500 mt-2">
                  Uploading...
                </p>
              )}

              {photoErrors[col.id] && (
                <p className="text-sm text-red-600 mt-2">
                  {photoErrors[col.id]}
                </p>
              )}

              {formData[col.id] && uploadingPhoto !== col.id && (
                <div className="relative mt-3 inline-block">
                  <img
                    src={formData[col.id]}
                    alt="Uploaded"
                    className="h-24 w-24 object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(col.id)}
                    aria-label="Remove uploaded photo"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-slate-600 shadow-sm hover:bg-gray-200"
                  >
                    <X size={14} />
                  </button>
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
