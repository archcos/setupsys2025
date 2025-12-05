import { useForm, Link, Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Info, Calendar, BarChart3, Package, Target, Check, Loader2, Trash2, AlertCircle, Hash } from 'lucide-react';

export default function Create({ companies, nextProjectCode }) {

  const { data, setData, post, processing, errors } = useForm({
    project_id: nextProjectCode || '',
    project_title: '',
    company_id: '',
    release_initial: '',
    release_end: '',
    refund_initial: '',
    refund_end: '',
    project_cost: '',
    refund_amount: '',
    last_refund: '',
    progress: 'Project Created',
    year_obligated: new Date().getFullYear().toString(),
    revenue: '',
    net_income: '',
    current_asset: '',
    noncurrent_asset: '',
    equity: '',
    liability: '',
    items: [{ item_name: '', specifications: '', item_cost: '', quantity: 1, type: 'equipment' }],
    objectives: [{ details: '' }],
    place_name: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      post('/projects', { 
        preserveScroll: true, 
        data,
        onFinish: () => setIsSubmitting(false)
      });
    }, 1000);
  };

  // Auto-fill release/refund end dates
  useEffect(() => {
    if (data.release_initial) {
      const [year, month] = data.release_initial.split('-').map(Number);
      const nextYear = year + 1;
      const newMonth = month + 1;
      const newEnd = `${nextYear}-${month.toString().padStart(2, '0')}`;
      const newRef = `${nextYear}-${newMonth.toString().padStart(2, '0')}`;
      const endRef = `${nextYear+3}-${newMonth.toString().padStart(2, '0')}`;

      if (!data.release_end || data.release_end <= data.release_initial) {
        setData('release_end', newEnd);
      }
      if (!data.refund_initial || data.refund_initial <= data.release_initial) {
        setData('refund_initial', newRef);
      }
      if (!data.refund_end || data.refund_end <= data.release_initial) {
        setData('refund_end', endRef);
      }
    }
  }, [data.release_initial]);

  // Add/Remove handlers for Items & Objectives
  const addItem = () => {
    setData('items', [...data.items, { item_name: '', specifications: '', item_cost: '', quantity: 1, type: 'equipment' }]);
  };
  const removeItem = (index) => {
    setData('items', data.items.filter((_, i) => i !== index));
  };

  const addObjective = () => {
    setData('objectives', [...data.objectives, { details: '' }]);
  };
  const removeObjective = (index) => {
    setData('objectives', data.objectives.filter((_, i) => i !== index));
  };

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto min-h-screen">
      <Head title="Create Project" />

      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-4 md:mb-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-3 md:mb-4 group"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" />
            Back to Projects
          </Link>
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg md:rounded-xl shadow-lg">
              <Plus className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">Create New Project</h1>
              <p className="text-xs md:text-base text-gray-600 mt-1">Fill in the details to create a comprehensive project</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
          {/* Basic Information Card */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <h2 className="text-base md:text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Project Title
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    ({data.project_title.length}/255)
                  </span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="Enter project title"
                  value={data.project_title}
                  onChange={(e) => setData('project_title', e.target.value)}
                  maxLength={255}
                  required
                />
                {errors.project_title && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.project_title}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Project Code
                  <span className="ml-2 text-xs text-gray-500 font-normal">(Auto-generated)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl bg-gray-100 text-gray-700 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={data.project_id}
                    readOnly
                    title="Format: YYYYMM## (Year-Month-Increment)"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Format: YYYYMM## (e.g., 20250142)</p>
                {errors.project_id && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.project_id}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Select Company</label>
                <select
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
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
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.company_id}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {/* Project Cost */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Project Cost</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">₱</span>
                    </div>
                    <input
                      type="number"
                      className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                      placeholder="0.00"
                      value={data.project_cost}
                      onChange={(e) => setData('project_cost', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Monthly Refund Amount */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Monthly Refund Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">₱</span>
                    </div>
                    <input
                      type="number"
                      className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                      placeholder="0.00"
                      value={data.refund_amount}
                      onChange={(e) => setData('refund_amount', e.target.value)}
                    />
                  </div>
                </div>

                {/* Last Refund Amount */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Last Refund Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">₱</span>
                    </div>
                    <input
                      type="number"
                      className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                      placeholder="0.00"
                      value={data.last_refund}
                      onChange={(e) => setData('last_refund', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Current Business Location
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    ({data.place_name.length}/100)
                  </span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="e.g., Carmen, Cagayan de Oro City"
                  value={data.place_name}
                  onChange={(e) => setData('place_name', e.target.value)}
                  maxLength={100} 
                  required
                />
                {errors.place_name && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.place_name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-green-100 rounded-lg">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <h2 className="text-base md:text-xl font-semibold text-gray-900">Timeline & Dates</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Initial Project Fund Release</label>
                <input
                  type="month"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  value={data.release_initial}
                  onChange={(e) => setData('release_initial', e.target.value)}
                />
                {errors.release_initial && (
                  <div className="text-red-500 text-xs mt-1">{errors.release_initial}</div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">End of Fund Release</label>
                <input
                  type="month"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  value={data.release_end}
                  onChange={(e) => setData('release_end', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Initial Refund</label>
                <input
                  type="month"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  value={data.refund_initial}
                  onChange={(e) => setData('refund_initial', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">End of Refund</label>
                <input
                  type="month"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  value={data.refund_end}
                  onChange={(e) => setData('refund_end', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Financial Information Card */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <h2 className="text-base md:text-xl font-semibold text-gray-900">Financial Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Year Obligated</label>
                <input
                  type="text"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  value={data.year_obligated}
                  onChange={(e) => setData('year_obligated', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Revenue</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    placeholder="0.00"
                    value={data.revenue}
                    onChange={(e) => setData('revenue', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Net Income</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    placeholder="0.00"
                    value={data.net_income}
                    onChange={(e) => setData('net_income', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Current Asset</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    placeholder="0.00"
                    value={data.current_asset}
                    onChange={(e) => setData('current_asset', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Non-Current Asset</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    placeholder="0.00"
                    value={data.noncurrent_asset}
                    onChange={(e) => setData('noncurrent_asset', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Equity</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    placeholder="0.00"
                    value={data.equity}
                    onChange={(e) => setData('equity', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Liability</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                    placeholder="0.00"
                    value={data.liability}
                    onChange={(e) => setData('liability', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-orange-100 rounded-lg">
                  <Package className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                </div>
                <h2 className="text-base md:text-xl font-semibold text-gray-900">Project Items</h2>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs md:text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-4 md:space-y-6">
              {data.items.map((item, index) => (
                <div key={index} className="p-4 md:p-6 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg md:rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h3 className="text-sm md:text-base font-medium text-gray-900">Item #{index + 1}</h3>
                    {data.items.length > 1 && (
                      <button
                        type="button"
                        className="p-1.5 md:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:gap-4">
                    <div className="grid grid-cols-12 gap-2 md:gap-4">
                      <div className="col-span-12 md:col-span-6">
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                          Item Name
                          <span className="text-xs text-gray-500 font-normal ml-2">
                            ({item.item_name.length}/100)
                          </span>
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Enter item name"
                          value={item.item_name}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[index].item_name = e.target.value;
                            setData('items', newItems);
                          }}
                          maxLength={100}
                          required
                        />
                        {errors[`items.${index}.item_name`] && (
                          <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            {errors[`items.${index}.item_name`]}
                          </div>
                        )}
                      </div>

                      <div className="col-span-6 md:col-span-3">
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Cost</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">₱</span>
                          </div>
                          <input
                            type="number"
                            className="w-full pl-7 md:pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="0.00"
                            value={item.item_cost}
                            onChange={(e) => {
                              const newItems = [...data.items];
                              newItems[index].item_cost = e.target.value;
                              setData('items', newItems);
                            }}
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        {errors[`items.${index}.item_cost`] && (
                          <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            {errors[`items.${index}.item_cost`]}
                          </div>
                        )}
                      </div>

                      <div className="col-span-3 md:col-span-1">
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Qty</label>
                        <input
                          type="number"
                          className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-sm"
                          placeholder="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[index].quantity = e.target.value;
                            setData('items', newItems);
                          }}
                          min="1"
                          required
                        />
                        {errors[`items.${index}.quantity`] && (
                          <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            {errors[`items.${index}.quantity`]}
                          </div>
                        )}
                      </div>

                      <div className="col-span-3 md:col-span-2">
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select
                          className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                          value={item.type}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[index].type = e.target.value;
                            setData('items', newItems);
                          }}
                          required
                        >
                          <option value="equipment">Equipment</option>
                          <option value="nonequip">Non-Equipment</option>
                        </select>
                        {errors[`items.${index}.type`] && (
                          <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            {errors[`items.${index}.type`]}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                        Specifications
                        <span className="text-xs text-gray-500 font-normal ml-2">
                          ({item.specifications.length}/255)
                        </span>
                      </label>
                      <textarea
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-sm"
                        placeholder="Enter detailed specifications..."
                        value={item.specifications}
                        onChange={(e) => {
                          const newItems = [...data.items];
                          newItems[index].specifications = e.target.value;
                          setData('items', newItems);
                        }}
                        maxLength={255}
                        required
                      />
                      {errors[`items.${index}.specifications`] && (
                        <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          {errors[`items.${index}.specifications`]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Objectives Section */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-indigo-100 rounded-lg">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                </div>
                <h2 className="text-base md:text-xl font-semibold text-gray-900">Project Objectives</h2>
              </div>
              <button
                type="button"
                onClick={addObjective}
                className="inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs md:text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                Add Objective
              </button>
            </div>

            <div className="space-y-3 md:space-y-4">
              {data.objectives.map((objective, index) => (
                <div key={index} className="flex gap-3 md:gap-4 p-3 md:p-4 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-lg md:rounded-xl border border-gray-200">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-indigo-600">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs text-gray-500 mb-1">
                      ({objective.details.length}/255)
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Describe the project objective..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none text-sm"
                      value={objective.details}
                      onChange={(e) => {
                        const newObjectives = [...data.objectives];
                        newObjectives[index].details = e.target.value;
                        setData('objectives', newObjectives);
                      }}
                      maxLength={255}
                      required
                    />
                    {errors[`objectives.${index}.details`] && (
                      <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errors[`objectives.${index}.details`]}
                      </div>
                    )}
                  </div>
                  {data.objectives.length > 1 && (
                    <button
                      type="button"
                      className="flex-shrink-0 p-1.5 md:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200 self-start"
                      onClick={() => removeObjective(index)}
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Ready to Create Project?</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Review all information before submitting</p>
              </div>
              <div className="flex flex-col-reverse md:flex-row gap-2 md:gap-4">
                <Link
                  href="/projects"
                  className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 font-medium rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors duration-200 text-sm text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={processing || isSubmitting}
                  className={`px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl font-medium transition-all duration-200 text-sm ${
                    processing || isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {processing || isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Project...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Create Project</span>
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