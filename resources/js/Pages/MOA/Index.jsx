import React, { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function MOAIndex({ moas, filters }) {
  const [search, setSearch] = useState(filters?.search || '');

  // Dynamic search: debounce 500ms
  useEffect(() => {
    const delay = setTimeout(() => {
      router.get('/moa', { search }, { preserveState: true, replace: true });
    }, 500);

    return () => clearTimeout(delay);
  }, [search]);

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar isOpen={true} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={true} toggleSidebar={() => {}} />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-6">
            <h1 className="text-xl font-bold mb-4">List of MOAs</h1>

            {/* 🔍 Dynamic Search Input (no form) */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search project title, owner, PD..."
                className="border rounded px-3 py-1 text-sm w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* 📋 Table */}
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Project Title</th>
                  <th className="border px-4 py-2">Company Representative</th>
                  <th className="border px-4 py-2">Witness</th>
                  <th className="border px-4 py-2">Director's Name</th>
                  <th className="border px-4 py-2">Director's Position</th>
                  <th className="border px-4 py-2">Project Cost</th>
                  <th className="border px-4 py-2">Amount in Words</th>
                  <th className="border px-4 py-2">Created At</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {moas.map((moa) => (
                  <tr key={moa.moa_id}>
                    <td className="border px-4 py-2">{moa.project?.project_title}</td>
                    <td className="border px-4 py-2">{moa.owner_name ?? '—'}</td>
                    <td className="border px-4 py-2">{moa.witness}</td>
                    <td className="border px-4 py-2">{moa.pd_name}</td>
                    <td className="border px-4 py-2">{moa.pd_title}</td>
                    <td className="border px-4 py-2">₱ {parseFloat(moa.project_cost).toLocaleString()}</td>
                    <td className="border px-4 py-2">{moa.amount_words}</td>
                    <td className="border px-4 py-2">{new Date(moa.created_at).toLocaleDateString()}</td>
                    <td className="border px-4 py-2 text-center">
                      <div className="flex flex-col gap-1">
                        <a
                          href={`/moa/${moa.moa_id}/pdf`}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          View PDF
                        </a>
                        <a
                          href={`/moa/${moa.moa_id}/docx`}
                          className="text-green-600 hover:underline"
                        >
                          Download DOCX
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
