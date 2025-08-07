import { useForm, Link , Head} from '@inertiajs/react'; // ✅ import Link here
import logo from '../../assets/logo.png';

export default function LoginPage() {
  const { data, setData, post, processing, errors } = useForm({
    username: '',
    password: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    post('/signin', {
      onError: (errors) => {
        console.error(errors.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src={logo} alt="Logo" className="w-10 h-10" />
          <div className="flex flex-col">
            <Head title="Login"/>
            <h2 className="text-2xl font-bold text-gray-800">SETUP</h2>
            <h3 className="text-sm text-gray-500 font-medium">
              Small Enterprise Technology Upgrading Program
            </h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.message && (
            <p className="text-red-500 text-sm">{errors.message}</p>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={data.username}
              onChange={(e) => setData('username', e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg"
              required
            />
            {errors.username && (
              <p className="text-red-500 text-sm">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg"
              required
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {processing ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* ✅ Sign Up Link */}
        <p className="text-sm text-center text-gray-600 mt-4">
          Don’t have an account?{' '}
          <Link
            href="/register"
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
