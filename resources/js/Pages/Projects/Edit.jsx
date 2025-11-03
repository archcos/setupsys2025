import { useForm, Link, Head } from '@inertiajs/react';
import { useState } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  Info, 
  Calendar, 
  BarChart3, 
  Package, 
  Target, 
  Check, 
  Loader2, 
  Trash2,
  AlertCircle,
  Edit3,
  Users,
  Clock,
  Video,
  X
} from 'lucide-react';

export default function Edit({ project, companies, auth, irtecUsers = [], ertecUsers = [] }) {
  const formatDateToMonth = (dateStr) => (dateStr ? dateStr.slice(0, 7) : '');

  // Helper function to parse schedule to datetime-local format
  const parseScheduleToDatetimeLocal = (schedule) => {
    if (!schedule) return '';
    
    try {
      // Handle both ISO and SQL datetime formats
      const date = new Date(schedule);
      if (isNaN(date.getTime())) return '';
      
      // Convert to datetime-local format: "YYYY-MM-DDTHH:MM"
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

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
    progress: project.progress || '',
    // Populate RTEC data from existing records
    rtec_user_ids: project.rtecs?.map(r => r.user_id) || [],
    rtec_schedule: parseScheduleToDatetimeLocal(project.rtecs?.[0]?.schedule),
    rtec_zoom_link: project.rtecs?.[0]?.zoom_link || '',
  });

  const handleItemChange = (index, field, value) => {
    const updated = [...data.items];
    updated[index][field] = value;
    setData('items', updated);
  };
  
  const addItem = () => setData('items', [...data.items, { item_name: '', specifications: '', item_cost: '', quantity: 1, type: 'equipment' }]);
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

  const getAvailableUsers = () => {
    if (['internal_rtec', 'internal_compliance'].includes(data.progress)) {
      return irtecUsers || [];
    } else if (['external_rtec', 'external_compliance', 'approval'].includes(data.progress)) {
      return ertecUsers || [];
    }
    return [];
  };

  const handleAddMember = (userId) => {
    const id = parseInt(userId);
    if (id && !data.rtec_user_ids.includes(id)) {
      setData('rtec_user_ids', [...data.rtec_user_ids, id]);
    }
  };

  const handleRemoveMember = (userId) => {
    setData('rtec_user_ids', data.rtec_user_ids.filter(id => id !== userId));
  };

  const showRtecFields = ['internal_rtec', 'internal_compliance', 'external_rtec', 'external_compliance', 'approval'].includes(data.progress);

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <Head title="Edit Project" />

      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-4 group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Projects
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <Edit3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
              <p className="text-gray-600 mt-1">Update project details and configurations</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter project title"
                  value={data.project_title}
                  onChange={(e) => setData('project_title', e.target.value)}
                  required
                />
                {errors.project_title && (
                  <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.project_title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Company</label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
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
                  <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.company_id}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Location</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="e.g., Carmen, Cagayan de Oro City"
                  value={data.place_name}
                  onChange={(e) => setData('place_name', e.target.value)}
                  maxLength={100} 
                  required
                />
                {errors.place_name && (
                  <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.place_name}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Project Cost</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₱</span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="0.00"
                        value={data.project_cost}
                        onChange={(e) => setData('project_cost', e.target.value)}
                        required
                      />
                    </div>
                    {errors.project_cost && (
                      <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.project_cost}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Refund</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₱</span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="0.00"
                        value={data.refund_amount}
                        onChange={(e) => setData('refund_amount', e.target.value)}
                      />
                    </div>
                    {errors.refund_amount && (
                      <div className="text-red-500 text-sm mt-1">{errors.refund_amount}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Refund</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₱</span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="0.00"
                        value={data.last_refund}
                        onChange={(e) => setData('last_refund', e.target.value)}
                      />
                    </div>
                    {errors.last_refund && (
                      <div className="text-red-500 text-sm mt-1">{errors.last_refund}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Timeline & Dates</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Project Fund Release</label>
                <input
                  type="month"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={data.release_initial}
                  onChange={(e) => setData('release_initial', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End of Fund Release</label>
                <input
                  type="month"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={data.release_end}
                  onChange={(e) => setData('release_end', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Refund</label>
                <input
                  type="month"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={data.refund_initial}
                  onChange={(e) => setData('refund_initial', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End of Refund</label>
                <input
                  type="month"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={data.refund_end}
                  onChange={(e) => setData('refund_end', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Financial Information Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Financial Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year Obligated</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={data.year_obligated}
                  onChange={(e) => setData('year_obligated', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Revenue</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="0.00"
                    value={data.revenue}
                    onChange={(e) => setData('revenue', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Net Income</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="0.00"
                    value={data.net_income}
                    onChange={(e) => setData('net_income', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Asset</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="0.00"
                    value={data.current_asset}
                    onChange={(e) => setData('current_asset', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Non-Current Asset</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="0.00"
                    value={data.noncurrent_asset}
                    onChange={(e) => setData('noncurrent_asset', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Equity</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="0.00"
                    value={data.equity}
                    onChange={(e) => setData('equity', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Liability</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="0.00"
                    value={data.liability}
                    onChange={(e) => setData('liability', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Project Items</h2>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-6">
              {data.items.map((item, index) => (
                <div key={index} className="relative p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  {data.items.length > 1 && (
                    <button
                      type="button"
                      className="absolute top-3 right-3 p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter item name"
                        value={item.item_name}
                        onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cost</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">₱</span>
                        </div>
                        <input
                          type="number"
                          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="0.00"
                          value={item.item_cost}
                          onChange={(e) => handleItemChange(index, 'item_cost', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Qty</label>
                      <input
                        type="number"
                        className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={item.type}
                        onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                        required
                      >
                        <option value="equipment">Equipment</option>
                        <option value="nonequip">Non-Equipment</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Enter detailed specifications..."
                      value={item.specifications || ''}
                      onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Objectives Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Target className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Project Objectives</h2>
              </div>
              <button
                type="button"
                onClick={addObjective}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                Add Objective
              </button>
            </div>

            <div className="space-y-4">
              {data.objectives.map((objective, index) => (
                <div key={index} className="flex gap-4 p-4 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-xl border border-gray-200">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-indigo-600">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <textarea
                      rows="2"
                      placeholder="Describe the project objective..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
                      value={objective.details || ''}
                      onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      required
                    />
                  </div>
                  {data.objectives.length > 1 && (
                    <button
                      type="button"
                      className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                      onClick={() => removeObjective(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RPMO Status & RTEC Management Section */}
          {auth?.user?.role === 'rpmo' && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Users className="w-5 h-5 text-pink-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Project Status & RTEC Management</h2>
              </div>

              <div className="space-y-6">
                {/* Status Dropdown */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Project Status</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={data.progress}
                    onChange={(e) => {
                      setData({
                        ...data,
                        progress: e.target.value,
                        rtec_user_ids: [],
                        rtec_schedule: '',
                        rtec_zoom_link: ''
                      });
                    }}
                  >
                    <option value="">Select Status</option>
                    <option value="internal_rtec">Internal RTEC</option>
                    <option value="internal_compliance">Internal Compliance</option>
                    <option value="external_rtec">External RTEC</option>
                    <option value="external_compliance">External Compliance</option>
                    <option value="approval">Approval</option>
                    <option value="Implementation">Implementation</option>
                    <option value="Refund">Refund</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Withdrawn">Withdrawn</option>
                    <option value="Completed">Completed</option>
                  </select>
                  {errors.progress && (
                    <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.progress}
                    </div>
                  )}
                </div>

                {/* RTEC Fields - Only show for specific statuses */}
                {showRtecFields && (
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Video className="w-5 h-5 text-blue-600" />
                      RTEC Meeting Details
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Select Members - Multi-select */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Assign RTEC Members (Select One or More)
                        </label>
                        
                        {/* Selected Members Display */}
                        {data.rtec_user_ids.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-white rounded-lg border border-blue-200">
                            {data.rtec_user_ids.map((userId) => {
                              const user = getAvailableUsers().find(u => u.user_id === userId);
                              return user ? (
                                <span
                                  key={userId}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium"
                                >
                                  {user.first_name} {user.last_name}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(userId)}
                                    className="hover:bg-blue-600 rounded-full p-0.5 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                        
                        <select
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          value=""
                          onChange={(e) => handleAddMember(e.target.value)}
                        >
                          <option value="">+ Add a member</option>
                          {getAvailableUsers()
                            .filter(user => !data.rtec_user_ids.includes(user.user_id))
                            .map((user) => (
                              <option key={user.user_id} value={user.user_id}>
                                {user.first_name} {user.middle_name} {user.last_name} - {user.role.toUpperCase()}
                              </option>
                            ))}
                        </select>
                        {errors.rtec_user_ids && (
                          <div className="text-red-500 text-sm mt-1">{errors.rtec_user_ids}</div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Selected: {data.rtec_user_ids.length} member{data.rtec_user_ids.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Combined Meeting Date & Time */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Meeting Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          value={data.rtec_schedule}
                          onChange={(e) => setData('rtec_schedule', e.target.value)}
                        />
                        {errors.rtec_schedule && (
                          <div className="text-red-500 text-sm mt-1">{errors.rtec_schedule}</div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Select both date and time for the RTEC meeting
                        </p>
                      </div>

                      {/* Zoom Link */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Video className="w-4 h-4 inline mr-1" />
                          Zoom Meeting Link
                        </label>
                        <input
                          type="url"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          placeholder="https://zoom.us/j/..."
                          value={data.rtec_zoom_link}
                          onChange={(e) => setData('rtec_zoom_link', e.target.value)}
                        />
                        {errors.rtec_zoom_link && (
                          <div className="text-red-500 text-sm mt-1">{errors.rtec_zoom_link}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready to Update Project?</h3>
                <p className="text-sm text-gray-600 mt-1">Review all changes before saving</p>
              </div>
              <div className="flex gap-4">
                <Link
                  href="/projects"
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={processing}
                  className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                    processing
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {processing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating Project...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Update Project
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