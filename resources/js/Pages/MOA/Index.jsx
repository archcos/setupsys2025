import React, { useState, useEffect } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import {
  Search,
  FileText,
  Eye,
  Download,
  Building2,
  User,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  Clock,
  Users,
  MapPin
} from 'lucide-react';

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

  const getStatusBadge = (progress) => {
    const isImplementation = progress === 'Implementation';
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
        isImplementation 
          ? 'bg-green-100 text-green-700' 
          : 'bg-amber-100 text-amber-700'
      }`}>
        {isImplementation ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <Clock className="w-3 h-3" />
        )}
        {progress || 'Draft MOA'}
      </span>
    );
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="MOA List" />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">MOA Management</h1>
                  <p className="text-gray-600 mt-1">View and manage all Memorandums of Agreement</p>
                </div>
              </div>
            </div>

            {/* Search and Filter Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Search className="w-4 h-4 inline mr-1" />
                    Search MOAs
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by project title, company representative, witness..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <label className="text-sm font-semibold text-gray-700">Show</label>
                    <select
                      value={perPage}
                      onChange={(e) => setPerPage(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>{n} entries</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    Total: <span className="font-semibold text-gray-900">{moas.total}</span> MOAs
                  </div>
                </div>
              </div>
            </div>

            {/* MOA Cards */}
            <div className="space-y-6">
              {moas.data.map((moa) => (
                <div key={moa.moa_id} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                  <div className="p-8">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                            {moa.project?.project_title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(moa.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          {getStatusBadge(moa.project?.progress)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col lg:flex-row gap-3">
                        <a 
                          href={`/moa/${moa.moa_id}/pdf`} 
                          target="_blank"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          View PDF
                        </a>
                        <a 
                          href={`/moa/${moa.moa_id}/docx`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200 font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Download DOCX
                        </a>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Company Representative */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Building2 className="w-4 h-4 text-blue-500" />
                          Company Representative
                        </div>
                        <p className="text-gray-900 font-medium">
                          {moa.owner_name || '—'}
                        </p>
                      </div>

                      {/* Witness */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Users className="w-4 h-4 text-green-500" />
                          Witness
                        </div>
                        <p className="text-gray-900 font-medium">{moa.witness}</p>
                      </div>

                      {/* Project Director */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <User className="w-4 h-4 text-purple-500" />
                          Project Director
                        </div>
                        <p className="text-gray-900 font-medium">{moa.pd_name}</p>
                        <p className="text-sm text-gray-600">{moa.pd_title}</p>
                      </div>

                      {/* Office */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          Office
                        </div>
                        <p className="text-gray-900 font-medium">
                          {moa.project?.company?.office?.office_name || '—'}
                        </p>
                      </div>

                      {/* Project Cost */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          Project Cost
                        </div>
                        <p className="text-gray-900 font-bold text-lg">
                          ₱ {parseFloat(moa.project_cost).toLocaleString()}
                        </p>
                      </div>

                      {/* Acknowledgment */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <CheckCircle className="w-4 h-4 text-teal-500" />
                          Implementation Status
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative">
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
                              className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                                isStaff 
                                  ? 'border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2 cursor-pointer' 
                                  : 'border-gray-200 cursor-not-allowed opacity-50'
                              }`}
                            />
                          </div>
                          <span className={`text-sm font-medium ${
                            moa.project?.progress === 'Implementation' ? 'text-green-700' : 'text-gray-600'
                          }`}>
                            {moa.project?.progress === 'Implementation' ? 'Acknowledged' : 'Mark as Implemented'}
                          </span>
                        </label>
                        {!isStaff && (
                          <p className="text-xs text-gray-500">Staff access required</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {moas.data.length === 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No MOAs Found</h3>
                  <p className="text-gray-600 mb-6">
                    {search ? `No MOAs match your search "${search}"` : 'No MOAs have been generated yet.'}
                  </p>
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            {moas.data.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{moas.from}</span> to{' '}
                    <span className="font-semibold text-gray-900">{moas.to}</span> of{' '}
                    <span className="font-semibold text-gray-900">{moas.total}</span> results
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {moas.links.map((link, index) => {
                      if (!link.url) {
                        return (
                          <span
                            key={index}
                            className="px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                          />
                        );
                      }
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handlePageChange(link.url)}
                          className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                            link.active
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}