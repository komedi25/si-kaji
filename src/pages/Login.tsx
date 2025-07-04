
import { AuthForm } from '@/components/auth/AuthForm';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Masuk ke Si-Kaji
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistem Informasi Kesiswaan SMKN 1 Kendal
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
