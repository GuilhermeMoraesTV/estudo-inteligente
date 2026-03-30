import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { buscarFlashcardsPorMaterial, buscarMaterialPorId, Flashcard, Material } from "../services/firebaseService";
import Navbar from "../components/Navbar";

// ---- Card panorâmico ----
const FlashcardPanoramico = ({
  flashcard,
  onClicar,
}: {
  flashcard: Flashcard;
  onClicar: (fc: Flashcard) => void;
}) => {
  const agora = Date.now();
  const prox = flashcard.proximaRevisao?.toMillis?.() ?? 0;
  const pendente = prox <= agora;

  return (
    <div
      onClick={() => onClicar(flashcard)}
      className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-violet-500/40 cursor-pointer transition-all duration-300 card-hover"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(99,102,241,0.04))" }} />
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative p-4">
        {/* Header do card */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${pendente ? "bg-yellow-400 animate-pulse" : "bg-success"}`} />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {flashcard.assuntoTitulo}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {flashcard.origem === "erro" && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                Reforço
              </span>
            )}
            {pendente && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                Pendente
              </span>
            )}
          </div>
        </div>

        {/* Frente */}
        <div className="mb-2">
          <p className="text-xs text-muted-foreground mb-1 font-medium">FRENTE</p>
          <p className="text-sm text-white font-medium leading-relaxed line-clamp-2">
            {flashcard.frente}
          </p>
        </div>

        {/* Verso (preview) */}
        <div className="border-t border-white/5 pt-2 mt-2">
          <p className="text-xs text-muted-foreground mb-1 font-medium">VERSO</p>
          <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
            {flashcard.verso}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Repetições: {flashcard.repeticoes}
          </span>
          <span className="text-[10px] text-violet-400 group-hover:text-violet-300 transition-colors flex items-center gap-1">
            Estudar
            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
};

// ---- Modal de estudo do flashcard ----
const ModalEstudoFlashcard = ({
  flashcard,
  onFechar,
}: {
  flashcard: Flashcard;
  onFechar: () => void;
}) => {
  const [virado, setVirado] = useState(false);

  useEffect(() => {
    setVirado(false);
  }, [flashcard.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div className="w-full max-w-lg animate-scale-in">
        {/* Botão fechar */}
        <div className="flex justify-end mb-4">
          <button onClick={onFechar}
            className="w-8 h-8 flex items-center justify-center rounded-xl glass text-muted-foreground hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Card com flip */}
        <div className="flashcard-container" style={{ height: "300px" }}>
          <div
            className={`flashcard-inner ${virado ? "flipped" : ""} cursor-pointer`}
            onClick={() => setVirado((v) => !v)}
            style={{ height: "300px" }}
          >
            {/* Frente */}
            <div className="flashcard-front glass-strong flex flex-col items-center justify-center p-8 text-center"
              style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(20,18,40,0.9)" }}>
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  {flashcard.assuntoTitulo}
                </span>
              </div>
              <p className="text-lg text-white font-medium leading-relaxed">{flashcard.frente}</p>
              {!virado && (
                <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 animate-float">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Clique para revelar
                  </span>
                </div>
              )}
            </div>
            {/* Verso */}
            <div className="flashcard-back flex flex-col items-center justify-center p-8 text-center"
              style={{ border: "1px solid rgba(52,211,153,0.25)", background: "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(16,185,129,0.04))", backdropFilter: "blur(20px)" }}>
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/15 border border-success/25 text-success text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Resposta
                </span>
              </div>
              <p className="text-base text-white font-medium leading-relaxed">{flashcard.verso}</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Clique no card para {virado ? "ver a frente" : "revelar a resposta"}
        </p>
      </div>
    </div>
  );
};

// ---- Página principal ----
const FlashcardsListaMaterial = () => {
  const { materialId } = useParams<{ materialId: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [material, setMaterial] = useState<Material | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [flashcardSelecionado, setFlashcardSelecionado] = useState<Flashcard | null>(null);
  const [filtroAssunto, setFiltroAssunto] = useState<string>("todos");
  const [filtroPendentes, setFiltroPendentes] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!usuario || !materialId) return;
    const carregar = async () => {
      try {
        const [mat, fcs] = await Promise.all([
          buscarMaterialPorId(materialId),
          buscarFlashcardsPorMaterial(usuario.uid, materialId),
        ]);
        setMaterial(mat);
        setFlashcards(fcs);
      } catch { /* silent */ }
      finally {
        setCarregando(false);
        setTimeout(() => setVisible(true), 100);
      }
    };
    carregar();
  }, [usuario, materialId]);

  // Assuntos únicos
  const assuntos = Array.from(new Set(flashcards.map((f) => f.assuntoTitulo)));

  const flashcardsFiltrados = flashcards.filter((f) => {
    const matchAssunto = filtroAssunto === "todos" || f.assuntoTitulo === filtroAssunto;
    const matchPendente = !filtroPendentes || (f.proximaRevisao?.toMillis?.() ?? 0) <= Date.now();
    return matchAssunto && matchPendente;
  });

  const totalPendentes = flashcards.filter((f) => (f.proximaRevisao?.toMillis?.() ?? 0) <= Date.now()).length;

  if (carregando) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl animate-brain-pulse">🃏</div>
          </div>
          <p className="text-muted-foreground text-sm">Carregando flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="relative mx-auto max-w-6xl px-4 pt-24 pb-16">
        {/* Breadcrumb */}
        <div className={`mb-6 transition-all duration-500 ${visible ? "opacity-100" : "opacity-0"}`}>
          <button onClick={() => navigate(`/estudos/${materialId}`)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {material?.titulo || "Material"}
          </button>
        </div>

        {/* Header */}
        <div className={`mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="text-xs font-medium text-violet-400 uppercase tracking-widest">Visão Panorâmica</span>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
              Flashcards — {material?.titulo}
            </h1>
            <button
              onClick={() => navigate("/flashcards")}
              className="btn-primary px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-2"
            >
              🃏 Revisar
            </button>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>{flashcards.length} flashcard{flashcards.length !== 1 ? "s" : ""} total</span>
            {totalPendentes > 0 && (
              <span className="text-yellow-400">{totalPendentes} pendente{totalPendentes !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className={`flex flex-wrap gap-2 mb-6 transition-all duration-700 delay-100 ${visible ? "opacity-100" : "opacity-0"}`}>
          <button
            onClick={() => setFiltroPendentes(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${!filtroPendentes ? "bg-violet-500/20 border-violet-500/40 text-violet-300" : "border-white/10 text-muted-foreground hover:text-white"}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroPendentes(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border flex items-center gap-1.5 ${filtroPendentes ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300" : "border-white/10 text-muted-foreground hover:text-white"}`}
          >
            Pendentes
            {totalPendentes > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-yellow-500/30 text-yellow-400 text-[9px] font-bold">
                {totalPendentes}
              </span>
            )}
          </button>
          <div className="w-px bg-white/10 self-stretch mx-1" />
          <button
            onClick={() => setFiltroAssunto("todos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${filtroAssunto === "todos" ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "border-white/10 text-muted-foreground hover:text-white"}`}
          >
            Todos os assuntos
          </button>
          {assuntos.map((a) => (
            <button
              key={a}
              onClick={() => setFiltroAssunto(a)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border max-w-[180px] truncate ${filtroAssunto === a ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "border-white/10 text-muted-foreground hover:text-white"}`}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Grid panorâmico */}
        {flashcardsFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl">📭</span>
            <p className="text-muted-foreground mt-3">Nenhum flashcard encontrado com esses filtros.</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {flashcardsFiltrados.map((fc, idx) => (
              <div
                key={fc.id}
                className="opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${Math.min(idx * 40, 600)}ms`, animationFillMode: "forwards" }}
              >
                <FlashcardPanoramico flashcard={fc} onClicar={setFlashcardSelecionado} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de estudo */}
      {flashcardSelecionado && (
        <ModalEstudoFlashcard
          flashcard={flashcardSelecionado}
          onFechar={() => setFlashcardSelecionado(null)}
        />
      )}
    </div>
  );
};

export default FlashcardsListaMaterial;