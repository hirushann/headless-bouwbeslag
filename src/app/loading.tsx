export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="animate-bounce">
        <span className="text-6xl font-black text-[#0066FF] font-sans">b</span>
      </div>
    </div>
  );
}
