import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Search, AlertCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import BlogService, { Blog } from '../services/blogService';
import { EnhancedSelect } from '../components/UI';

const UserBlogs: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  useEffect(() => { setPage(1); }, [query, fromDate, toDate]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    return blogs.filter(b => {
      // Text filter
      const matchText = !q || b.title.toLowerCase().includes(q) || (b.description ?? '').toLowerCase().includes(q);
      if (!matchText) return false;

      // Date filter
      if (!b.created_at) return true; // keep if no date
      const created = new Date(b.created_at);
      if (Number.isNaN(created.getTime())) return true;

      // Normalize to midnight ranges for inclusive filtering
      if (from && created < new Date(from.getFullYear(), from.getMonth(), from.getDate())) return false;
      if (to && created > new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999)) return false;

      return true;
    });
  }, [blogs, query, fromDate, toDate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await BlogService.getByPosition('user');
        setBlogs(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load blogs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Blogs</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title or description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Blog {!loading && `(${filtered.length})`}
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading blogs...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No blogs found</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3">
                {filtered.slice((page-1)*pageSize, (page-1)*pageSize + pageSize).map((b) => {
                  const isOpen = expanded.has(b.id);
                  const short = (b.description || '').length > 80 ? (b.description || '').slice(0, 80) + '...' : (b.description || '');
                  const created = b.created_at ? new Date(b.created_at) : null;
                  const isNew = created ? (Date.now() - created.getTime()) < 7 * 24 * 60 * 60 * 1000 : false;

                  return (
                    <div
                      key={b.id}
                      className="relative rounded-2xl border border-gray-200/80 bg-white p-5 shadow-md ring-1 ring-gray-50 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200/80 hover:shadow-xl hover:ring-blue-100"
                    >
                      <div className="flex items-start justify-between flex-col gap-4 w-full">
                        <div className="min-w-0 flex flex-row w-full justify-between items-start">
                          <div className="min-w-0 flex items-start gap-2">
                            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <h3 className="font-semibold text-gray-900 break-words text-lg">{b.title}</h3>
                            {isNew && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                New
                              </span>
                            )}
                          </div>

                          {b.description && b.description.length > 80 && (
                            <button
                              onClick={() => toggleExpanded(b.id)}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap self-start rounded-md px-2 py-1 hover:bg-blue-50"
                              aria-label={isOpen ? 'Collapse description' : 'Expand description'}
                            >
                              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                        </div>

                        <div className="w-full">
                          {b.description && (
                            <p className="mt-1 text-gray-700 whitespace-pre-wrap break-words leading-relaxed text-sm">
                              {isOpen ? b.description : short}
                            </p>
                          )}
                          {b.created_at && (
                            <div className="text-xs text-gray-500 mt-3">{new Date(b.created_at).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
                <div className="text-sm text-gray-600">
                  Page {page} of {Math.max(1, Math.ceil(filtered.length / pageSize))} • {filtered.length} total
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
                    onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / pageSize) || 1, p + 1))}
                    disabled={page >= Math.ceil(filtered.length / pageSize)}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserBlogs;