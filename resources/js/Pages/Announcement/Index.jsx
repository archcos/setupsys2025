import React, { useState, useEffect, useRef } from 'react';
import { Link, router, usePage, Head } from '@inertiajs/react';
import { Search, Megaphone, Calendar, ArrowUpDown, X, AlertCircle, CheckCircle, Edit, Trash2, Building2 } from 'lucide-react';
import PaginationLinks from '@/components/PaginationLinks';
import { cleanParams } from '@/utils/cleanParams';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  all: {
    label:      'All',
    tab:        'bg-gray-700 text-white',
    badge:      'bg-gray-100 text-gray-700 border border-gray-200',
  },
  active: {
    label:      'Active',
    tab:        'bg-green-500 text-white',
    badge:      'bg-green-100 text-green-800 border border-green-200',
  },
  expired: {
    label:      'Expired',
    tab:        'bg-red-500 text-white',
    badge:      'bg-red-100 text-red-800 border border-red-200',
  },
  upcoming: {
    label:      'Upcoming',
    tab:        'bg-blue-500 text-white',
    badge:      'bg-blue-100 text-blue-800 border border-blue-200',
  },
};

const STATUS_KEYS = ['all', 'active', 'expired', 'upcoming'];
const FILTER_DEFAULTS = {
  sortBy:       'created_at',
  sortOrder:    'desc',
  statusFilter: 'all',
  perPage:      10,
};
// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusTabs({ statusFilter, statusCounts, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {STATUS_KEYS.map((key) => {
        const cfg      = STATUS_CONFIG[key];
        const isActive = statusFilter === key;
        const count    = statusCounts?.[key] ?? 0;

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              isActive
                ? `${cfg.tab} shadow-sm`
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {cfg.label}
            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold ${
              isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.all;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.badge}`}>
      {cfg.label}
    </span>
  );
}

function SortButton({ field, label, sortBy, onSort }) {
  const isActive = sortBy === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-blue-600 transition-colors group"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 transition-colors ${
        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-400'
      }`} />
    </button>
  );
}

function ActionButtons({ announcement, canEdit, onDelete }) {
  return (
    <div className="flex items-center gap-2">
      {canEdit ? (
        <>
          <Link
            href={`/announcements/${announcement.announce_id}/edit`}
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={() => onDelete(announcement.announce_id)}
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </>
      ) : (
        <span className="text-xs text-gray-400">No actions</span>
      )}
    </div>
  );
}

function EmptyState({ statusFilter, hasFilters, onClear, mobile = false }) {
  return (
    <div className={`px-4 text-center ${mobile ? 'py-8' : 'py-12'}`}>
      <Megaphone className={`mx-auto text-gray-400 mb-3 ${mobile ? 'w-10 h-10' : 'w-12 h-12'}`} />
      <h3 className="text-sm font-medium text-gray-900">No announcements found</h3>
      <p className="mt-1 text-xs text-gray-500">
        {hasFilters ? 'Try adjusting your filters or search terms.' : 'No announcements available.'}
      </p>
      {hasFilters && (
        <button onClick={onClear} className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
          Clear Filters
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Index({ announcements, filters, statusCounts, offices, userRole, userId }) {
  const [search,       setSearch]       = useState(filters?.search       || '');
  const [officeFilter, setOfficeFilter] = useState(filters?.officeFilter || '');
  const [sortBy,       setSortBy]       = useState(filters?.sortBy       || 'created_at');
  const [sortOrder,    setSortOrder]    = useState(filters?.sortOrder    || 'desc');
  const [statusFilter, setStatusFilter] = useState(filters?.statusFilter || 'all');
  const [perPage,      setPerPage]      = useState(filters?.perPage      || 10);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { flash } = usePage().props;
  const isFirstRender = useRef(true);

  const pushRouter = (overrides = {}) => {
    const raw = { search, officeFilter, sortBy, sortOrder, statusFilter, perPage, ...overrides };
    router.get(
      route('announcements.index'),
      cleanParams(raw, FILTER_DEFAULTS),
      { preserveState: true, preserveScroll: false }
    );
  };
  // Debounce search
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => pushRouter(), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSort = (column) => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newOrder);
    pushRouter({ sortBy: column, sortOrder: newOrder });
  };

  const handleStatusFilter = (val) => {
    setStatusFilter(val);
    pushRouter({ statusFilter: val, page: 1 });
  };

  const handlePerPage = (e) => {
    const val = e.target.value;
    setPerPage(val);
    pushRouter({ perPage: val, page: 1 });
  };

  const handleOfficeChange = (e) => {
    const val = e.target.value;
    setOfficeFilter(val);
    pushRouter({ officeFilter: val, page: 1 });
  };

  const handleDelete = (id) => {
    router.delete(`/announcements/${id}`, {
      onSuccess: () => {
        setDeleteConfirm(null);
      },
      onError: () => {
        setDeleteConfirm(null);
        alert('You are not authorized to delete this announcement.');
      }
    });
  };

  const handleClear = () => {
    setSearch('');
    setOfficeFilter('');
    setStatusFilter('all');
    setPerPage(10);
    router.get(route('announcements.index'), {}, { preserveState: true });
  };

  const handlePageChange = (link) => {
    if (!link.url) return;
    const pageNum = new URL(link.url).searchParams.get('page');
    if (pageNum) pushRouter({ page: pageNum });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canEditAnnouncement = (announcement) => {
    return userRole === 'rpmo' || announcement.added_by?.user_id === userId;
  };

  const getAnnouncementStatus = (announcement) => {
    const today = new Date();
    const start = announcement.start_date ? new Date(announcement.start_date) : null;
    const end = announcement.end_date ? new Date(announcement.end_date) : null;

    if (end && today > end) return 'expired';
    if (start && today < start) return 'upcoming';
    return 'active';
  };

  const hasFilters = !!(search || officeFilter || statusFilter !== 'all');
  const data       = announcements?.data || [];
  const pagination = announcements?.data ? announcements : null;

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto w-full">
      <Head title="Announcements" />

      <div className="max-w-8xl mx-auto">

        {/* Flash Messages */}
        {flash?.success && (
          <div className="mb-3 md:mb-4 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg md:rounded-xl flex items-center gap-2 text-xs md:text-sm text-green-800">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {flash.success}
          </div>
        )}
        {flash?.error && (
          <div className="mb-3 md:mb-4 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg md:rounded-xl flex items-center gap-2 text-xs md:text-sm text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {flash.error}
          </div>
        )}

        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gray-50 p-4 md:p-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-2 md:gap-3">
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Megaphone className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">Announcements</h2>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">Manage and view all announcements</p>
                </div>
              </div>
              <Link
                href="/announcements/create"
                className="inline-flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg md:rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-xs md:text-sm font-medium flex-shrink-0 whitespace-nowrap"
              >
                + Add Announcement
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100 space-y-3">

            {/* Status Tabs */}
            <StatusTabs statusFilter={statusFilter} statusCounts={statusCounts} onChange={handleStatusFilter} />

            {/* Search + Per Page */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search title, details, or author..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 md:pl-10 pr-8 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm w-fit">
                <select
                  value={perPage}
                  onChange={handlePerPage}
                  className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-2"
                >
                  {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-xs text-gray-500 hidden md:inline">entries</span>
              </div>
            </div>

            {/* Office + Clear */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 flex-wrap">
              {offices && offices.length > 0 && (
                <div className="flex items-center gap-2 bg-white rounded-lg md:rounded-xl px-3 border border-gray-300 shadow-sm flex-1 md:flex-initial md:min-w-[200px]">
                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={officeFilter}
                    onChange={handleOfficeChange}
                    className="border-0 bg-transparent text-xs md:text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer flex-1 py-2"
                  >
                    <option value="">All Offices</option>
                    {offices.map((office) => (
                      <option key={office.office_id} value={office.office_id}>{office.office_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {hasFilters && (
                <button
                  onClick={handleClear}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg md:rounded-xl hover:bg-red-100 transition-colors text-xs md:text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  <span>Clear filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            {data.length === 0 ? (
              <EmptyState statusFilter={statusFilter} hasFilters={hasFilters} onClear={handleClear} />
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <SortButton
                        field="title"
                        label="TITLE"
                        sortBy={sortBy}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Office</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Added By</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((announcement) => {
                    const status = getAnnouncementStatus(announcement);
                    return (
                      <tr key={announcement.announce_id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                          {announcement.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md break-words whitespace-normal">
                          {announcement.details}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {announcement.office?.office_name || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{announcement.added_by?.name || 'Unknown'}</span>
                            <span className="text-xs text-gray-500">{formatDate(announcement.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(announcement.start_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(announcement.end_date)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <ActionButtons 
                            announcement={announcement} 
                            canEdit={canEditAnnouncement(announcement)}
                            onDelete={setDeleteConfirm}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100 bg-white">
            {data.length === 0 ? (
              <EmptyState statusFilter={statusFilter} hasFilters={hasFilters} onClear={handleClear} mobile />
            ) : (
              data.map((announcement) => {
                const status = getAnnouncementStatus(announcement);
                return (
                  <div key={announcement.announce_id} className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <StatusBadge status={status} />
                          {announcement.office?.office_name && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {announcement.office.office_name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{announcement.title}</h3>
                        <p className="text-xs text-gray-600 mt-0.5 break-words">{announcement.details}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded p-2 text-xs">
                      <p className="text-gray-500 font-medium">Added by: {announcement.added_by?.name || 'Unknown'}</p>
                      <p className="text-gray-500 text-xs">{formatDate(announcement.created_at)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 rounded p-2">
                        <span className="text-gray-500 block font-medium">Start</span>
                        <p className="font-medium text-gray-900 mt-0.5">{formatDate(announcement.start_date)}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <span className="text-gray-500 block font-medium">End</span>
                        <p className="font-medium text-gray-900 mt-0.5">{formatDate(announcement.end_date)}</p>
                      </div>
                    </div>

                    {canEditAnnouncement(announcement) && (
                      <div className="flex gap-2 pt-2">
                        <Link
                          href={`/announcements/${announcement.announce_id}/edit`}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all text-xs font-medium"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(announcement.announce_id)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all text-xs font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {announcements.links && announcements.links.length > 1 && (
            <PaginationLinks
              links={announcements.links}
              from={announcements.from}
              to={announcements.to}
              total={announcements.total}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-lg md:rounded-xl shadow-xl max-w-sm w-full">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                Delete Announcement
              </h3>
            </div>

            <div className="px-4 md:px-6 py-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    Are you sure you want to delete this announcement? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-200 flex gap-2 md:gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}