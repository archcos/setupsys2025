import { useForm, router, Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
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
  Eye,
  Sparkles,
  ArrowRight
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
    <div className="h-screen flex bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="Draft MOA" />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Generate Draft MOA</h1>
                  <p className="text-gray-600 mt-1">Create Memorandum of Agreement documents for your projects</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Company Selection Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Company Selection</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Company <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={data.company_id}
                      onChange={(e) => handleSelectCompany(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
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

                  {/* Company Details Preview */}
                  {selectedCompany && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Selected: {selectedCompany.company_name}</span>
                      </div>
                      {selectedCompany.owner_name && (
                        <p className="text-xs text-blue-600 mt-1">Owner: {selectedCompany.owner_name}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Project Selection Card */}
              {data.company_id && (
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FolderOpen className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Project Details</h2>
                  </div>

                  {fetchingProjects ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
                      <p className="text-gray-500">Loading projects...</p>
                    </div>
                  ) : projects.length > 0 ? (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Select Project <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={data.project_id}
                          onChange={(e) => setData('project_id', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
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

                      {/* Project Summary */}
                      {data.project_id && (
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">
                              Project selected: {projects.find(p => p.project_id == data.project_id)?.project_title}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">No projects found for this company.</p>
                    </div>
                  )}
                </div>
              )}

              {/* MOA Details Card */}
              {projects.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">MOA Participants</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Witness Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={data.witness}
                        onChange={(e) => setData('witness', e.target.value)}
                        placeholder="Enter witness name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Representative's Name
                        <span className="text-gray-400 text-xs ml-1">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={data.owner_name}
                        onChange={(e) => setData('owner_name', e.target.value)}
                        placeholder={`Leave blank to use ${selectedCompany?.owner_name || 'company owner name'}`}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Briefcase className="w-4 h-4 inline mr-1" />
                        Position
                        <span className="text-gray-400 text-xs ml-1">(optional, defaults to "Owner")</span>
                      </label>
                      <input
                        type="text"
                        value={data.owner_position}
                        onChange={(e) => setData('owner_position', e.target.value)}
                        placeholder="Enter position or leave blank to default as Owner"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Form Validation Summary */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">
                        Form Status: {isFormValid ? (
                          <span className="text-green-600">Ready to generate</span>
                        ) : (
                          <span className="text-amber-600">Missing required fields</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button Card */}
              {projects.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Generate MOA Document
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Create a professionally formatted Memorandum of Agreement
                      </p>
                    </div>
                    
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !isFormValid}
                      className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-medium transition-all duration-200 ${
                        loading || !isFormValid
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating MOA...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Generate MOA
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Progress Indicator */}
                  {loading && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        Processing your request... This may take a few moments.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}