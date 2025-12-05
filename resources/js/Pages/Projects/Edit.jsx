// pages/Projects/Edit.jsx
import { useForm, Link, Head } from '@inertiajs/react';
import { Check, Loader2, Edit3, ChevronLeft } from 'lucide-react';

import BasicInfoSection from './components/sections/BasicInfoSection';
import TimelineSection from './components/sections/TimelineSection';
import FinancialSection from './components/sections/FinancialSection';
import WorkforceSection from './components/sections/WorkforceSection';
import ItemsSection from './components/sections/ItemsSection';
import ObjectivesSection from './components/sections/ObjectivesSection';

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
    female: project.female || '',
    male: project.male || '',
    direct_male: project.direct_male || '',
    direct_female: project.direct_female || '',
    place_name: project.markets?.find(m => m.type === 'existing')?.place_name || '',
    items: project.items || [],
    objectives: project.objectives || [],
  });

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
          <BasicInfoSection 
            data={data} 
            setData={setData} 
            errors={errors} 
            companies={companies}
            isCreate={false}
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