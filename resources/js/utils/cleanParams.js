/**
 * Strips empty, null, undefined, and default filter values from a params object
 * to keep URLs clean.
 *
 * @param {Object} params        - The raw params object
 * @param {Object} defaults      - Key/value pairs to strip if they match defaults
 * @returns {Object} cleaned params
 */
export function cleanParams(params, defaults = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([key, val]) => {
      if (val === '' || val === null || val === undefined) return false;
      if (key in defaults && (val === defaults[key] || String(val) === String(defaults[key]))) return false;
      return true;
    })
  );
}