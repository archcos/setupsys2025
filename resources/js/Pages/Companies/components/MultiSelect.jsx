import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

export default function MultiSelect({ options, value = [], onChange, placeholder = 'Select...', grouped = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (val) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const removeOne = (val, e) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  const clearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  // Flatten all options for label lookup
  const allOptions = grouped
    ? options.flatMap((g) => g.options)
    : options;

  const getLabel = (val) => allOptions.find((o) => o.value === val)?.label ?? val;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <div
        onClick={() => setOpen(!open)}
        className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer bg-white flex items-start justify-between gap-2 focus-within:ring-2 focus-within:ring-green-500"
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {value.length === 0 ? (
            <span className="text-gray-400 py-0.5">{placeholder}</span>
          ) : (
            value.map((val) => (
              <span
                key={val}
                className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium"
              >
                {getLabel(val)}
                <button onClick={(e) => removeOne(val, e)} className="hover:text-green-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
          {value.length > 0 && (
            <button onClick={clearAll} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {grouped ? (
            options.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">
                  {group.label}
                </div>
                {group.options.map((opt) => (
                  <OptionRow key={opt.value} opt={opt} checked={value.includes(opt.value)} onToggle={toggle} />
                ))}
              </div>
            ))
          ) : (
            options.map((opt) => (
              <OptionRow key={opt.value} opt={opt} checked={value.includes(opt.value)} onToggle={toggle} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function OptionRow({ opt, checked, onToggle }) {
  return (
    <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(opt.value)}
        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
      />
      <span className="text-gray-700">{opt.label}</span>
    </label>
  );
}