export const LoadingSpinner = () => {
  return (
    <div className="relative">
      <div className="w-16 h-16 border-4 border-muted rounded-full animate-spin border-t-primary mx-auto" />
      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-primary/20 mx-auto" />
    </div>
  );
};