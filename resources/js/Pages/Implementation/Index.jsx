import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Link } from '@inertiajs/react';


export default function ImplementationIndex({ implementations = [] }) {

const [sidebarOpen, setSidebarOpen] = useState(true);
const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow space-y-6">
          <h2 className="text-2xl font-semibold">Implementation Checklists</h2>

          {implementations.length === 0 ? (
            <p>No implementations found.</p>
          ) : (
            <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">Project Title</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {implementations.map((impl) => (
                  <tr key={impl.implement_id} className="border-t">
                    <td className="p-3">{impl.project?.project_title ?? 'No Title'}</td>
                    <td className="p-3">{impl.project?.company?.company_name ?? 'N/A'}</td>
                    <td className="p-3">
                      <a
                        href={`/implementation/checklist/${impl.implement_id}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        View Checklist
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
