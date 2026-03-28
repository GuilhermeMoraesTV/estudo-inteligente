// Componente de rota protegida.
// Redireciona para o login caso o usuário não esteja autenticado.

import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const RotaProtegida = ({ children }: { children: React.ReactNode }) => {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default RotaProtegida;
