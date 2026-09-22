export const LoadingScreen = ({ message }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-white/5" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-t-brand-400 animate-spin" />
      </div>
      <p className="font-bold text-lg text-slate-300 animate-pulse">
        {message || "모듈을 로딩하고 있습니다..."}
      </p>
    </div>
  );
};

export default LoadingScreen;
