import Link from "next/link";

export const metadata = { title: "Bağlantı Yok — BBS CRM" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0f172a] p-6 text-center">
      <div
        style={{
          width: 72,
          height: 72,
          background: "#1e3a5f",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">İnternet Bağlantısı Yok</h1>
        <p className="max-w-xs text-slate-400">
          BBS CRM&apos;e erişmek için internet bağlantısı gerekiyor. Bağlantınızı
          kontrol edip tekrar deneyin.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
      >
        Tekrar Dene
      </Link>
    </div>
  );
}
