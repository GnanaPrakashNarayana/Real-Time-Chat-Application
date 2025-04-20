const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200/80 p-12">
      <div className="max-w-md text-center">
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-2xl ${
                i % 2 === 0 
                  ? "bg-primary/10 animate-pulse" 
                  : "bg-primary/5"
              }`}
            />
          ))}
        </div>
        <h2 className="text-2xl font-medium mb-4">{title}</h2>
        <p className="text-base-content/60 mx-auto max-w-xs">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;