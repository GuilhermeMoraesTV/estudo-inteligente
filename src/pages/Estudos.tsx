import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { buscarMateriaisDoUsuario, excluirMaterial, Material } from "../services/firebaseService";
import Navbar from "../components/Navbar";

const Estudos = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [visible, setVisible] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) return;
    const carregar = async () => {
      try {
        const dados = await buscarMateriaisDoUsuario(usuario.uid);
        setMateriais(dados);
      } catch { /* silent */ }
      finally {
        setCarregando(false);
        setTimeout(() => setVisible(true), 100);
      }
    };
    carregar();
  }, [usuario]);

  const formatarData = (ts: any) => {
    if (!ts?.toDate) return "";
    const d = ts.toDate() as Date;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleExcluir = async (materialId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmarExclusao === materialId) {
      setExcluindo(materialId);
      try {
        await excluirMaterial(materialId, usuario!.uid);
        setMateriais((prev) => prev.filter((m) => m.id !== materialId));
      } catch { /* silent */ }
      finally {
        setExcluindo(null);
        setConfirmarExclusao(null);
      }
    } else {
      setConfirmarExclusao(materialId);
      setTimeout(() => setConfirmarExclusao(null), 3000);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl animate-brain-pulse">📚</div>
          </div>
          <p className="text-muted-foreground text-sm">Carregando seus estudos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="relative mx-auto max-w-5xl px-4 pt-24 pb-16">
        {/* Header */}
        <div className={`mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="text-xs font-medium text-violet-400 uppercase tracking-widest">Meus Materiais</span>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
              Estudos
            </h1>
            <button
              onClick={() => navigate("/upload")}
              className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Novo
            </button>
          </div>
          <p className="mt-2 text-muted-foreground">
            {materiais.length > 0
              ? `${materiais.length} material${materiais.length > 1 ? "is" : ""} salvo${materiais.length > 1 ? "s" : ""}`
              : "Nenhum material ainda"}
          </p>
        </div>

        {/* Empty state */}
        {materiais.length === 0 && (
          <div className={`transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div
              className="rounded-3xl p-16 flex flex-col items-center justify-center text-center border border-white/10 cursor-pointer group hover:border-violet-500/30 transition-all"
              style={{ background: "rgba(255,255,255,0.02)" }}
              onClick={() => navigate("/upload")}
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center text-4xl mb-6 animate-float group-hover:scale-110 transition-transform">
                📚
              </div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
                Nenhum material ainda
              </h2>
              <p className="text-muted-foreground mt-2 max-w-sm text-sm">
                Faça upload de um PDF ou cole suas anotações para começar a estudar com IA.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-400 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Adicionar primeiro material
              </div>
            </div>
          </div>
        )}

        {/* Materials Grid */}
        {materiais.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            {materiais.map((material, idx) => (
              <div
                key={material.id}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 hover:border-violet-500/40 transition-all duration-300 card-hover opacity-0 animate-fade-in-up`}
                style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "forwards" }}
              >
                {/* Hover overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(99,102,241,0.04) 100%)" }} />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => navigate(`/estudos/${material.id}`)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center text-lg shrink-0">
                        📖
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>
                          {material.titulo}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatarData(material.criadoEm)}
                        </p>
                      </div>
                    </div>

                    {/* Botão excluir */}
                    <button
                      onClick={(e) => handleExcluir(material.id!, e)}
                      disabled={excluindo === material.id}
                      className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        confirmarExclusao === material.id
                          ? "bg-red-500/20 border border-red-500/50 text-red-400"
                          : "opacity-0 group-hover:opacity-100 bg-white/5 border border-white/10 text-muted-foreground hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                      }`}
                      title={confirmarExclusao === material.id ? "Clique para confirmar" : "Excluir material"}
                    >
                      {excluindo === material.id ? (
                        <div className="w-3 h-3 rounded-full border border-red-400/50 border-t-red-400 animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                      {confirmarExclusao === material.id ? "Confirmar?" : ""}
                    </button>
                  </div>

                  {/* Assuntos */}
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/estudos/${material.id}`)}
                  >
                    {material.assuntos && material.assuntos.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                          {material.assuntos.length} Assunto{material.assuntos.length > 1 ? "s" : ""}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {material.assuntos.slice(0, 3).map((assunto) => (
                            <span
                              key={assunto.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border"
                              style={{
                                background: "rgba(139,92,246,0.08)",
                                borderColor: "rgba(139,92,246,0.2)",
                                color: "#a78bfa",
                              }}
                            >
                              <span className="w-1 h-1 rounded-full bg-violet-400 flex-shrink-0" />
                              {assunto.titulo}
                            </span>
                          ))}
                          {material.assuntos.length > 3 && (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] text-muted-foreground border border-white/10">
                              +{material.assuntos.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        Clique para estudar
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/15 font-medium">
                          IA Ready
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Estudos;