import { useForm, Link, Head } from '@inertiajs/react';
import { ChevronLeft, Plus, Info, Calendar, BarChart3, Package, Target, Check, Loader2, Trash2, AlertCircle, Edit3 } from 'lucide-react';

export default function Edit({ project, companies }) {

  const formatDateToMonth = (dateStr) => (dateStr ? dateStr.slice(0, 7) : '');

  const { data, setData, put, processing, errors } = useForm({
    project_id: project.project_id,
    project_title: project.project_title || '',
    company_id: project.company_id || '',
    release_initial: formatDateToMonth(project.release_initial),
    release_end: formatDateToMonth(project.release_end),
    refund_initial: formatDateToMonth(project.refund_initial),
    refund_end: formatDateToMonth(project.refund_end),
    refund_amount: project.refund_amount || '',
    last_refund: project.last_refund || '',     
    project_cost: project.project_cost || '',
    year_obligated: project.year_obligated || '',
    revenue: project.revenue || '',
    net_income: project.net_income || '',
    current_asset: project.current_asset || '',
    noncurrent_asset: project.noncurrent_asset || '',
    equity: project.equity || '',
    liability: project.liability || '',
    place_name: project.markets?.find(m => m.type === 'existing')?.place_name || '',
    items: project.items || [],
    objectives: project.objectives || [],
  });

  const handleItemChange = (index, field, value) => {
    const updated = [...data.items];
    updated[index][field] = value;
    setData('items', updated);
  };
  const addItem = () => setData('items', [...data.items, { item_name: '', specifications: '', item_cost: '', quantity: 1, type: 'equipment', }]);
  const removeItem = (index) => setData('items', data.items.filter((_, i) => i !== index));

  const handleObjectiveChange = (index, value) => {
    const updated = [...data.objectives];
    updated[index].details = value;
    setData('objectives', updated);
  };
  const addObjective = () => setData('objectives', [...data.objectives, { details: '' }]);
  const removeObjective = (index) => setData('objectives', data.objectives.filter((_, i) => i !== index));

  const handleSubmit = (e) => {
    e.preventDefault();
    put(`/projects/${project.project_id}`);
  };

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto min-h-screen">
      <Head title="Edit Project" />

      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-3 md:mb-4 group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Projects
          </Link>
          <div className="flex items-start md:items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg md:rounded-xl shadow-lg flex-shrink-0">
              <Edit3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit Project</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">Update project details and configurations</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
          {/* Basic Information Card */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Project Title</label>
                <input
                  type="text"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter project title"
                  value={data.project_title}
                  onChange={(e) => setData('project_title', e.target.value)}
                  required
                />
                {errors.project_title && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                    {errors.project_title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Select Company</label>
                <select
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={data.company_id}
                  onChange={(e) => setData('company_id', e.target.value)}
                  required
                >
                  <option value="">Choose a company</option>
                  {companies.map((company) => (
                    <option key={company.company_id} value={company.company_id}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
                {errors.company_id && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                    {errors.company_id}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Business Location</label>
                <input
                  type="text"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="e.g., Carmen, Cagayan de Oro City"
                  value={data.place_name}
                  onChange={(e) => setData('place_name', e.target.value)}
                  maxLength={100} 
                  required
                />
                {errors.place_name && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                    {errors.place_name}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                  {/* Project Cost */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Project Cost</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-xs md:text-sm">₱</span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        className="w-full pl-8 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="0.00"
                        value={data.project_cost}
                        onChange={(e) => setData('project_cost', e.target.value)}
                        required
                      />
                    </div>
                    {errors.project_cost && (
                      <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                        {errors.project_cost}
                      </div>
                    )}
                  </div>

                  {/* Monthly Refund */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Monthly Refund</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-xs md:text-sm">₱</span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        className="w-full pl-8 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="0.00"
                        value={data.refund_amount}
                        onChange={(e) => setData('refund_amount', e.target.value)}
                      />
                    </div>
                    {errors.refund_amount && (
                      <div className="text-red-500 text-xs md:text-sm mt-1">{errors.refund_amount}</div>
                    )}
                  </div>

                  {/* Last Refund */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Last Refund</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-xs md:text-sm">₱</span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        className="w-full pl-8 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="0.00"
                        value={data.last_refund}
                        onChange={(e) => setData('last_refund', e.target.value)}
                      />
                    </div>
                    {errors.last_refund && (
                      <div className="text-red-500 text-xs md:text-sm mt-1">{errors.last_refund}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Timeline & Dates</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Initial Project Fund Release</label>
                <input
                  type="month"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={data.release_initial}
                  onChange={(e) => setData('release_initial', e.target.value)}
                />
                {errors.release_initial && (
                  <div className="text-red-500 text-xs md:text-sm mt-1">{errors.release_initial}</div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">End of Fund Release</label>
                <input
                  type="month"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={data.release_end}
                  onChange={(e) => setData('release_end', e.target.value)}
                />
                {errors.release_end && (
                  <div className="text-red-500 text-xs md:text-sm mt-1">{errors.release_end}</div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Initial Refund</label>
                <input
                  type="month"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={data.refund_initial}
                  onChange={(e) => setData('refund_initial', e.target.value)}
                />
                {errors.refund_initial && (
                  <div className="text-red-500 text-xs md:text-sm mt-1">{errors.refund_initial}</div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">End of Refund</label>
                <input
                  type="month"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={data.refund_end}
                  onChange={(e) => setData('refund_end', e.target.value)}
                />
                {errors.refund_end && (
                  <div className="text-red-500 text-xs md:text-sm mt-1">{errors.refund_end}</div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Information Card */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Financial Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Year Obligated</label>
                <input
                  type="text"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={data.year_obligated}
                  onChange={(e) => setData('year_obligated', e.target.value)}
                />
                {errors.year_obligated && (
                  <div className="text-red-500 text-xs md:text-sm mt-1">{errors.year_obligated}</div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Revenue</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xs md:text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    className="w-full pl-8 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="0.00"
                    value={data.revenue}
                    onChange={(e) => setData('revenue', e.target.value)}
                  />
                </div>
                {errors.revenue && (
                  <div className="text-red-500 text-xs md:text-sm mt-1">{errors.revenue}</div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Net Income</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xs md:text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    className="w-full pl-8 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="0.00"
                    value={data.net_income}
                    onChange={(e) => setData('net_income', e.target.value)}
                  />
                </div>
                {errors.net_income && (
                  <div className="text-red-500 text-xs md:text-sm mt-1">{errors.net_income}</div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Current Asset</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xs md:text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    className="w-full pl-8 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="0.00"
                    value={data.current_asset}
                    onChange={(e) => setData('current_asset', e.target.value)}
                  />
                </div>
                {errors.current_asset && (
                  <div className="text-red-500 text-xs md:text-sm mt-1">{errors.current_asset}</div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Non-Current Asset</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xs md:text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    className="w-full pl-8 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="0.00"
                    value={data.noncurrent_asset}
                    onChange={(e) => setData('noncurrent_asset', e.target.value)}
                  />
                </div>
                {errors.noncurrent_asset && (
                  <div className="text-red-500 text-xs md:text-sm mt-1">{errors.noncurrent_asset}</div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Equity</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xs md:text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    className="w-full pl-8 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="0.00"
                    value={data.equity}
                    onChange={(e) => setData('equity', e.target.value)}
                  />
                </div>
                {errors.equity && (
                  <div className="text-red-500 text-xs md:text-sm mt-1">{errors.equity}</div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Liability</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xs md:text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    className="w-full pl-8 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="0.00"
                    value={data.liability}
                    onChange={(e) => setData('liability', e.target.value)}
                  />
                </div>
                {errors.liability && (
                  <div className="text-red-500 text-xs md:text-sm mt-1">{errors.liability}</div>
                )}
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Package className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Project Items</h2>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs md:text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex-shrink-0"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            <div className="space-y-3 md:space-y-6">
              {data.items.map((item, index) => (
                <div key={index} className="relative p-3 md:p-4 bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 space-y-3">
                  {data.items.length > 1 && (
                    <button
                      type="button"
                      className="absolute top-2 right-2 md:top-3 md:right-3 p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 mb-2 md:mb-3 pr-8 md:pr-0">
                    {/* Item Name */}
                    <div className="md:col-span-2">
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Item Name</label>
                      <input
                        type="text"
                        className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter item name"
                        value={item.item_name}
                        onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                        required
                      />
                    </div>

                    {/* Cost */}
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Cost</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 md:pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-xs md:text-sm">₱</span>
                        </div>
                        <input
                          type="number"
                          className="w-full pl-6 md:pl-8 pr-2 md:pr-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="0.00"
                          value={item.item_cost}
                          onChange={(e) => handleItemChange(index, 'item_cost', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Qty</label>
                      <input
                        type="number"
                        className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={item.type}
                        onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                        required
                      >
                        <option value="equipment">Equipment</option>
                        <option value="nonequip">Non-Equipment</option>
                      </select>
                    </div>
                  </div>

                  {/* Specifications */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Specifications</label>
                    <textarea
                      rows="2"
                      className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Enter detailed specifications..."
                      value={item.specifications}
                      onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Objectives Section */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Project Objectives</h2>
              </div>
              <button
                type="button"
                onClick={addObjective}
                className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs md:text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex-shrink-0"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Add Objective</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            <div className="space-y-2 md:space-y-4">
              {data.objectives.map((objective, index) => (
                <div key={index} className="flex gap-2 md:gap-4 p-3 md:p-4 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-lg md:rounded-xl border border-gray-200">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-indigo-600">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <textarea
                      rows="2"
                      placeholder="Describe the project objective..."
                      className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
                      value={objective.details}
                      onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      required
                    />
                  </div>
                  {data.objectives.length > 1 && (
                    <button
                      type="button"
                      className="flex-shrink-0 p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                      onClick={() => removeObjective(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Ready to Update Project?</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Review all changes before saving</p>
              </div>
              <div className="flex gap-2 md:gap-4">
                <Link
                  href="/projects"
                  className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 font-medium text-sm md:text-base rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors duration-200 text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={processing}
                  className={`flex-1 md:flex-none px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl font-medium text-sm md:text-base transition-all duration-200 ${
                    processing
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {processing ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Updating Project...</span>
                      <span className="sm:hidden">Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Update Project</span>
                      <span className="sm:hidden">Update</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}