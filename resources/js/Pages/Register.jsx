import { useState } from 'react';
import logo from '../../assets/logo.png';
import { baseUrl } from '../Components/Fetch';
import { fetchWithCsrf } from '../Utils/fetchWithCsrf';

// ✅ Reusable error display component
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
    office_id: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setValidationErrors({});

    try {
      const response = await fetchWithCsrf('/registration', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setMessage('Registration successful!');
      } else if (response.status === 422) {
        setValidationErrors(data.errors || {});
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src={logo} alt="Logo" className="w-10 h-10" />
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800">SETUP</h2>
            <h3 className="text-sm text-gray-500 font-medium">
              Small Enterprise Technology Upgrading Program
            </h3>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-center mb-4">Register</h2>

        {message && <p className="text-green-600 text-sm mb-2">{message}</p>}
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
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
          </div>

          <div>
            <input
              type="text"
              name="middle_name"
              value={form.middle_name}
              onChange={handleChange}
              placeholder="Middle Name (optional)"
              className="w-full border px-4 py-2 rounded-lg"
            />
            <InputError error={validationErrors.middle_name} />
          </div>

          <div>
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
          </div>

          <div>
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
          </div>

          <div>
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
          </div>

          <div>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full border px-4 py-2 rounded-lg"
              required
            />
            <InputError error={validationErrors.password} />
          </div>

          <div>
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
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Register
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-4">
          Already have an account?
        </p>
      </div>
    </div>
  );
}
