// Spinner de carregamento minimalista

const LoadingSpinner = ({ texto = "Carregando..." }: { texto?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
      <p className="text-sm text-muted-foreground">{texto}</p>
    </div>
  );
};

export default LoadingSpinner;
