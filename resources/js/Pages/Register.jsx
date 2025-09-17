import { useState } from 'react';
import { Link } from '@inertiajs/react'; 
import { Eye, EyeOff } from 'lucide-react';
import logo from '../../assets/logo.png';
import setupLogo from '../../assets/SETUP_logo.png'; // ✅ Add SETUP logo
import { fetchWithCsrf } from '../Utils/fetchWithCsrf';

const InputError = ({ error }) =>
  error ? <p className="text-red-500 text-sm mt-1">{error[0]}</p> : null;

export default function RegisterPage({ offices }) {
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    office_id: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setValidationErrors({});
    setLoading(true);

    if (form.password !== form.confirm_password) {
      setValidationErrors({ confirm_password: ['Passwords do not match'] });
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithCsrf('/registration', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Registration successful!');
      } else if (response.status === 422) {
        setValidationErrors(data.errors || {});
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <div className="flex flex-col items-center justify-center gap-3 mb-6">
          {/* Logos */}
          <div className="flex items-center justify-center gap-3">
            <img src={logo} alt="Logo" className="w-10 h-10" />
            <img src={setupLogo} alt="SetupLogo" className="h-10" />
          </div>

          {/* Text below */}
          <div className="flex flex-col items-center text-center">
            <h2 className="text-sm font-bold text-gray-800">DOST - Northern Mindanao</h2>
            <h3 className="text-sm text-gray-500 font-medium">
              Small Enterprise Technology Upgrading Program
            </h3>
          </div>
        </div>


        <h2 className="text-xl font-semibold text-center mb-4">Register</h2>

        {message && <p className="text-green-600 text-sm mb-2">{message}</p>}
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <input
            type="text"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder="First Name"
            className="w-full border px-4 py-2 rounded-lg"
            required
          />
          <InputError error={validationErrors.first_name} />

          {/* Middle Name */}
          <input
            type="text"
            name="middle_name"
            value={form.middle_name}
            onChange={handleChange}
            placeholder="Middle Name (optional)"
            className="w-full border px-4 py-2 rounded-lg"
          />
          <InputError error={validationErrors.middle_name} />

          {/* Last Name */}
          <input
            type="text"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder="Last Name"
            className="w-full border px-4 py-2 rounded-lg"
            required
          />
          <InputError error={validationErrors.last_name} />

          {/* Username */}
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Username"
            className="w-full border px-4 py-2 rounded-lg"
            required
          />
          <InputError error={validationErrors.username} />

          {/* Email */}
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full border px-4 py-2 rounded-lg"
            required
          />
          <InputError error={validationErrors.email} />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full border px-4 py-2 rounded-lg"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <InputError error={validationErrors.password} />

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="w-full border px-4 py-2 rounded-lg"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 text-gray-500"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <InputError error={validationErrors.confirm_password} />

          {/* Office */}
          <select
            name="office_id"
            value={form.office_id}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
            required
          >
            <option value="">Select Office</option>
            {offices.map((office) => (
              <option key={office.office_id} value={office.office_id}>
                {office.office_name}
              </option>
            ))}
          </select>
          <InputError error={validationErrors.office_id} />

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${
              loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } text-white py-2 rounded-lg font-semibold transition`}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-4">
          Already have an account?{' '}
          <Link
            href="/"
            className="text-blue-600 hover:underline font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

RegisterPage.layout = null;
