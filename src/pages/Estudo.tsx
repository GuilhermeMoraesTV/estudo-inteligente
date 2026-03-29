import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  buscarMaterialPorId, buscarQuestoesPorAssunto,
  salvarQuestoes, salvarFlashcards, registrarResposta,
  gerarReforcoParaQuestao as _unused,
  Material, Questao, AssuntoSalvo
} from "../services/firebaseService";
import { gerarConteudoParaAssunto, gerarFeedbackDesempenho, gerarReforcoParaQuestao } from "../services/aiService";
import Navbar from "../components/Navbar";

type TipoEstudo = "simples" | "elaborada";

// ---- Tela de seleção de tipo ----
const SelecaoTipo = ({
  assunto,
  material,
  onEscolher,
  assuntos,
  assuntoAtual,
  onTrocarAssunto,
}: {
  assunto: AssuntoSalvo;
  material: Material;
  onEscolher: (tipo: TipoEstudo) => void;
  assuntos: AssuntoSalvo[];
  assuntoAtual: string;
  onTrocarAssunto: (id: string) => void;
}) => (
  <div className="min-h-screen bg-background">
    <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
    <Navbar />
    <main className="relative mx-auto max-w-2xl px-4 pt-24 pb-16">
      {/* Breadcrumb */}
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {material.titulo}
        </button>
      </div>

      {/* Assunto atual */}
      <div className="mb-8 animate-fade-in-up">
        <span className="text-xs text-violet-400 uppercase tracking-widest font-medium">Assunto</span>
        <h1 className="text-3xl font-bold text-white mt-1" style={{ fontFamily: "Syne, sans-serif" }}>
          {assunto.titulo}
        </h1>
        <p className="text-muted-foreground text-sm mt-2">{assunto.descricao}</p>
      </div>

      {/* Outros assuntos */}
      {assuntos.length > 1 && (
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Outros assuntos disponíveis</p>
          <div className="flex flex-wrap gap-2">
            {assuntos.map((a) => (
              <button
                key={a.id}
                onClick={() => onTrocarAssunto(a.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  a.id === assuntoAtual
                    ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                    : "border-white/10 text-muted-foreground hover:border-violet-500/30 hover:text-white"
                }`}
              >
                {a.titulo}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tipo de estudo */}
      <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Escolha o modo de estudo</p>
        <div className="grid grid-cols-2 gap-4">
          {/* Flash */}
          <button
            onClick={() => onEscolher("simples")}
            className="group relative overflow-hidden rounded-2xl p-6 text-left border border-white/10 hover:border-blue-500/50 transition-all duration-300"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.06))" }} />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"
                style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)" }}>
                ⚡
              </div>
              <h3 className="font-bold text-white text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
                Questão Flash
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Questões simples e diretas para memorização rápida de conceitos.
              </p>
              <div className="mt-4 flex items-center gap-1 text-blue-400">
                <span className="text-[11px] font-medium">Memorização</span>
                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Elaborada */}
          <button
            onClick={() => onEscolher("elaborada")}
            className="group relative overflow-hidden rounded-2xl p-6 text-left border border-white/10 hover:border-violet-500/50 transition-all duration-300"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(99,102,241,0.06))" }} />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"
                style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
                🎯
              </div>
              <h3 className="font-bold text-white text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
                Questão de Concurso
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Questões elaboradas no estilo CESPE/FCC com situações-problema.
              </p>
              <div className="mt-4 flex items-center gap-1 text-violet-400">
                <span className="text-[11px] font-medium">Aprofundamento</span>
                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>
    </main>
  </div>
);

// ---- Loading ----
const LoadingQuestoes = ({ mensagem }: { mensagem: string }) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-spin-slow" />
        <div className="absolute inset-2 rounded-full border-2 border-indigo-500/20 animate-spin-slow" style={{ animationDirection: "reverse" }} />
        <div className="absolute inset-0 flex items-center justify-center text-3xl animate-brain-pulse">🧠</div>
      </div>
      <p className="text-white font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>{mensagem}</p>
      <p className="text-muted-foreground text-sm">Aguarde um momento...</p>
    </div>
  </div>
);

// ---- Option Button ----
const OptionButton = ({
  alternativa, index, respondida, selecionada, correta, onSelect,
}: {
  alternativa: string; index: number; respondida: boolean;
  selecionada: string | null; correta: string; onSelect: (alt: string) => void;
}) => {
  const letters = ["A", "B", "C", "D", "E"];
  const letter = letters[index];
  const isSelected = alternativa === selecionada;
  const isCorrect = alternativa === correta;

  let statusClass = "";
  let letterClass = "bg-white/10 text-white/60";
  let borderClass = "border-white/10 hover:border-violet-500/40 hover:bg-white/5";

  if (respondida) {
    if (isCorrect) { statusClass = "bg-success/10"; borderClass = "border-success/40"; letterClass = "bg-success/20 text-success"; }
    else if (isSelected) { statusClass = "bg-destructive/10"; borderClass = "border-destructive/40"; letterClass = "bg-destructive/20 text-destructive"; }
    else { statusClass = "opacity-40"; borderClass = "border-white/5"; }
  } else if (isSelected) {
    borderClass = "border-violet-500/60 bg-violet-500/10"; letterClass = "bg-violet-500/30 text-violet-300";
  }

  return (
    <button
      onClick={() => !respondida && onSelect(alternativa)}
      disabled={respondida}
      className={`question-option w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left ${statusClass} ${borderClass} ${respondida ? "cursor-default" : ""} animate-fade-in-up opacity-0`}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "forwards" }}
    >
      <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${letterClass}`}>
        {letter}
      </span>
      <span className="text-sm leading-snug flex-1"
        style={{ color: respondida && isCorrect ? "#34d399" : respondida && isSelected ? "#f87171" : undefined }}>
        {alternativa}
      </span>
      {respondida && isCorrect && (
        <svg className="w-5 h-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {respondida && isSelected && !isCorrect && (
        <svg className="w-5 h-5 text-destructive shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
};

// ---- Resultado ----
const ResultScreen = ({
  acertos, total, navigate, materialId, assuntoId,
}: {
  acertos: number; total: number;
  navigate: (p: string) => void; materialId: string; assuntoId: string;
}) => {
  const taxa = total > 0 ? Math.round((acertos / total) * 100) : 0;
  const [feedback, setFeedback] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const size = 160;
  const radius = (size - 12) / 2;
  const circumference = radius * 2 * Math.PI;
  const color = taxa >= 70 ? "#34d399" : taxa >= 40 ? "#fbbf24" : "#f87171";
  const [animRadius, setAnimRadius] = useState(0);

  useEffect(() => {
    setTimeout(() => setAnimRadius(taxa), 400);
    gerarFeedbackDesempenho(taxa, [])
      .then(setFeedback)
      .catch(() => setFeedback("Continue praticando!"))
      .finally(() => setFeedbackLoading(false));
  }, [taxa]);

  const offset = circumference - (animRadius / 100) * circumference;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      <Navbar />
      <main className="relative mx-auto max-w-2xl px-4 pt-24 pb-16">
        <div className="flex flex-col items-center gap-8">
          <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="score-ring">
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.22,1,0.36,1)", filter: `drop-shadow(0 0 16px ${color})` }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold" style={{ color, fontFamily: "Syne, sans-serif" }}>{taxa}%</span>
              <span className="text-xs text-muted-foreground">de acerto</span>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>Sessão Concluída!</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {taxa >= 70 ? "Excelente! 🎉" : taxa >= 40 ? "Bom progresso! 💪" : "Continue praticando! 🔥"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full">
            {[
              { label: "Acertos", value: acertos, color: "#34d399", icon: "✅" },
              { label: "Erros", value: total - acertos, color: "#f87171", icon: "❌" },
              { label: "Total", value: total, color: "#a78bfa", icon: "📊" },
            ].map((s, i) => (
              <div key={s.label} className="glass rounded-2xl p-4 text-center animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: "forwards", borderColor: `${s.color}20` }}>
                <span className="text-xl">{s.icon}</span>
                <p className="text-2xl font-bold mt-1" style={{ color: s.color, fontFamily: "Syne, sans-serif" }}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="w-full glass rounded-2xl p-5 border border-violet-500/20 animate-fade-in-up opacity-0"
            style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center text-xs">🧠</div>
              <span className="text-xs font-semibold text-violet-400">Feedback da IA</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              {feedbackLoading ? "Analisando desempenho..." : feedback}
            </p>
          </div>

          <div className="flex gap-3 w-full">
            <button onClick={() => navigate(`/estudos/${materialId}`)}
              className="flex-1 glass rounded-2xl py-3 text-sm font-semibold text-white border border-white/10 hover:bg-white/5 transition-all">
              ← Assuntos
            </button>
            <button
              onClick={() => navigate(`/estudo/${materialId}/${assuntoId}`)}
              className="flex-1 btn-primary rounded-2xl py-3 text-sm font-bold text-white"
              style={{ fontFamily: "Syne, sans-serif" }}>
              🔄 Tentar Novamente
            </button>
          </div>
          <button onClick={() => navigate("/flashcards")}
            className="w-full glass rounded-2xl py-3 text-sm font-semibold text-blue-400 border border-blue-500/20 hover:border-blue-500/40 transition-all">
            🃏 Revisar Flashcards
          </button>
        </div>
      </main>
    </div>
  );
};

// ---- Main Component ----
const Estudo = () => {
  const { materialId, assuntoId } = useParams<{ materialId: string; assuntoId: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [material, setMaterial] = useState<Material | null>(null);
  const [assuntoAtual, setAssuntoAtual] = useState<AssuntoSalvo | null>(null);
  const [tipoEstudo, setTipoEstudo] = useState<TipoEstudo | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [respondida, setRespondida] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [gerandoQuestoes, setGerandoQuestoes] = useState(false);
  const [sessaoFinalizada, setSessaoFinalizada] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [totalRespondidas, setTotalRespondidas] = useState(0);
  const [gerandoReforco, setGerandoReforco] = useState(false);
  const tempoInicio = useRef<number>(Date.now());

  // Carregar material
  useEffect(() => {
    if (!materialId) return;
    buscarMaterialPorId(materialId).then((m) => {
      setMaterial(m);
      if (m && assuntoId) {
        const a = m.assuntos?.find((x) => x.id === assuntoId);
        setAssuntoAtual(a || m.assuntos?.[0] || null);
      }
      setCarregando(false);
    });
  }, [materialId, assuntoId]);

  // Trocar assunto
  const handleTrocarAssunto = (id: string) => {
    if (!material) return;
    navigate(`/estudo/${materialId}/${id}`, { replace: true });
    const a = material.assuntos?.find((x) => x.id === id);
    setAssuntoAtual(a || null);
    setTipoEstudo(null);
    setQuestoes([]);
    setSessaoFinalizada(false);
    setIndiceAtual(0);
  };

  // Gerar questões ao escolher tipo
  const handleEscolherTipo = async (tipo: TipoEstudo) => {
    if (!usuario || !assuntoAtual || !materialId) return;
    setTipoEstudo(tipo);
    setGerandoQuestoes(true);

    try {
      // Tenta buscar questões salvas do mesmo tipo
      const salvas = await buscarQuestoesPorAssunto(usuario.uid, materialId, assuntoAtual.id);
      const doTipo = salvas.filter((q) => q.tipo === tipo);

      if (doTipo.length >= 3) {
        // Usa questões salvas (embaralhadas)
        setQuestoes(doTipo.sort(() => Math.random() - 0.5).slice(0, 5));
      } else {
        // Gera novas
        const resposta = await gerarConteudoParaAssunto(assuntoAtual, tipo, 5);
        const ids = await salvarQuestoes(
          usuario.uid, materialId, assuntoAtual.id, assuntoAtual.titulo,
          resposta.questoes
        );
        await salvarFlashcards(
          usuario.uid, materialId, assuntoAtual.id, assuntoAtual.titulo,
          resposta.flashcards, "gerado", material?.titulo
        );

        const novas: Questao[] = resposta.questoes.map((q, i) => ({
          id: ids[i], userId: usuario.uid, materialId: materialId!,
          assuntoId: assuntoAtual.id, assuntoTitulo: assuntoAtual.titulo,
          pergunta: q.pergunta, alternativas: q.alternativas,
          correta: q.correta, explicacao: q.explicacao,
          tipo: q.tipo || tipo,
          criadoEm: {} as any,
        }));
        setQuestoes(novas);
      }
    } catch (e) {
      console.error(e);
      setTipoEstudo(null);
    } finally {
      setGerandoQuestoes(false);
    }
  };

  const handleResponder = async (alternativa: string) => {
    if (respondida || !usuario || !questoes[indiceAtual]) return;
    setRespostaSelecionada(alternativa);
    setRespondida(true);
    const tempoGasto = Math.round((Date.now() - tempoInicio.current) / 1000);
    const questaoAtual = questoes[indiceAtual];
    const acertou = alternativa === questaoAtual.correta;
    if (acertou) setAcertos((p) => p + 1);
    setTotalRespondidas((p) => p + 1);
    setTimeout(() => setShowExplanation(true), 300);

    await registrarResposta(usuario.uid, "questao", questaoAtual.id!, acertou, tempoGasto, {
      assuntoId: questaoAtual.assuntoId,
      assuntoTitulo: questaoAtual.assuntoTitulo,
      pergunta: questaoAtual.pergunta,
    });

    // Se errou, salvar flashcard de reforço
    if (!acertou) {
      await salvarFlashcards(
        usuario.uid, materialId!, questaoAtual.assuntoId, questaoAtual.assuntoTitulo,
        [{ frente: questaoAtual.pergunta, verso: `Correta: ${questaoAtual.correta}\n${questaoAtual.explicacao}` }],
        "erro", material?.titulo
      );
    }
  };

  const handleGerarReforco = async () => {
    if (!usuario || !assuntoAtual || !materialId || !questoes[indiceAtual]) return;
    setGerandoReforco(true);
    try {
      const q = questoes[indiceAtual];
      const reforco = await gerarReforcoParaQuestao(q.pergunta, q.assuntoTitulo);
      await salvarQuestoes(usuario.uid, materialId, q.assuntoId, q.assuntoTitulo, reforco.questoes);
      await salvarFlashcards(usuario.uid, materialId, q.assuntoId, q.assuntoTitulo, reforco.flashcards, "erro", material?.titulo);
      alert(`✅ ${reforco.questoes.length} questões e ${reforco.flashcards.length} flashcards de reforço gerados!`);
    } catch { /* silent */ }
    finally { setGerandoReforco(false); }
  };

  const handleProxima = () => {
    if (indiceAtual < questoes.length - 1) {
      setIndiceAtual((p) => p + 1);
      setRespostaSelecionada(null);
      setRespondida(false);
      setShowExplanation(false);
      tempoInicio.current = Date.now();
    } else {
      setSessaoFinalizada(true);
    }
  };

  if (carregando) return <LoadingQuestoes mensagem="Carregando material..." />;
  if (gerandoQuestoes) return <LoadingQuestoes mensagem="Gerando questões com IA..." />;

  if (!material || !assuntoAtual) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Navbar />
        <p className="text-muted-foreground">Material não encontrado.</p>
        <button onClick={() => navigate("/estudos")} className="text-violet-400 hover:underline text-sm">← Voltar</button>
      </div>
    );
  }

  if (!tipoEstudo) {
    return (
      <SelecaoTipo
        assunto={assuntoAtual}
        material={material}
        onEscolher={handleEscolherTipo}
        assuntos={material.assuntos || []}
        assuntoAtual={assuntoAtual.id}
        onTrocarAssunto={handleTrocarAssunto}
      />
    );
  }

  if (sessaoFinalizada) {
    return (
      <ResultScreen
        acertos={acertos} total={totalRespondidas}
        navigate={navigate} materialId={materialId!} assuntoId={assuntoAtual.id}
      />
    );
  }

  const questaoAtual = questoes[indiceAtual];
  const progPercent = questoes.length > 0 ? ((indiceAtual + (respondida ? 1 : 0)) / questoes.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 grid-pattern opacity-15 pointer-events-none" />
      <Navbar />

      <main className="relative mx-auto max-w-2xl px-4 pt-24 pb-16">
        {/* Top bar */}
        <div className="mb-6 animate-fade-in-down">
          {/* Assuntos switcher */}
          {(material.assuntos?.length || 0) > 1 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {material.assuntos?.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleTrocarAssunto(a.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-all border ${
                    a.id === assuntoAtual.id
                      ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                      : "border-white/10 text-muted-foreground hover:border-violet-500/30 hover:text-white"
                  }`}
                >
                  {a.titulo}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-3">
              <span className="glass rounded-lg px-3 py-1 text-violet-400 font-mono font-bold">
                {indiceAtual + 1}/{questoes.length}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] border ${
                tipoEstudo === "simples"
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "bg-violet-500/10 border-violet-500/20 text-violet-400"
              }`}>
                {tipoEstudo === "simples" ? "⚡ Flash" : "🎯 Concurso"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="text-success">✓</span>
                <span className="text-success font-semibold">{acertos}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-destructive">✗</span>
                <span className="text-destructive font-semibold">{totalRespondidas - acertos}</span>
              </span>
            </div>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progPercent}%`,
                background: "linear-gradient(90deg, #7c3aed, #6366f1, #60a5fa)",
                boxShadow: "0 0 10px rgba(139,92,246,0.5)",
              }} />
          </div>
        </div>

        {/* Question */}
        <div key={`${assuntoAtual.id}-${indiceAtual}`} className="glass-strong rounded-3xl p-7 mb-5 animate-scale-in"
          style={{ border: "1px solid rgba(139,92,246,0.15)" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              {assuntoAtual.titulo} · Questão {indiceAtual + 1}
            </span>
          </div>

          <h2 className="text-base leading-relaxed text-white/95 font-medium mb-6" style={{ lineHeight: "1.7" }}>
            {questaoAtual?.pergunta}
          </h2>

          <div className="space-y-2.5">
            {questaoAtual?.alternativas.map((alt, i) => (
              <OptionButton
                key={i} alternativa={alt} index={i}
                respondida={respondida} selecionada={respostaSelecionada}
                correta={questaoAtual.correta} onSelect={handleResponder}
              />
            ))}
          </div>
        </div>

        {/* Explanation + Reforço */}
        {respondida && showExplanation && (
          <div className="glass rounded-2xl p-5 mb-5 animate-fade-in-up border border-violet-500/15">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center text-xs">💡</div>
                <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Explicação</span>
              </div>
              <button
                onClick={handleGerarReforco}
                disabled={gerandoReforco}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:border-yellow-500/50 disabled:opacity-50"
              >
                {gerandoReforco ? (
                  <>
                    <div className="w-3 h-3 rounded-full border border-yellow-400/50 border-t-yellow-400 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>📌 Revisar</>
                )}
              </button>
            </div>
            <p className="text-sm leading-relaxed text-white/80">{questaoAtual?.explicacao}</p>
          </div>
        )}

        {/* Next button */}
        {respondida && (
          <button onClick={handleProxima}
            className="btn-primary w-full rounded-2xl py-4 text-sm font-bold text-white animate-fade-in-up"
            style={{ fontFamily: "Syne, sans-serif" }}>
            {indiceAtual < questoes.length - 1 ? (
              <span className="flex items-center justify-center gap-2">
                Próxima questão
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">🏁 Ver Resultado</span>
            )}
          </button>
        )}
      </main>
    </div>
  );
};

export default Estudo;