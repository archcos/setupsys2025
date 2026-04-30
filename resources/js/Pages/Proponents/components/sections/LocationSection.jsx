// components/sections/LocationSection.jsx
import { useState, useEffect, useRef } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import FormCard from '../FormCard';

const ALLOWED_PROVINCES = [
  'Camiguin',
  'Bukidnon',
  'Lanao Del Norte',
  'Misamis Oriental',
  'Misamis Occidental',
];

// Maps DB abbreviations AND full names to the PSGC API full name
const PROVINCE_NAME_MAP = {
  'BUK': 'Bukidnon',
  'CAM': 'Camiguin',
  'LDN': 'Lanao Del Norte',
  'MOC': 'Misamis Occidental',
  'MOR': 'Misamis Oriental',
  'Bukidnon': 'Bukidnon',
  'Camiguin': 'Camiguin',
  'Lanao Del Norte': 'Lanao Del Norte',
  'Misamis Occidental': 'Misamis Occidental',
  'Misamis Oriental': 'Misamis Oriental',
};

/**
 * PSGC returns "City of Iligan" but the DB stores "Iligan City".
 * This converts PSGC format → DB format for display and saving.
 */
/**
 * Converts PSGC "City of X" → "X City" for display and saving.
 * Preserves the original casing of X from the PSGC response.
 * e.g. "City of Cagayan De Oro" → "Cagayan De Oro City"
 */
function normalizeCityName(name) {
  if (!name) return name;
  const match = name.match(/^City of (.+)$/i);
  if (match) return `${match[1]} City`;
  return name;
}

/**
 * Case-insensitive comparison of two city name strings,
 * ignoring the "City of X" vs "X City" difference.
 * Strips "city of" prefix and " city" suffix then compares the core name.
 */
function sameCityName(psgcName, dbName) {
  const core = (n) =>
    n.toLowerCase()
      .replace(/^city of /i, '')
      .replace(/ city$/i, '')
      .trim();
  return core(psgcName) === core(dbName);
}

/**
 * Finds a municipality in the PSGC list by matching both name formats,
 * case-insensitively. Handles:
 *   "Cagayan de Oro City" (DB) ↔ "City of Cagayan De Oro" (PSGC)
 *   "Iligan City"         (DB) ↔ "City of Iligan"          (PSGC)
 *   "Villanueva"          (DB) ↔ "Villanueva"               (PSGC)
 */
function findMunicipality(list, dbName) {
  if (!dbName) return null;
  return list.find((m) => sameCityName(m.name, dbName));
}

function useLocationData(initialProvince, initialMunicipality) {
  const resolvedProvince = PROVINCE_NAME_MAP[initialProvince] ?? initialProvince;
  const resolvedProvinceRef = useRef(resolvedProvince);
  const initialMunicipalityRef = useRef(initialMunicipality);

  const [provinceCode, setProvinceCode] = useState('');
  const [municipalityCode, setMunicipalityCode] = useState('');
  const [barangays, setBarangays] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);

  const didAutoSelectMunicipality = useRef(false);

  // 1. Load provinces → auto-select initial
  useEffect(() => {
    setIsLoadingProvinces(true);
    fetch('https://psgc.gitlab.io/api/provinces/')
      .then((res) => res.json())
      .then((allProvinces) => {
        const filtered = allProvinces.filter((p) => ALLOWED_PROVINCES.includes(p.name));
        setProvinces(filtered);
        if (resolvedProvinceRef.current) {
          const match = filtered.find((p) => p.name === resolvedProvinceRef.current);
          if (match) setProvinceCode(match.code);
        }
      })
      .finally(() => setIsLoadingProvinces(false));
  }, []);

  // 2. Load municipalities → auto-select initial (handles "X City" vs "City of X")
  useEffect(() => {
    if (!provinceCode) return;
    setIsLoadingMunicipalities(true);
    setMunicipalities([]);
    fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`)
      .then((res) => res.json())
      .then((data) => {
        setMunicipalities(data);
        if (!didAutoSelectMunicipality.current && initialMunicipalityRef.current) {
          const match = findMunicipality(data, initialMunicipalityRef.current);
          if (match) {
            setMunicipalityCode(match.code);
            didAutoSelectMunicipality.current = true;
          }
        }
      })
      .finally(() => setIsLoadingMunicipalities(false));
  }, [provinceCode]);

  // 3. Load barangays
  useEffect(() => {
    if (!municipalityCode) return;
    setIsLoadingBarangays(true);
    setBarangays([]);
    fetch(`https://psgc.gitlab.io/api/cities-municipalities/${municipalityCode}/barangays/`)
      .then((res) => res.json())
      .then(setBarangays)
      .finally(() => setIsLoadingBarangays(false));
  }, [municipalityCode]);

  return {
    provinceCode, setProvinceCode,
    municipalityCode, setMunicipalityCode,
    barangays, provinces, municipalities,
    isLoadingProvinces, isLoadingMunicipalities, isLoadingBarangays,
  };
}

const selectClass = "w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed";
const inputClass  = "w-full px-3 md:px-4 py-2 md:py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm";

function FieldError({ message }) {
  if (!message) return null;
  return (
    <div className="text-red-500 text-xs md:text-sm mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
      {message}
    </div>
  );
}

export default function LocationSection({ data, setData, errors }) {
  const location = useLocationData(data.province, data.municipality);

  const handleProvinceChange = (e) => {
    const selectedCode = e.target.value;
    const selectedProvince = location.provinces.find((p) => p.code === selectedCode);
    if (selectedProvince) {
      location.setProvinceCode(selectedCode);
      setData('province', selectedProvince.name);
    }
    location.setMunicipalityCode('');
    setData('municipality', '');
    setData('barangay', '');
  };

  const handleMunicipalityChange = (e) => {
    const selectedCode = e.target.value;
    const selectedMunicipality = location.municipalities.find((m) => m.code === selectedCode);
    if (selectedMunicipality) {
      location.setMunicipalityCode(selectedCode);
      // Always save in "X City" format, never "City of X"
      setData('municipality', normalizeCityName(selectedMunicipality.name));
      setData('barangay', '');
    }
  };

  return (
    <FormCard icon={MapPin} title="Business Location" iconBgColor="bg-green-100" iconColor="text-green-600">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">

        {/* Street */}
        <div className="md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Street Address</label>
          <input
            type="text"
            maxLength="100"
            className={inputClass}
            placeholder="Building number, street name"
            value={data.street}
            onChange={(e) => setData('street', e.target.value)}
          />
          <FieldError message={errors.street} />
        </div>

        {/* Province */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Province</label>
          <select
            className={selectClass}
            value={location.provinceCode}
            onChange={handleProvinceChange}
            disabled={location.isLoadingProvinces}
          >
            <option value="">
              {location.isLoadingProvinces ? 'Loading provinces...' : 'Select Province'}
            </option>
            {location.provinces.map((prov) => (
              <option key={prov.code} value={prov.code}>
                {prov.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.province} />
        </div>

        {/* Municipality */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Municipality/City</label>
          <select
            className={selectClass}
            value={location.municipalityCode}
            onChange={handleMunicipalityChange}
            disabled={!location.provinceCode || location.isLoadingMunicipalities}
          >
            <option value="">
              {location.isLoadingMunicipalities ? 'Loading municipalities...' : 'Select Municipality'}
            </option>
            {location.municipalities.map((mun) => (
              <option key={mun.code} value={mun.code}>
                {normalizeCityName(mun.name)}
              </option>
            ))}
          </select>
          <FieldError message={errors.municipality} />
        </div>

        {/* Barangay */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Barangay</label>
          <select
            className={selectClass}
            value={data.barangay}
            onChange={(e) => setData('barangay', e.target.value)}
            disabled={!location.municipalityCode || location.isLoadingBarangays}
          >
            <option value="">
              {location.isLoadingBarangays ? 'Loading barangays...' : 'Select Barangay'}
            </option>
            {location.barangays.map((brgy) => (
              <option key={brgy.code} value={brgy.name}>
                {brgy.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.barangay} />
        </div>

        {/* District */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">District Code (Optional)</label>
          <input
            type="text"
            maxLength="30"
            className={inputClass}
            placeholder="Example: BUK-D2"
            value={data.district}
            onChange={(e) => setData('district', e.target.value)}
          />
          <FieldError message={errors.district} />
        </div>

      </div>
    </FormCard>
  );
}