import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { buscarMaterialPorId, buscarFlashcardsPorMaterial, Material } from "../services/firebaseService";
import Navbar from "../components/Navbar";

const EstudoMaterial = () => {
  const { materialId } = useParams<{ materialId: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [material, setMaterial] = useState<Material | null>(null);
  const [totalFlashcards, setTotalFlashcards] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!materialId || !usuario) return;
    const carregar = async () => {
      try {
        const [dados, flashcards] = await Promise.all([
          buscarMaterialPorId(materialId),
          buscarFlashcardsPorMaterial(usuario.uid, materialId),
        ]);
        setMaterial(dados);
        setTotalFlashcards(flashcards.length);
      } catch { /* silent */ }
      finally { setCarregando(false); setTimeout(() => setVisible(true), 100); }
    };
    carregar();
  }, [materialId, usuario]);

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
        <button onClick={() => navigate("/estudos")} className="text-violet-400 hover:underline text-sm">← Estudos</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      <Navbar />

      <main className="relative mx-auto max-w-4xl px-4 pt-24 pb-16">
        {/* Breadcrumb */}
        <div className={`mb-6 transition-all duration-500 ${visible ? "opacity-100" : "opacity-0"}`}>
          <button onClick={() => navigate("/estudos")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Meus Estudos
          </button>
        </div>

        {/* Header */}
        <div className={`mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center text-2xl shadow-2xl shrink-0"
                style={{ boxShadow: "0 0 30px rgba(139,92,246,0.4)" }}>📖</div>
              <div>
                <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>{material.titulo}</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  {material.assuntos?.length || 0} assunto{(material.assuntos?.length || 0) !== 1 ? "s" : ""} · {totalFlashcards} flashcard{totalFlashcards !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => navigate(`/flashcards/material/${materialId}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border border-blue-500/20 bg-blue-500/8 text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/15">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">Flashcards</span>
                {totalFlashcards > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">{totalFlashcards}</span>
                )}
              </button>
              <button onClick={() => navigate("/flashcards")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border border-violet-500/20 bg-violet-500/8 text-violet-400 hover:border-violet-500/40">
                🃏 <span className="hidden sm:inline">Revisar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Subjects Grid — somente títulos, sem descrição */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
            Escolha um assunto
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(material.assuntos || []).map((assunto, idx) => (
              <div
                key={assunto.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-violet-500/50 cursor-pointer transition-all duration-300 card-hover opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "forwards" }}
                onClick={() => navigate(`/estudo/${materialId}/${assunto.id}`)}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(99,102,241,0.05) 100%)" }} />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-violet-400 shrink-0 group-hover:scale-110 transition-transform"
                    style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm truncate" style={{ fontFamily: "Syne, sans-serif" }}>
                      {assunto.titulo}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/15">⚡ Flash</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">🎯 Concurso</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
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