// Contexto de autenticação global.
// Fornece estado do usuário e funções de login/cadastro/logout para toda a aplicação.

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { criarPerfilUsuario } from "../services/firebaseService";

interface AuthContextType {
  usuario: User | null;
  carregando: boolean;
  cadastrar: (email: string, senha: string, nome: string) => Promise<void>;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCarregando(false);
    });
    return unsubscribe;
  }, []);

  const cadastrar = async (email: string, senha: string, nome: string) => {
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    await criarPerfilUsuario(credencial.user.uid, email, nome);
  };

  const entrar = async (email: string, senha: string) => {
    await signInWithEmailAndPassword(auth, email, senha);
  };

  const sair = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ usuario, carregando, cadastrar, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
};
