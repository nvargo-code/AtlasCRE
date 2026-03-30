export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <span className="text-xl font-bold tracking-wider text-navy">SHAPIRO</span>
          <span className="text-xl font-light tracking-wider text-gold">GROUP</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
          <div className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-pulse [animation-delay:150ms]" />
          <div className="w-1.5 h-1.5 bg-gold/30 rounded-full animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
