import { useForm, Link , Head} from '@inertiajs/react'; // ✅ import Link here
import logo from '../../assets/logo.png';
import setupLogo from '../../assets/SETUP_logo.png'; // ✅ Add SETUP logo

export default function LoginPage() {
  const { data, setData, post, processing, errors } = useForm({
    username: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });

      post('/signin', {
        onError: (errors) => {
          console.error(errors.message);
        }
      });
    } catch (error) {
      console.error("CSRF refresh failed:", error);
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
            method="get"
            as="button"
            preserveScroll={false}
            preserveState={false}
            onClick={() => window.location.href = '/register'} // 🔄 force full reload
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

LoginPage.layout = null;
