import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, Download } from 'lucide-react';

export default function LogManagement({ logs = [], filters: initialFilters = {}, actions = [], modelTypes = [], pagination = {} }) {
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [filters, setFilters] = useState(initialFilters || {});
  const [sortBy, setSortBy] = useState('desc');
  const [perPage, setPerPage] = useState(pagination.per_page || 10);
  const [currentPage, setCurrentPage] = useState(pagination.current_page || 1);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    router.get(route('logs.index'), {
      ...newFilters,
      per_page: perPage,
      page: 1
    }, { preserveState: false });
  };

  const handlePerPageChange = (e) => {
    const newPerPage = parseInt(e.target.value);
    router.get(route('logs.index'), {
      ...filters,
      per_page: newPerPage,
      page: 1
    }, { preserveState: false });
  };

  // Ensure logs is an array
  const logsArray = Array.isArray(logs) ? logs : [];

  // Sort by created_at on client side
  let displayLogs = [...logsArray].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortBy === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Use server-side pagination data
  const totalItems = pagination?.total || 0;
  const totalPages = pagination?.last_page || 1;
  const startIndex = (currentPage - 1) * perPage;
  const paginatedLogs = displayLogs;

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      router.get(route('logs.index'), {
        ...filters,
        per_page: perPage,
        page: currentPage - 1
      }, { preserveState: false });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      router.get(route('logs.index'), {
        ...filters,
        per_page: perPage,
        page: currentPage + 1
      }, { preserveState: false });
    }
  };

  const handleDownloadExcel = () => {
    const params = new URLSearchParams();
    
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.project_id) params.append('project_id', filters.project_id);
    if (filters.action) params.append('action', filters.action);
    if (filters.model_type) params.append('model_type', filters.model_type);
    params.append('days', filters.days || 90);
    
    const url = route('logs.export') + '?' + params.toString();
    window.location.href = url;
  };

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto">
      <Head title="Activity Logs" />

      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" /> Activity Logs
        </h1>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-sm text-gray-700">Total logs: <strong>{totalItems}</strong> | Showing <strong>{totalItems > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + perPage, totalItems)}</strong></p>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Export to CSV
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1">User ID</label>
            <input
              type="text"
              name="user_id"
              value={filters.user_id || ''}
              onChange={handleFilterChange}
              placeholder="Filter by user ID..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1">Project ID</label>
            <input
              type="text"
              name="project_id"
              value={filters.project_id || ''}
              onChange={handleFilterChange}
              placeholder="Filter by project ID..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1">Action</label>
            <select
              name="action"
              value={filters.action || ''}
              onChange={handleFilterChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Actions</option>
              {Array.isArray(actions) && actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1">Model Type</label>
            <select
              name="model_type"
              value={filters.model_type || ''}
              onChange={handleFilterChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Models</option>
              {Array.isArray(modelTypes) && modelTypes.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1">Days</label>
            <select
              name="days"
              value={filters.days || '90'}
              onChange={handleFilterChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="w-8 px-4 py-2"></th>
                <th className="px-4 py-2 text-left">IP Address</th>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Project</th>
                <th className="px-4 py-2 text-left">Action</th>
                <th className="px-4 py-2 text-left">Model</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200" onClick={() => setSortBy(sortBy === 'asc' ? 'desc' : 'asc')}>
                  Created {sortBy === 'asc' ? '↑' : '↓'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.flatMap((log) => [
                  <tr 
                    key={`row-${log.id}`}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedLogId(selectedLogId === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-2 text-center">
                      {selectedLogId === log.id ? (
                        <ChevronUp className="w-4 h-4 inline" />
                      ) : (
                        <ChevronDown className="w-4 h-4 inline" />
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs font-mono">{log.ip_address}</td>
                    <td className="px-4 py-2">{log.user?.name || 'System'}</td>
                    <td className="px-4 py-2">{log.project_id || '-'}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">{log.model_type}</td>
                    <td className="px-4 py-2 text-xs text-gray-600">{log.description}</td>
                    <td className="px-4 py-2 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>,
                  selectedLogId === log.id && (
                    <tr key={`details-${log.id}`} className="bg-gray-50 border-t-2 border-gray-200">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-sm mb-3">Log Details</h4>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <p className="text-gray-600 font-semibold">Model ID:</p>
                              <p className="font-mono bg-gray-100 p-2 rounded text-xs">{log.model_id}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-semibold">User Agent:</p>
                              <p className="font-mono bg-gray-100 p-2 rounded text-xs break-words">{log.user_agent || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <strong className="text-sm">Before:</strong>
                              <pre className="bg-gray-100 p-3 rounded mt-2 overflow-auto max-h-48 text-xs">
                                {log.before ? JSON.stringify(log.before, null, 2) : 'null'}
                              </pre>
                            </div>
                            <div>
                              <strong className="text-sm">After:</strong>
                              <pre className="bg-gray-100 p-3 rounded mt-2 overflow-auto max-h-48 text-xs">
                                {log.after ? JSON.stringify(log.after, null, 2) : 'null'}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                ])
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Entries per page:</label>
            <select
              value={perPage}
              onChange={handlePerPageChange}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-3 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}