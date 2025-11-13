import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle, ExternalLink, FileText, Calendar, User } from 'lucide-react';

export default function VerifyRestructureList({ applyRestructs, auth }) {
  const userRole = auth?.user?.role;

  return (
      
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
              <Head title="Verify Restructuring" />

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Verify Restructuring Applications
              </h1>
              <p className="text-slate-600 mt-1">Review and verify project restructuring requests</p>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200/60">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Project
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Added By
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date Submitted
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applyRestructs.length ? (
                  applyRestructs.map((item, index) => (
                    <tr key={item.apply_id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm text-slate-600">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{item.project?.project_title || '-'}</div>
                        <div className="text-xs text-slate-500">ID: {item.project_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{item.added_by?.name || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {item.created_at ? new Date(item.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {item.proponent && (
                            <a 
                              href={item.proponent} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Proponent
                            </a>
                          )}
                          {item.psto && (
                            <a 
                              href={item.psto} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              PSTO
                            </a>
                          )}
                          {item.annexc && (
                            <a 
                              href={item.annexc} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Annex C
                            </a>
                          )}
                          {item.annexd && (
                            <a 
                              href={item.annexd} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Annex D
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          {(userRole === 'rpmo' || userRole === 'rd') ? (
                            <Link
                              href={`/verify-restructure/${item.apply_id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-green-500/40"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Verify
                            </Link>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 rounded-lg">
                              RPMO/RD Only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-slate-500 font-medium">No applications found</p>
                        <p className="text-slate-400 text-sm mt-1">No restructuring applications to verify</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

  );
}