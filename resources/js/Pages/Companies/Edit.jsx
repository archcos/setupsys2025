// pages/Companies/Edit.jsx
import { useForm, Link, Head } from '@inertiajs/react';
import { Edit3, ChevronLeft, Save, Loader2 } from 'lucide-react';
import CompanyInfoSection from './components/sections/CompanyInfoSection';
import LocationSection from './components/sections/LocationSection';
import OwnerSection from './components/sections/OwnerSection';

export default function Edit({ company }) {
  const { data, setData, put, processing, errors } = useForm({
    company_name: company.company_name || '',
    owner_name: company.owner_name || '',
    email: company.email || '',
    street: company.street || '',
    barangay: company.barangay || '',
    municipality: company.municipality || '',
    province: company.province || '',
    district: company.district || '',
    sex: company.sex || '',
    products: company.products || '',
    setup_industry: company.setup_industry || '',
    industry_type: company.industry_type || '',
    contact_number: company.contact_number || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(`/companies/${company.company_id}`);
  };

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto">
      <Head title="Edit Company" />
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-4 md:mb-8">
          <Link
            href="/companies"
            className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-3 md:mb-4 group"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" />
            Back to Companies
          </Link>
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg md:rounded-xl shadow-lg">
              <Edit3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">Edit Company</h1>
              <p className="text-xs md:text-base text-gray-600 mt-1">Update company information and details</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
          <CompanyInfoSection data={data} setData={setData} errors={errors} />
          <LocationSection data={data} setData={setData} errors={errors} />
          <OwnerSection data={data} setData={setData} errors={errors} />

          {/* Submit Section */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Ready to Update Company?</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Review all changes before saving</p>
              </div>
              <div className="flex flex-col-reverse md:flex-row gap-2 md:gap-4">
                <Link
                  href="/companies"
                  className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 font-medium rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors duration-200 text-sm text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={processing}
                  className={`px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl font-medium transition-all duration-200 text-sm ${
                    processing
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {processing ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" />
                      <span>Update Company</span>
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