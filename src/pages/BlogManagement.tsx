import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle, Search, Tag, Eye, EyeOff, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import BlogService, { Blog, BlogPosition } from '../services/blogService';
import { EnhancedSelect } from '../components/UI';

const POSITIONS: BlogPosition[] = ['landing', 'user'];

const BlogManagement: React.FC = () => {
  // Data
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState<BlogPosition>('landing');
  const [creating, setCreating] = useState<boolean>(false);
  const [showCreate, setShowCreate] = useState<boolean>(true);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPosition, setEditPosition] = useState<BlogPosition>('landing');

  // Filters
  const [filterQuery, setFilterQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState<'' | BlogPosition>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredBlogs = useMemo(() => {
    return blogs.filter(b => {
      const matchesQuery = !filterQuery || b.title.toLowerCase().includes(filterQuery.toLowerCase()) || (b.description ?? '').toLowerCase().includes(filterQuery.toLowerCase());
      const matchesPos = !filterPosition || b.position === filterPosition;
      return matchesQuery && matchesPos;
    });
  }, [blogs, filterQuery, filterPosition]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  useEffect(() => { setPage(1); }, [filterQuery, filterPosition]);

  const clearMessages = () => { setError(null); setSuccess(null); };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await BlogService.getAll();
      setBlogs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setPosition('landing');
  };

  const handleCreate = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setCreating(true);
    setError(null); setSuccess(null);
    try {
      const created = await BlogService.create({ title: title.trim(), description: description.trim() || null, position });
      setBlogs(prev => [created, ...prev]);
      resetCreateForm();
      setSuccess('Blog created');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create blog');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (b: Blog) => {
    setEditingId(b.id);
    setEditTitle(b.title);
    setEditDescription(b.description ?? '');
    setEditPosition(b.position);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
    setEditPosition('landing');
  };

  const handleUpdate = async (id: string) => {
    if (!editTitle.trim()) { setError('Title is required'); return; }
    setError(null); setSuccess(null);
    try {
      const updated = await BlogService.update(id, { title: editTitle.trim(), description: editDescription.trim() || null, position: editPosition });
      setBlogs(prev => prev.map(b => b.id === id ? updated : b));
      setSuccess('Blog updated');
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update blog');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog?')) return;
    setError(null); setSuccess(null);
    try {
      await BlogService.remove(id);
      setBlogs(prev => prev.filter(b => b.id !== id));
      setSuccess('Blog deleted');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete blog');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Blog Management</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
            <button onClick={clearMessages} className="ml-auto text-red-600 hover:text-red-800">×</button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700">{success}</span>
            <button onClick={clearMessages} className="ml-auto text-green-600 hover:text-green-800">×</button>
          </div>
        )}

        {/* Create Section */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Blog
            </h2>
            <button
              onClick={() => setShowCreate(s => !s)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              title={showCreate ? 'Hide' : 'Show'}
            >
              {showCreate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showCreate ? 'Hide' : 'Show'}
            </button>
          </div>

          {showCreate && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                  <EnhancedSelect
                    value={position}
                    onChange={(v) => setPosition(v as BlogPosition)}
                    options={POSITIONS.map(p => ({ value: p, label: p }))}
                    placeholder="Select position"
                    variant="filled"
                    size="md"
                    customDropdown={true}
                    searchable={false}
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description (optional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {creating ? 'Creating...' : 'Create Blog'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Filter Section */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filter Blogs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search by title or description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <div className="w-full">
                  <EnhancedSelect
                    value={filterPosition || ''}
                    onChange={(v) => setFilterPosition((v as BlogPosition) || '')}
                    options={[{ value: '', label: 'All' }, ...POSITIONS.map(p => ({ value: p, label: p }))]}
                    placeholder="All positions"
                    variant="filled"
                    size="md"
                    customDropdown={true}
                    searchable={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Blogs {!loading && `(${filteredBlogs.length})`}
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading blogs...</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No blogs found</p>
            </div>
          ) : (
            <div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3">
              {filteredBlogs.slice((page-1)*pageSize, (page-1)*pageSize + pageSize).map((b) => (
                <div key={b.id} className="relative rounded-2xl border border-gray-200/80 bg-white p-5 shadow-md ring-1 ring-gray-50 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200/80 hover:shadow-xl hover:ring-blue-100">
                  {editingId === b.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <EnhancedSelect
                          value={editPosition}
                          onChange={(v) => setEditPosition(v as BlogPosition)}
                          options={POSITIONS.map(p => ({ value: p, label: p }))}
                          placeholder="Select position"
                          variant="filled"
                          size="md"
                          customDropdown={true}
                          searchable={false}
                        />
                      </div>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(b.id)} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
                        <button onClick={cancelEdit} className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start flex-col justify-between gap-4 w-full">
                      <div className='flex flex-row w-full justify-between items-start'>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 break-words text-lg">{b.title}</h3>
                          <div className="text-sm text-gray-500">Position: {b.position}</div>
                          {b.created_at && <div className="text-xs text-gray-500 mt-2">{new Date(b.created_at).toLocaleString()}</div>}
                        </div>

                        <div className="flex items-center gap-2">
                          {b.description && (b.description.length > 50) && (
                            <button
                              onClick={() => toggleExpanded(b.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              aria-label={expandedIds.has(b.id) ? 'Collapse description' : 'Expand description'}
                            >
                              {expandedIds.has(b.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                          <button onClick={() => startEdit(b)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(b.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                         {b.description && (
                            <p className="mt-1 text-gray-700 whitespace-pre-wrap break-words">
                              {expandedIds.has(b.id) ? (b.description || '') : ((b.description || '').length > 50 ? (b.description || '').slice(0,50) + '...' : (b.description || ''))}
                            </p>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
              <div className="text-sm text-gray-600">
                Page {page} of {Math.max(1, Math.ceil(filteredBlogs.length / pageSize))} • {filteredBlogs.length} total
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(Math.ceil(filteredBlogs.length / pageSize) || 1, p + 1))}
                  disabled={page >= Math.ceil(filteredBlogs.length / pageSize)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
                <div className="min-w-[140px]">
                  <EnhancedSelect
                    value={pageSize}
                    onChange={(v) => setPageSize(Number(v))}
                    options={[
                      { value: 6, label: '6 / page' },
                      { value: 12, label: '12 / page' },
                      { value: 24, label: '24 / page' },
                    ]}
                    placeholder="Items per page"
                    variant="filled"
                    size="sm"
                    customDropdown={true}
                    searchable={false}
                  />
                </div>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogManagement;