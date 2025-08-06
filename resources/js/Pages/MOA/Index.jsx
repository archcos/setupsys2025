import React, { useState, useEffect } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function MOAIndex({ moas, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [perPage, setPerPage] = useState(filters?.perPage || 10);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const { auth } = usePage().props;
  const isStaff = auth?.user?.role === 'staff';
  useEffect(() => {
    const delay = setTimeout(() => {
      router.get('/moa', { search, perPage }, { preserveState: true, replace: true });
    }, 500);
    return () => clearTimeout(delay);
  }, [search, perPage]);

  const handlePageChange = (url) => {
    router.visit(url, {
      preserveState: true,
      replace: true,
      only: ['moas'],
      data: { search, perPage },
    });
  };

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="MOA List" />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-6">
            <h1 className="text-xl font-bold mb-4">List of MOAs</h1>

            {/* Search and Per Page */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <input
                type="text"
                placeholder="Search project title, owner, PD..."
                className="border rounded px-3 py-1 text-sm w-full sm:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Show</label>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-700">entries</span>
              </div>
            </div>

            {/* Table */}
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Project Title</th>
                  <th className="border px-4 py-2">Company Representative</th>
                  <th className="border px-4 py-2">Witness</th>
                  <th className="border px-4 py-2">Director's Name</th>
                  <th className="border px-4 py-2">Director's Position</th>
                  <th className="border px-4 py-2">Office</th>
                  <th className="border px-4 py-2">Project Cost</th>
                  <th className="border px-4 py-2">Created At</th>
                  <th className="border px-4 py-2">Actions</th>
                  <th className="border px-4 py-2">Acknowledge</th>
                </tr>
              </thead>
              <tbody>
                {moas.data.map((moa) => (
                  <tr key={moa.moa_id}>
                    <td className="border px-4 py-2">{moa.project?.project_title}</td>
                    <td className="border px-4 py-2">{moa.owner_name ?? '—'}</td>
                    <td className="border px-4 py-2">{moa.witness}</td>
                    <td className="border px-4 py-2">{moa.pd_name}</td>
                    <td className="border px-4 py-2">{moa.pd_title}</td>
                    <td className="border px-4 py-2">{moa.project?.company?.office?.office_name ?? '—'}</td>
                    <td className="border px-4 py-2">₱ {parseFloat(moa.project_cost).toLocaleString()}</td>
                    <td className="border px-4 py-2">{new Date(moa.created_at).toLocaleDateString()}</td>
                    <td className="border px-4 py-2 text-center">
                      <div className="flex flex-col gap-1">
                        <a href={`/moa/${moa.moa_id}/pdf`} target="_blank" className="text-blue-600 hover:underline">View PDF</a>
                        <a href={`/moa/${moa.moa_id}/docx`} className="text-green-600 hover:underline">Download DOCX</a>
                      </div>
                    </td>
                   <td className="border px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={moa.project?.progress === 'Implementation'}
                      disabled={!isStaff}
                      onChange={(e) => {
                        const newProgress = e.target.checked ? 'Implementation' : 'Draft MOA';
                        router.put(`/projects/${moa.project?.project_id}/progress`, {
                          progress: newProgress,
                        }, { preserveState: true });
                      }}
                    />
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-6 flex justify-end space-x-2">
              {moas.links.map((link, index) => (
                <button
                  key={index}
                  disabled={!link.url}
                  onClick={() => handlePageChange(link.url)}
                  className={`px-3 py-1 rounded text-sm ${
                    link.active
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
