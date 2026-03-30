import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <p className="text-gold text-[12px] font-semibold tracking-[0.25em] uppercase mb-4">
          404
        </p>
        <h1 className="text-4xl md:text-5xl font-light text-navy mb-4">
          Page Not <span className="font-semibold">Found</span>
        </h1>
        <p className="text-mid-gray mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/search" className="btn-outline-dark">
            Search Properties
          </Link>
        </div>
      </div>
    </div>
  );
}
