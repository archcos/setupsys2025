import { useState, useEffect } from 'react';
import { useForm, Link, Head } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function CompanyCreate() {
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

  const { data, setData, post, errors } = useForm({
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
    female: '',
    male: '',
    direct_male: '',
    direct_female: '',
    contact_number: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/companies', {
      preserveScroll: true,
      data,
    });
  };


  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);



  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/provinces/')
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
      fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`)
        .then((res) => res.json())
        .then(setMunicipalities);
    }
  }, [provinceCode]);

  useEffect(() => {
    if (municipalityCode) {
      fetch(`https://psgc.gitlab.io/api/cities-municipalities/${municipalityCode}/barangays/`)
        .then((res) => res.json())
        .then(setBarangays);
    }
  }, [municipalityCode]);


  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="Create Company" />
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow p-4 max-w-4xl mx-auto">
            <div className="mb-4">
              <Link href="/companies" className="inline-block text-sm text-blue-600 hover:underline">
                ← Back to Companies
              </Link>
            </div>
            <h1 className="text-xl font-semibold mb-4 text-gray-800">Add Company</h1>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 text-sm">
                          
            {/* Company Details */}
            <div className="col-span-2">
              <h2 className="text-lg font-semibold mt-6 mb-2 text-gray-700">Company Details</h2>
            </div>
            <div className="col-span-2">
              <label className="block mb-1">Company Name</label>
              <input type="text" value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div className="col-span-2">
              <label className="block mb-1">Products</label>
              <input type="text" value={data.products} onChange={(e) => setData('products', e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label className="block mb-1">SETUP Industry Sector</label>
              <select
                className="w-full border rounded p-2"
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

            </div>
            <div>
              <label className="block mb-1">Type of Enterprise</label>
              <select value={data.industry_type} onChange={(e) => setData('industry_type', e.target.value)} className="w-full p-2 border rounded" required>
                <option value="">Select Type</option>
                <option value="MICRO">MICRO</option>
                <option value="SMALL">SMALL</option>
                <option value="MEDIUM">MEDIUM</option>
              </select>
            </div>
            <div>
              <label className="block mb-1"># Indirect of Female Workers</label>
              <input type="number" value={data.female} onChange={(e) => setData('female', e.target.value)} className="w-full p-2 border rounded" min="0" required />
            </div>
            <div>
              <label className="block mb-1"># Indirect of Male Workers</label>
              <input type="number" value={data.male} onChange={(e) => setData('male', e.target.value)} className="w-full p-2 border rounded" min="0" required />
            </div>
            <div>
              <label className="block mb-1"># of Direct Male Workers</label>
              <input type="number" value={data.direct_male} onChange={(e) => setData('direct_male', e.target.value)} className="w-full p-2 border rounded" min="0" required />
            </div>
            <div>
              <label className="block mb-1"># of Direct Female Workers</label>
              <input type="number" value={data.direct_female} onChange={(e) => setData('direct_female', e.target.value)} className="w-full p-2 border rounded" min="0" required />
            </div>

            {/* Company Location */}
            <div className="col-span-2">
              <h2 className="text-lg font-semibold mt-6 mb-2 text-gray-700">Company Location</h2>
            </div>
            <div>
              <label className="block mb-1">Street</label>
              <input type="text" value={data.street} onChange={(e) => setData('street', e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label className="block mb-1">Province</label>
              <select
                value={provinceCode}
                onChange={(e) => {
                  const selectedCode = e.target.value;
                  const selectedProvince = provinces.find((p) => p.code === selectedCode);
                  if (selectedProvince) {
                    setProvinceCode(selectedCode); // tracking for select
                    setData('province', selectedProvince.name); // saving name
                    setMunicipalities([]);
                    setMunicipalityCode(''); // reset
                    setBarangays([]);
                  }
                }}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Province</option>
                {provinces.map((prov) => (
                  <option key={prov.code} value={prov.code}>{prov.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1">Municipality</label>
              <select
                value={municipalityCode}
                onChange={(e) => {
                  const selectedCode = e.target.value;
                  const selectedMunicipality = municipalities.find((m) => m.code === selectedCode);
                  if (selectedMunicipality) {
                    setMunicipalityCode(selectedCode); // tracking for select
                    setData('municipality', selectedMunicipality.name); // saving name
                    setBarangays([]);
                  }
                }}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Municipality</option>
                {municipalities.map((mun) => (
                  <option key={mun.code} value={mun.code}>{mun.name}</option>
                ))}
              </select>
            </div>

            <div>

              <label className="block mb-1">Barangay</label>
              <select value={data.barangay} onChange={(e) => setData('barangay', e.target.value)} className="w-full p-2 border rounded" required>
                <option value="">Select Barangay</option>
                {barangays.map((brgy) => (
                  <option key={brgy.code} value={brgy.name}>{brgy.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block mb-1">District</label>
              <input type="text" value={data.district} onChange={(e) => setData('district', e.target.value)} className="w-full p-2 border rounded" placeholder='Format Sample (BUK-D2)'required />
            </div>
                          {/* Owner Personal Details */}
            <div className="col-span-2">
              <h2 className="text-lg font-semibold mt-4 mb-2 text-gray-700">Owner Personal Details</h2>
            </div>
            <div className="col-span-2">
              <label className="block mb-1">Owner Name</label>
              <input
                type="text"
                value={data.owner_name}
                onChange={(e) => setData('owner_name', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder='Please Input Full Name (ex. Juan Dela Cruz)'
                required
              />
            </div>

            <div>
              <label className="block mb-1">Sex</label>
              <select value={data.sex} onChange={(e) => setData('sex', e.target.value)} className="w-full p-2 border rounded" required>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Contact Number</label>
              <input type="number" value={data.contact_number} onChange={(e) => setData('contact_number', e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div className="col-span-2">
              <label className="block mb-1">Email</label>
              <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="w-full p-2 border rounded" />
            </div>
              <div className="col-span-2 text-right">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                  Save Company
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
