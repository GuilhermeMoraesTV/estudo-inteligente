// Página de Login e Cadastro.
// Design minimalista com formulário centralizado.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [ehCadastro, setEhCadastro] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const { cadastrar, entrar } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      if (ehCadastro) {
        if (!nome.trim()) {
          setErro("Informe seu nome.");
          setCarregando(false);
          return;
        }
        await cadastrar(email, senha, nome);
      } else {
        await entrar(email, senha);
      }
      navigate("/");
    } catch (error: unknown) {
      const mensagem =
        error instanceof Error ? error.message : "Erro desconhecido.";
      if (mensagem.includes("auth/email-already-in-use")) {
        setErro("Este e-mail já está cadastrado.");
      } else if (mensagem.includes("auth/weak-password")) {
        setErro("A senha deve ter pelo menos 6 caracteres.");
      } else if (mensagem.includes("auth/invalid-email")) {
        setErro("E-mail inválido.");
      } else if (
        mensagem.includes("auth/wrong-password") ||
        mensagem.includes("auth/user-not-found") ||
        mensagem.includes("auth/invalid-credential")
      ) {
        setErro("E-mail ou senha incorretos.");
      } else {
        setErro("Ocorreu um erro. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Cabeçalho */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            StudyAgent
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerador inteligente de questões e flashcards
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {ehCadastro && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Nome
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Seu nome completo"
                required={ehCadastro}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          {erro && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {carregando ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Aguarde...
              </span>
            ) : ehCadastro ? (
              "Criar conta"
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        {/* Alternar entre login e cadastro */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {ehCadastro ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
          <button
            onClick={() => {
              setEhCadastro(!ehCadastro);
              setErro("");
            }}
            className="font-medium text-primary hover:underline"
          >
            {ehCadastro ? "Entrar" : "Cadastrar-se"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
