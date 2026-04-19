export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="relative w-96 h-96">
        {/* Gray unfilled logo */}
        <img
          src="/Intara-logo.png"
          alt="Loading"
          className="absolute inset-0 w-full h-full object-contain"
          style={{ mixBlendMode: "multiply", opacity: 0.15 }}
        />
        {/* Dark filled logo with heartbeat animation */}
        <img
          src="/Intara-logo.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-contain logo-heartbeat"
          style={{ mixBlendMode: "multiply" }}
        />
      </div>

      <style>{`
        .logo-heartbeat {
          animation: heartbeat-fill 1.4s ease-in-out infinite;
        }

        @keyframes heartbeat-fill {
          0%   { opacity: 0;    transform: scale(0.92); }
          14%  { opacity: 1;    transform: scale(1.08); }
          28%  { opacity: 0.85; transform: scale(1.0);  }
          42%  { opacity: 1;    transform: scale(1.06); }
          70%  { opacity: 0;    transform: scale(0.95); }
          100% { opacity: 0;    transform: scale(0.92); }
        }
      `}</style>
    </div>
  );
}
