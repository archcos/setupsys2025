import { useForm, router, Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import {
  FileText,
  Building2,
  FolderOpen,
  User,
  Users,
  Briefcase,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  X
} from 'lucide-react';

export default function GenerateDocxForm({ companies }) {
  const [projects, setProjects] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingProjects, setFetchingProjects] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const { data, setData, reset, errors } = useForm({
    company_id: '',
    project_id: '',
    owner_name: '',
    owner_position: '',
    witness: '', 
  });

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const companyIdFromURL = queryParams.get('company_id');

    if (companyIdFromURL) {
      handleSelectCompany(companyIdFromURL);
    }
  }, []);

  const handleSelectCompany = async (company_id) => {
    setData('company_id', company_id);
    setFetchingProjects(true);
    
    try {
      const res = await fetch(`/moa/company/${company_id}/details`);
      const json = await res.json();
      setSelectedCompany(json.company);
      setProjects(json.projects);
    } catch (err) {
      console.error('Error fetching company details:', err);
    } finally {
      setFetchingProjects(false);
    }
  };

  const handleSubmit = () => {
    setLoading(true);
    router.post(route('moa.generateDocx'), data, {
      onSuccess: () => {
        setLoading(false);
        reset();
        setSelectedCompany(null);
        setProjects([]);
      },
      onError: () => setLoading(false),
    });
  };

  const isFormValid = data.company_id && data.project_id && data.witness.trim();

  return (
    
        
        <main className="flex-1 p-6 overflow-y-auto">
                  <Head title="Draft MOA" />

          <div className="max-w-4xl mx-auto">
            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Generate Draft MOA</h2>
                    <p className="text-sm text-gray-600 mt-1">Create Memorandum of Agreement documents for your projects</p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8 space-y-8">
                {/* Company Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Company Selection
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Company <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={data.company_id}
                      onChange={(e) => handleSelectCompany(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                    >
                      <option value="">Choose a company...</option>
                      {companies.map((c) => (
                        <option key={c.company_id} value={c.company_id}>
                          {c.company_name}
                        </option>
                      ))}
                    </select>
                    {errors.company_id && (
                      <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.company_id}
                      </div>
                    )}
                  </div>

                  {selectedCompany && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">{selectedCompany.company_name}</span>
                      </div>
                      {selectedCompany.owner_name && (
                        <p className="text-xs text-green-600 mt-1">Owner: {selectedCompany.owner_name}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Project Selection */}
                {data.company_id && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FolderOpen className="w-4 h-4 text-green-600" />
                      Project Selection
                    </div>

                    {fetchingProjects ? (
                      <div className="text-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Loading projects...</p>
                      </div>
                    ) : projects.length > 0 ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Project <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={data.project_id}
                            onChange={(e) => setData('project_id', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                          >
                            <option value="">Choose a project...</option>
                            {projects.map((p) => (
                              <option key={p.project_id} value={p.project_id}>
                                {p.project_title}
                              </option>
                            ))}
                          </select>
                          {errors.project_id && (
                            <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.project_id}
                            </div>
                          )}
                        </div>

                        {data.project_id && (
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 text-sm text-green-700">
                              <CheckCircle className="w-4 h-4" />
                              <span className="font-medium">
                                {projects.find(p => p.project_id == data.project_id)?.project_title}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <FolderOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No projects found for this company.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* MOA Details */}
                {projects.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Users className="w-4 h-4 text-orange-600" />
                      MOA Participants
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Witness Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={data.witness}
                          onChange={(e) => setData('witness', e.target.value)}
                          placeholder="Enter witness name"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                          required
                        />
                        {errors.witness && (
                          <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.witness}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Representative's Name <span className="text-gray-400 text-xs">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={data.owner_name}
                          onChange={(e) => setData('owner_name', e.target.value)}
                          placeholder={`Leave blank to use ${selectedCompany?.owner_name || 'company owner name'}`}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Position <span className="text-gray-400 text-xs">(optional, defaults to "Owner")</span>
                        </label>
                        <input
                          type="text"
                          value={data.owner_position}
                          onChange={(e) => setData('owner_position', e.target.value)}
                          placeholder="Enter position or leave blank to default as Owner"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with Generate Button */}
              {projects.length > 0 && (
                <div className="bg-gradient-to-r from-gray-50/50 to-white px-8 py-6 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      {isFormValid ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">Ready to generate</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">Missing required fields</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !isFormValid}
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                        loading || !isFormValid
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Generate MOA
                        </>
                      )}
                    </button>
                  </div>

                  {loading && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        Processing your request...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

  );
}