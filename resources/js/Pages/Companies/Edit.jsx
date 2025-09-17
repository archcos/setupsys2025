import { useState, useEffect } from 'react';
import { useForm, Link, Head } from '@inertiajs/react';
import {
  Building2,
  MapPin,
  User,
  ChevronLeft,
  Save,
  Loader2,
  AlertCircle,
  Users,
  Mail,
  Phone,
  MapPinIcon,
  Factory,
  Edit3,
  Check,
} from 'lucide-react';

export default function Edit({ company }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [provinceCode, setProvinceCode] = useState('');
  const [municipalityCode, setMunicipalityCode] = useState('');
  const [barangays, setBarangays] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);

  const allowedProvinces = [
    'Camiguin',
    'Bukidnon',
    'Lanao Del Norte',
    'Misamis Oriental',
    'Misamis Occidental',
  ];

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
    female: company.female || 0,
    male: company.male || 0,
    direct_male: company.direct_male || 0,
    direct_female: company.direct_female || 0,
    contact_number: company.contact_number || '',
  });

  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/provinces/')
      .then((res) => res.json())
      .then((allProvinces) => {
        const filtered = allProvinces.filter((province) =>
          allowedProvinces.includes(province.name)
        );
        setProvinces(filtered);
        const selected = filtered.find(p => p.name === company.province);
        if (selected) setProvinceCode(selected.code);
      });
  }, []);

  useEffect(() => {
    if (provinceCode) {
      fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`)
        .then((res) => res.json())
        .then((municipalities) => {
          setMunicipalities(municipalities);
          const selected = municipalities.find(m => m.name === company.municipality);
          if (selected) setMunicipalityCode(selected.code);
        });
    }
  }, [provinceCode]);

  useEffect(() => {
    if (municipalityCode) {
      fetch(`https://psgc.gitlab.io/api/cities-municipalities/${municipalityCode}/barangays/`)
        .then((res) => res.json())
        .then(setBarangays);
    }
  }, [municipalityCode]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleSubmit = (e) => {
    e.preventDefault();
    put(`/companies/${company.company_id}`);
  };

  return (
        <main className="flex-1 p-6 overflow-y-auto">
                  <Head title="Edit Company" />
          <div className="max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <Link
                href="/companies"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-4 group"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Back to Companies
              </Link>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Edit Company</h1>
                  <p className="text-gray-600 mt-1">Update company information and details</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Company Information Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter company name"
                      value={data.company_name}
                      onChange={(e) => setData('company_name', e.target.value)}
                      required
                    />
                    {errors.company_name && (
                      <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.company_name}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Products/Services</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Describe your main products or services"
                      value={data.products}
                      onChange={(e) => setData('products', e.target.value)}
                      required
                    />
                    {errors.products && (
                      <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.products}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SETUP Industry Sector</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      value={data.setup_industry}
                      onChange={(e) => setData('setup_industry', e.target.value)}
                      required
                    >
                      <option value="">Select Sector</option>
                      <option value="Crop and animal production, hunting, and related service activities">Crop and animal production, hunting, and related service activities</option>
                      <option value="Forestry and logging">Forestry and logging</option>
                      <option value="Fishing and aquaculture">Fishing and aquaculture</option>
                      <option value="Food processing">Food processing</option>
                      <option value="Beverage manufacturing">Beverage manufacturing</option>
                      <option value="Textile manufacturing">Textile manufacturing</option>
                      <option value="Wearing apparel manufacturing">Wearing apparel manufacturing</option>
                      <option value="Leather and related products manufacturing">Leather and related products manufacturing</option>
                      <option value="Wood and products of wood and cork manufacturing">Wood and products of wood and cork manufacturing</option>
                      <option value="Paper and paper products manufacturing">Paper and paper products manufacturing</option>
                      <option value="Chemicals and chemical products manufacturing">Chemicals and chemical products manufacturing</option>
                      <option value="Basic pharmaceutical products and pharmaceutical preparations manufacturing">Basic pharmaceutical products and pharmaceutical preparations manufacturing</option>
                      <option value="Rubber and plastic products manufacturing">Rubber and plastic products manufacturing</option>
                      <option value="Non-metallic mineral products manufacturing">Non-metallic mineral products manufacturing</option>
                      <option value="Machinery and equipment, NEC (Not Elsewhere Classified)">Machinery and equipment, NEC (Not Elsewhere Classified)</option>
                      <option value="Other transport equipment manufacturing">Other transport equipment manufacturing</option>
                      <option value="Furniture manufacturing">Furniture manufacturing</option>
                      <option value="Information and Communication">Information and Communication</option>
                      <option value="Other regional priority industries approved by the Regional Development Council">Other regional priority industries approved by the Regional Development Council</option>
                    </select>
                    {errors.setup_industry && (
                      <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.setup_industry}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Enterprise Type</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      value={data.industry_type}
                      onChange={(e) => setData('industry_type', e.target.value)}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="MICRO">Micro Enterprise</option>
                      <option value="SMALL">Small Enterprise</option>
                      <option value="MEDIUM">Medium Enterprise</option>
                    </select>
                    {errors.industry_type && (
                      <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.industry_type}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Workforce Information Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Workforce Distribution</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Indirect Female</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="0"
                      value={data.female}
                      onChange={(e) => setData('female', e.target.value)}
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Indirect Male</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="0"
                      value={data.male}
                      onChange={(e) => setData('male', e.target.value)}
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Direct Female</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="0"
                      value={data.direct_female}
                      onChange={(e) => setData('direct_female', e.target.value)}
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Direct Male</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="0"
                      value={data.direct_male}
                      onChange={(e) => setData('direct_male', e.target.value)}
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location Information Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Business Location</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Building number, street name"
                      value={data.street}
                      onChange={(e) => setData('street', e.target.value)}
                      required
                    />
                    {errors.street && (
                      <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.street}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Province</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      value={provinceCode}
                      onChange={(e) => {
                        const selectedCode = e.target.value;
                        const selectedProvince = provinces.find((p) => p.code === selectedCode);
                        if (selectedProvince) {
                          setProvinceCode(selectedCode);
                          setData('province', selectedProvince.name);
                          setMunicipalities([]);
                          setMunicipalityCode('');
                          setBarangays([]);
                        }
                      }}
                      required
                    >
                      <option value="">Select Province</option>
                      {provinces.map((prov) => (
                        <option key={prov.code} value={prov.code}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Municipality/City</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white disabled:opacity-50"
                      value={municipalityCode}
                      onChange={(e) => {
                        const selectedCode = e.target.value;
                        const selectedMunicipality = municipalities.find((m) => m.code === selectedCode);
                        if (selectedMunicipality) {
                          setMunicipalityCode(selectedCode);
                          setData('municipality', selectedMunicipality.name);
                          setBarangays([]);
                        }
                      }}
                      required
                    >
                      <option value="">Select Municipality</option>
                      {municipalities.map((mun) => (
                        <option key={mun.code} value={mun.code}>
                          {mun.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Barangay</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white disabled:opacity-50"
                      value={data.barangay}
                      onChange={(e) => setData('barangay', e.target.value)}
                      required
                    >
                      <option value="">Select Barangay</option>
                      {barangays.map((brgy) => (
                        <option key={brgy.code} value={brgy.name}>
                          {brgy.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">District Code</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Example: BUK-D2"
                      value={data.district}
                      onChange={(e) => setData('district', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Owner Information Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Owner Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Juan Dela Cruz"
                      value={data.owner_name}
                      onChange={(e) => setData('owner_name', e.target.value)}
                      required
                    />
                    {errors.owner_name && (
                      <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.owner_name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      value={data.sex}
                      onChange={(e) => setData('sex', e.target.value)}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="09XXXXXXXXX"
                      value={data.contact_number}
                      onChange={(e) => setData('contact_number', e.target.value)}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="owner@company.com"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Ready to Update Company?</h3>
                    <p className="text-sm text-gray-600 mt-1">Review all changes before saving</p>
                  </div>
                  <div className="flex gap-4">
                    <Link
                      href="/companies"
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
                          : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {processing ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating Company...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          Update Company
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