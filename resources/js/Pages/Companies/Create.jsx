import { useState, useEffect } from "react";
import { useForm, Link, Head } from "@inertiajs/react";
import {
  Building2,
  MapPin,
  User,
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
  Users,
  Mail,
  Phone,
  MapPinIcon,
  Factory,
  Sparkles,
  Save,
} from "lucide-react";

export default function CompanyCreate() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [provinceCode, setProvinceCode] = useState("");
  const [municipalityCode, setMunicipalityCode] = useState("");
  const [barangays, setBarangays] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedProvinces = [
    "Camiguin",
    "Bukidnon",
    "Lanao Del Norte",
    "Misamis Oriental",
    "Misamis Occidental",
  ];

  const { data, setData, post, processing, errors } = useForm({
    company_name: "",
    owner_name: "",
    email: "",
    street: "",
    barangay: "",
    municipality: "",
    province: "",
    district: "",
    sex: "",
    products: "",
    setup_industry: "",
    industry_type: "",
    female: "",
    male: "",
    direct_male: "",
    direct_female: "",
    contact_number: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      post("/companies", { 
        preserveScroll: true, 
        data,
        onFinish: () => setIsSubmitting(false)
      });
    }, 1000);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    fetch("https://psgc.gitlab.io/api/provinces/")
      .then((res) => res.json())
      .then((allProvinces) => {
        const filtered = allProvinces.filter((province) =>
          allowedProvinces.includes(province.name)
        );
        setProvinces(filtered);
      });
  }, []);

  useEffect(() => {
    if (provinceCode) {
      fetch(
        `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`
      )
        .then((res) => res.json())
        .then(setMunicipalities);
    }
  }, [provinceCode]);

  useEffect(() => {
    if (municipalityCode) {
      fetch(
        `https://psgc.gitlab.io/api/cities-municipalities/${municipalityCode}/barangays/`
      )
        .then((res) => res.json())
        .then(setBarangays);
    }
  }, [municipalityCode]);

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto">
      <Head title="Create Company" />
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
            <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg md:rounded-xl shadow-lg">
              <Building2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">Create New Company</h1>
              <p className="text-xs md:text-base text-gray-600 mt-1">Fill in the details to create a company profile</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
          {/* Basic Company Information Card */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <h2 className="text-base md:text-xl font-semibold text-gray-900">Company Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="Enter company name"
                  value={data.company_name}
                  onChange={(e) => setData("company_name", e.target.value)}
                  required
                />
                {errors.company_name && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.company_name}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Primary Products/Services</label>
                <input
                  type="text"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="Describe your main products or services"
                  value={data.products}
                  onChange={(e) => setData("products", e.target.value)}
                  required
                />
                {errors.products && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.products}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Industry Classification</label>
                <select
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  value={data.setup_industry}
                  onChange={(e) => setData("setup_industry", e.target.value)}
                  required
                >
                  <option value="">Select Industry</option>
                  <optgroup label="Major Sectors">
                    <option value="Agriculture/Aquaculture/Forestry">Agriculture / Aquaculture</option>
                    <option value="Creative Industry">Creative Industry</option>
                    <option value="Energy and Environment">Energy and Environment</option>
                    <option value="Food Processing">Food Processing</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Gifts, Decors, Handicrafts">Gifts, Decors, Handicrafts</option>
                    <option value="Health and Wellness">Health and Wellness</option>
                    <option value="Metals and Engineering">Metals and Engineering</option>
                  </optgroup>
                </select>
                {errors.setup_industry && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.setup_industry}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Enterprise Type</label>
                <select
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  value={data.industry_type}
                  onChange={(e) => setData("industry_type", e.target.value)}
                  required
                >
                  <option value="">Select enterprise size</option>
                  <option value="MICRO">Micro Enterprise</option>
                  <option value="SMALL">Small Enterprise</option>
                  <option value="MEDIUM">Medium Enterprise</option>
                </select>
                {errors.industry_type && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.industry_type}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Workforce Information Card */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <h2 className="text-base md:text-xl font-semibold text-gray-900">Workforce Distribution</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Indirect Female</label>
                <input
                  type="number"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="0"
                  value={data.female}
                  onChange={(e) => setData("female", e.target.value)}
                  min="0"
                  required
                />
                {errors.female && (
                  <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {errors.female}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Indirect Male</label>
                <input
                  type="number"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="0"
                  value={data.male}
                  onChange={(e) => setData("male", e.target.value)}
                  min="0"
                  required
                />
                {errors.male && (
                  <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {errors.male}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Direct Female</label>
                <input
                  type="number"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="0"
                  value={data.direct_female}
                  onChange={(e) => setData("direct_female", e.target.value)}
                  min="0"
                  required
                />
                {errors.direct_female && (
                  <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {errors.direct_female}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Direct Male</label>
                <input
                  type="number"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="0"
                  value={data.direct_male}
                  onChange={(e) => setData("direct_male", e.target.value)}
                  min="0"
                  required
                />
                {errors.direct_male && (
                  <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {errors.direct_male}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location Information Card */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-green-100 rounded-lg">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <h2 className="text-base md:text-xl font-semibold text-gray-900">Business Location</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="Building number, street name"
                  value={data.street}
                  onChange={(e) => setData("street", e.target.value)}
                  required
                />
                {errors.street && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.street}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Province</label>
                <select
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  value={provinceCode}
                  onChange={(e) => {
                    const selectedCode = e.target.value;
                    const selectedProvince = provinces.find(
                      (p) => p.code === selectedCode
                    );
                    if (selectedProvince) {
                      setProvinceCode(selectedCode);
                      setData("province", selectedProvince.name);
                      setMunicipalities([]);
                      setMunicipalityCode("");
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
                {errors.province && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.province}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Municipality/City</label>
                <select
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm disabled:opacity-50"
                  value={municipalityCode}
                  onChange={(e) => {
                    const selectedCode = e.target.value;
                    const selectedMunicipality = municipalities.find(
                      (m) => m.code === selectedCode
                    );
                    if (selectedMunicipality) {
                      setMunicipalityCode(selectedCode);
                      setData("municipality", selectedMunicipality.name);
                      setBarangays([]);
                    }
                  }}
                  required
                  disabled={!provinceCode}
                >
                  <option value="">Select Municipality</option>
                  {municipalities.map((mun) => (
                    <option key={mun.code} value={mun.code}>
                      {mun.name}
                    </option>
                  ))}
                </select>
                {errors.municipality && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.municipality}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Barangay</label>
                <select
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm disabled:opacity-50"
                  value={data.barangay}
                  onChange={(e) => setData("barangay", e.target.value)}
                  required
                  disabled={!municipalityCode}
                >
                  <option value="">Select Barangay</option>
                  {barangays.map((brgy) => (
                    <option key={brgy.code} value={brgy.name}>
                      {brgy.name}
                    </option>
                  ))}
                </select>
                {errors.barangay && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.barangay}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">District Code</label>
                <input
                  type="text"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="Example: BUK-D2"
                  value={data.district}
                  onChange={(e) => setData("district", e.target.value)}
                  required
                />
                {errors.district && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.district}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Owner Information Card */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-orange-100 rounded-lg">
                <User className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
              </div>
              <h2 className="text-base md:text-xl font-semibold text-gray-900">Owner Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="Juan Dela Cruz"
                  value={data.owner_name}
                  onChange={(e) => setData("owner_name", e.target.value)}
                  required
                />
                {errors.owner_name && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.owner_name}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Gender</label>
                <select
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  value={data.sex}
                  onChange={(e) => setData("sex", e.target.value)}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.sex && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.sex}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                <input
                  type="tel"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="09XXXXXXXXX"
                  value={data.contact_number}
                  onChange={(e) => setData("contact_number", e.target.value)}
                  required
                />
                {errors.contact_number && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.contact_number}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="owner@company.com"
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                />
                {errors.email && (
                  <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    {errors.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Ready to Create Company?</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Review all information before submitting</p>
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
                      <span>Create Company</span>
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