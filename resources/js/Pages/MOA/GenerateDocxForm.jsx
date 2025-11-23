import { useForm, router, Head } from '@inertiajs/react';
import {
  FileText,
  Building2,
  FolderOpen,
  Users,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function GenerateDocxForm({ companies, selectedCompany, projects, filters }) {
  const { data, setData, post, reset, errors, processing } = useForm({
    company_id: filters?.company_id || '',
    project_id: '',
    owner_name: '',
    owner_position: '',
    witness: '', 
  });

  const handleSelectCompany = (company_id) => {
    router.get(route('docx.form', { company_id }), {}, {
      preserveState: true,
      preserveScroll: true,
      only: ['selectedCompany', 'projects', 'filters']
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('moa.generateDocx'), {
      onSuccess: () => {
        reset();
      }
    });
  };

  const isFormValid = data.company_id && data.project_id && data.witness.trim();

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 border-b border-gray-100">
            <div className="flex items-start md:items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Generate Draft MOA</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Create Memorandum of Agreement documents for your projects</p>
              </div>
            </div>
          </div>

          <div onSubmit={handleSubmit}>
            <div className="p-4 md:p-8 space-y-4 md:space-y-8">
              {/* Company Selection */}
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-700">
                  <Building2 className="w-3 h-3 md:w-4 md:h-4 text-blue-600 flex-shrink-0" />
                  Company Selection
                </div>
                
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Select Company <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={data.company_id}
                    onChange={(e) => {
                      setData('company_id', e.target.value);
                      handleSelectCompany(e.target.value);
                    }}
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="">Choose a company...</option>
                    {companies.map((c) => (
                      <option key={c.company_id} value={c.company_id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                  {errors.company_id && (
                    <div className="text-red-500 text-xs md:text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      {errors.company_id}
                    </div>
                  )}
                </div>

                {selectedCompany && (
                  <div className="p-2 md:p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-green-700">
                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      <span className="font-medium truncate">{selectedCompany.company_name}</span>
                    </div>
                    {selectedCompany.owner_name && (
                      <p className="text-xs text-green-600 mt-1 truncate">Owner: {selectedCompany.owner_name}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Project Selection */}
              {data.company_id && (
                <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-700">
                    <FolderOpen className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
                    Project Selection
                  </div>

                  {projects.length > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                          Select Project <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={data.project_id}
                          onChange={(e) => setData('project_id', e.target.value)}
                          className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                        >
                          <option value="">Choose a project...</option>
                          {projects.map((p) => (
                            <option key={p.project_id} value={p.project_id}>
                              {p.project_title}
                            </option>
                          ))}
                        </select>
                        {errors.project_id && (
                          <div className="text-red-500 text-xs md:text-sm mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            {errors.project_id}
                          </div>
                        )}
                      </div>

                      {data.project_id && (
                        <div className="p-2 md:p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 text-xs md:text-sm text-green-700">
                            <CheckCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="font-medium truncate">
                              {projects.find(p => p.project_id == data.project_id)?.project_title}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 md:py-6 bg-gray-50 rounded-lg">
                      <FolderOpen className="w-6 h-6 md:w-8 md:h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs md:text-sm text-gray-500">No projects found for this company.</p>
                    </div>
                  )}
                </div>
              )}

              {/* MOA Details */}
              {projects.length > 0 && (
                <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-700">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-orange-600 flex-shrink-0" />
                    MOA Participants
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {/* Witness Name */}
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                        Witness Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={data.witness}
                        onChange={(e) => setData('witness', e.target.value)}
                        placeholder="Enter witness name"
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                        required
                      />
                      {errors.witness && (
                        <div className="text-red-500 text-xs md:text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                          {errors.witness}
                        </div>
                      )}
                    </div>

                    {/* Representative Name */}
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                        Representative's Name <span className="text-gray-400 text-xs">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={data.owner_name}
                        onChange={(e) => setData('owner_name', e.target.value)}
                        placeholder={`Leave blank to use ${selectedCompany?.owner_name || 'company owner name'}`}
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                      />
                    </div>

                    {/* Position */}
                    <div className="md:col-span-2">
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                        Position <span className="text-gray-400 text-xs">(optional, defaults to "Owner")</span>
                      </label>
                      <input
                        type="text"
                        value={data.owner_position}
                        onChange={(e) => setData('owner_position', e.target.value)}
                        placeholder="Enter position or leave blank to default as Owner"
                        className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Generate Button */}
            {projects.length > 0 && (
              <div className="bg-gradient-to-r from-gray-50/50 to-white px-4 md:px-8 py-4 md:py-6 border-t border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                  <div className="flex items-center gap-2 text-xs md:text-sm">
                    {isFormValid ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                        <span className="font-medium">Ready to generate</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                        <span className="font-medium">Missing required fields</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={processing || !isFormValid}
                    className={`inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-medium text-sm md:text-base transition-all duration-200 flex-shrink-0 ${
                      processing || !isFormValid
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                        <span className="hidden sm:inline">Generating...</span>
                        <span className="sm:hidden">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Generate MOA</span>
                        <span className="sm:hidden">Generate</span>
                      </>
                    )}
                  </button>
                </div>

                {processing && (
                  <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse flex-shrink-0"></div>
                      <span>Processing your request...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}