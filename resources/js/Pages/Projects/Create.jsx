// pages/Projects/Create.jsx
import { useForm, Link, Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Check, Loader2 } from 'lucide-react';

import BasicInfoSection from './components/sections/BasicInfoSection';
import TimelineSection from './components/sections/TimelineSection';
import FinancialSection from './components/sections/FinancialSection';
import WorkforceSection from './components/sections/WorkforceSection';
import ItemsSection from './components/sections/ItemsSection';
import ObjectivesSection from './components/sections/ObjectivesSection';

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
    female: '',
    male: '',
    direct_male: '',
    direct_female: '',
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
          <BasicInfoSection 
            data={data} 
            setData={setData} 
            errors={errors} 
            companies={companies}
            isCreate={true}
          />

          <TimelineSection 
            data={data} 
            setData={setData} 
            errors={errors}
          />

          <FinancialSection 
            data={data} 
            setData={setData} 
            errors={errors}
          />

          <WorkforceSection 
            data={data} 
            setData={setData} 
            errors={errors}
          />

          <ItemsSection 
            data={data} 
            setData={setData} 
            errors={errors}
          />

          <ObjectivesSection 
            data={data} 
            setData={setData} 
            errors={errors}
          />

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