import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-brand-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Go home
      </Link>
    </div>
  );
}
