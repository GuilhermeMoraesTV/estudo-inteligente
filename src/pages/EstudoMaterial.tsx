import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { buscarMaterialPorId, Material } from "../services/firebaseService";
import Navbar from "../components/Navbar";

const EstudoMaterial = () => {
  const { materialId } = useParams<{ materialId: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [material, setMaterial] = useState<Material | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!materialId) return;
    const carregar = async () => {
      try {
        const dados = await buscarMaterialPorId(materialId);
        setMaterial(dados);
      } catch { /* silent */ }
      finally {
        setCarregando(false);
        setTimeout(() => setVisible(true), 100);
      }
    };
    carregar();
  }, [materialId]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl animate-brain-pulse">📖</div>
          </div>
          <p className="text-muted-foreground text-sm">Carregando material...</p>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Navbar />
        <span className="text-4xl">😕</span>
        <p className="text-muted-foreground">Material não encontrado.</p>
        <button onClick={() => navigate("/estudos")} className="text-violet-400 hover:underline text-sm">
          ← Voltar para Estudos
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="relative mx-auto max-w-4xl px-4 pt-24 pb-16">
        {/* Breadcrumb */}
        <div className={`mb-6 transition-all duration-500 ${visible ? "opacity-100" : "opacity-0"}`}>
          <button
            onClick={() => navigate("/estudos")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Meus Estudos
          </button>
        </div>

        {/* Header */}
        <div className={`mb-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center text-2xl shadow-2xl shrink-0"
              style={{ boxShadow: "0 0 30px rgba(139,92,246,0.4)" }}>
              📖
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
                {material.titulo}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {material.assuntos?.length || 0} assunto{(material.assuntos?.length || 0) !== 1 ? "s" : ""} identificado{(material.assuntos?.length || 0) !== 1 ? "s" : ""} pela IA
              </p>
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
            Escolha um assunto para estudar
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {(material.assuntos || []).map((assunto, idx) => (
              <div
                key={assunto.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-violet-500/50 cursor-pointer transition-all duration-300 card-hover opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${idx * 100}ms`, animationFillMode: "forwards" }}
                onClick={() => navigate(`/estudo/${materialId}/${assunto.id}`)}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(99,102,241,0.05) 100%)" }} />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 group-hover:scale-110 transition-transform"
                      style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
                        {assunto.titulo}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {assunto.descricao}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/15">
                        Questões
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/15">
                        Flashcards
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-violet-400">
                      <span className="text-xs font-medium">Estudar</span>
                      <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EstudoMaterial;