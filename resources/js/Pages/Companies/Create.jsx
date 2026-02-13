// pages/Companies/Create.jsx
import { useState, useEffect } from 'react';
import { useForm, Link, Head, usePage } from '@inertiajs/react';
import { Building2, ChevronLeft, Check, Loader2, AlertCircle, X } from 'lucide-react';
import CompanyInfoSection from './components/sections/CompanyInfoSection';
import LocationSection from './components/sections/LocationSection';
import OwnerSection from './components/sections/OwnerSection';

export default function CompanyCreate() {
  const { errors: pageErrors } = usePage().props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayErrors, setDisplayErrors] = useState({});

  const { data, setData, post, processing, errors } = useForm({
    company_name: '',
    owner_name: '',
    email: '',
    street: '',
    barangay: '',
    municipality: '',
    province: '',
    district: '',
    sex: '',
    products: '',
    setup_industry: '',
    industry_type: '',
    contact_number: '',
    current_market: '',
  });

  // Merge errors from both sources
  useEffect(() => {
    const allErrors = { ...errors, ...pageErrors };
    setDisplayErrors(allErrors);
  }, [errors, pageErrors]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Reset previous errors
    setDisplayErrors({});
    setIsSubmitting(true);

    // Validate phone number format if provided
    if (data.contact_number && !/^09[0-9]{9}$/.test(data.contact_number)) {
      setDisplayErrors(prev => ({
        ...prev,
        contact_number: ['Phone number must be in format: 09123456789 (11 digits)']
      }));
      setIsSubmitting(false);
      return;
    }

    // Validate email format if provided
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setDisplayErrors(prev => ({
        ...prev,
        email: ['Please enter a valid email address']
      }));
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      post('/proponents', {
        preserveScroll: true,
        onError: (errors) => {
          setDisplayErrors(errors);
          setIsSubmitting(false);
        },
        onFinish: () => setIsSubmitting(false),
      });
    }, 500);
  };

  const hasErrors = Object.keys(displayErrors).length > 0;

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto">
      <Head title="Create Proponent" />
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-4 md:mb-8">
          <Link
            href="/proponents"
            className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-3 md:mb-4 group"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" />
            Back to Proponents
          </Link>
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg md:rounded-xl shadow-lg">
              <Building2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">Create New Proponent</h1>
              <p className="text-xs md:text-base text-gray-600 mt-1">Fill in the details to create a proponent profile</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {hasErrors && (
          <div className="mb-4 md:mb-8 bg-red-50 border border-red-200 rounded-lg md:rounded-xl p-4 md:p-6">
            <div className="flex gap-3 md:gap-4">
              <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-red-900 text-sm md:text-base mb-3">
                  Please fix the following errors:
                </h3>
                <ul className="space-y-2">
                  {Object.entries(displayErrors).map(([field, messages]) => (
                    <li key={field} className="text-red-800 text-xs md:text-sm">
                      <span className="font-medium capitalize">
                        {field.replace(/_/g, ' ')}:
                      </span>
                      {' '}
                      {Array.isArray(messages) ? messages[0] : messages}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
          <CompanyInfoSection data={data} setData={setData} errors={displayErrors} />
          <LocationSection data={data} setData={setData} errors={displayErrors} />
          <OwnerSection data={data} setData={setData} errors={displayErrors} />

          {/* Submit Section */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Ready to Create Proponent?</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Review all information before submitting</p>
              </div>
              <div className="flex flex-col-reverse md:flex-row gap-2 md:gap-4">
                <Link
                  href="/proponents"
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
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Create Proponent</span>
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