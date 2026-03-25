// components/sections/LocationSection.jsx
import { useState, useEffect } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import FormCard from '../FormCard';

const ALLOWED_PROVINCES = [
  'Camiguin',
  'Bukidnon',
  'Lanao Del Norte',
  'Misamis Oriental',
  'Misamis Occidental',
];

// Custom hook for location data management
function useLocationData(initialProvince, initialMunicipality) {
  const [provinceCode, setProvinceCode] = useState('');
  const [municipalityCode, setMunicipalityCode] = useState('');
  const [barangays, setBarangays] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);

  // Fetch provinces on mount
  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/provinces/')
      .then((res) => res.json())
      .then((allProvinces) => {
        const filtered = allProvinces.filter((province) =>
          ALLOWED_PROVINCES.includes(province.name)
        );
        setProvinces(filtered);
        const selected = filtered.find((p) => p.name === initialProvince);
        if (selected) setProvinceCode(selected.code);
      });
  }, [initialProvince]);

  // Fetch municipalities when province changes
  useEffect(() => {
    if (provinceCode) {
      fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`)
        .then((res) => res.json())
        .then((municipalitiesData) => {
          setMunicipalities(municipalitiesData);
          const selected = municipalitiesData.find((m) => m.name === initialMunicipality);
          if (selected) setMunicipalityCode(selected.code);
        });
    }
  }, [provinceCode, initialMunicipality]);

  // Fetch barangays when municipality changes
  useEffect(() => {
    if (municipalityCode) {
      fetch(`https://psgc.gitlab.io/api/cities-municipalities/${municipalityCode}/barangays/`)
        .then((res) => res.json())
        .then(setBarangays);
    }
  }, [municipalityCode]);

  return {
    provinceCode,
    setProvinceCode,
    municipalityCode,
    setMunicipalityCode,
    barangays,
    provinces,
    municipalities,
  };
}

export default function LocationSection({ data, setData, errors }) {
  const location = useLocationData(data.province, data.municipality);

  const handleProvinceChange = (e) => {
    const selectedCode = e.target.value;
    const selectedProvince = location.provinces.find((p) => p.code === selectedCode);
    if (selectedProvince) {
      location.setProvinceCode(selectedCode);
      setData('province', selectedProvince.name);
      location.setMunicipalityCode('');
      setData('municipality', '');
      setData('barangay', '');
    }
  };

  const handleMunicipalityChange = (e) => {
    const selectedCode = e.target.value;
    const selectedMunicipality = location.municipalities.find((m) => m.code === selectedCode);
    if (selectedMunicipality) {
      location.setMunicipalityCode(selectedCode);
      setData('municipality', selectedMunicipality.name);
      setData('barangay', '');
    }
  };

  return (
    <FormCard icon={MapPin} title="Business Location" iconBgColor="bg-green-100" iconColor="text-green-600">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        <div className="md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Street Address</label>
          <input
            type="text"
            maxLength="100"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            placeholder="Building number, street name"
            value={data.street}
            onChange={(e) => setData('street', e.target.value)}
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
            value={location.provinceCode}
            onChange={handleProvinceChange}
            required
          >
            <option value="">Select Province</option>
            {location.provinces.map((prov) => (
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
            value={location.municipalityCode}
            onChange={handleMunicipalityChange}
            required
            disabled={!location.provinceCode}
          >
            <option value="">Select Municipality</option>
            {location.municipalities.map((mun) => (
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
            onChange={(e) => setData('barangay', e.target.value)}
            required
            disabled={!location.municipalityCode}
          >
            <option value="">Select Barangay</option>
            {location.barangays.map((brgy) => (
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
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">District Code (Optional)</label>
          <input
            type="text"
            maxLength="30"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            placeholder="Example: BUK-D2"
            value={data.district}
            onChange={(e) => setData('district', e.target.value)}
          />
          {errors.district && (
            <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              {errors.district}
            </div>
          )}
        </div>
      </div>
    </FormCard>
  );
}