import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Bell, Plus, Trash2, X, AlertCircle } from 'lucide-react';

export const AnnouncementsView: React.FC = () => {
  const { user, role } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [audience, setAudience] = useState<'ALL' | 'STUDENTS' | 'TEACHERS'>('ALL');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [saving, setSaving] = useState(false);

  const canPublish = role === 'ADMIN' || role === 'TEACHER';

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await api.getAnnouncements({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [categoryFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setSaving(true);
    try {
      await api.createAnnouncement({
        title,
        content,
        category,
        audience,
        priority,
      });
      setShowModal(false);
      setTitle('');
      setContent('');
      loadAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to post announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this school announcement?')) return;
    try {
      await api.deleteAnnouncement(id);
      loadAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Institutional Announcements & Circulars
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official academy directives, examination notices, event dates, and administrative bulletins
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-blue-600"
          >
            <option value="all">All Bulletins</option>
            <option value="EXAM">Examination</option>
            <option value="ACADEMIC">Academic</option>
            <option value="ADMINISTRATIVE">Administrative</option>
            <option value="EVENT">Events</option>
            <option value="GENERAL">General</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono text-xs">{announcements.length} notices on bulletin</div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-md border border-slate-200">
          Loading announcements...
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white border rounded-md p-5 shadow-xs space-y-3 ${
                ann.priority === 'HIGH' || ann.priority === 'URGENT'
                  ? 'border-l-4 border-l-rose-600 border-slate-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  {ann.priority === 'HIGH' || ann.priority === 'URGENT' ? (
                    <span className="bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs px-2 py-0.5 rounded-sm uppercase">
                      Urgent Notice
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs px-2 py-0.5 rounded-sm">
                      {ann.category}
                    </span>
                  )}
                  <h2 className="text-sm font-bold text-slate-900">{ann.title}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">
                    Audience: <span className="font-semibold text-slate-600">{ann.audience}</span>
                  </span>

                  {(role === 'ADMIN' || ann.authorId === user?.id) && (
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-sm"
                      title="Delete announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{ann.content}</div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 font-mono">
                <div>
                  Published By: <span className="text-slate-600 font-medium">{ann.author?.fullName}</span>
                </div>
                <div>{new Date(ann.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-md border border-slate-200">
          No announcements found in this category.
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-lg w-full border border-slate-300 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">Publish Institutional Notice</span>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Notice Title: <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End of Term Examination Logistics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Category:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                  >
                    <option value="GENERAL">General</option>
                    <option value="EXAM">Examination</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="ADMINISTRATIVE">Administrative</option>
                    <option value="EVENT">Event</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Target Audience:</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                  >
                    <option value="ALL">Entire Academy</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="TEACHERS">Faculty Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Priority Level:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Content &amp; Announcement Details: <span className="text-rose-500">*</span></label>
                <textarea
                  rows={5}
                  required
                  placeholder="Draft full message or bulletin directive..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 border border-slate-300 rounded-md">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-1.5 bg-slate-900 text-white rounded-md font-medium disabled:opacity-50">
                  {saving ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
