import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { mapearAssuntos, Assunto } from "../services/aiService";
import { salvarMaterial } from "../services/firebaseService";
import Navbar from "../components/Navbar";
import AILoadingScreen from "../components/AILoadingScreen";

type Fase = "idle" | "extraindo" | "gerando" | "salvando";
type ModalStep = "escolha" | "pdf" | "texto";

const Upload = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [modalAberto, setModalAberto] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("escolha");
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [fase, setFase] = useState<Fase>("idle");
  const [progresso, setProgresso] = useState("");
  const [erro, setErro] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extrairTextoPDF = async (file: File): Promise<string> => {
    const pdfWorkerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textoCompleto = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      textoCompleto += (content.items as any[])
        .filter((item) => "str" in item)
        .map((item) => item.str)
        .join(" ") + "\n\n";
    }
    return textoCompleto.trim();
  };

  const processarENavegar = async (textoFinal: string, nomeArq?: string) => {
    if (!usuario) return;
    setErro("");
    setCarregando(true);
    setModalAberto(false);

    try {
      setFase("gerando");
      setProgresso("Identificando assuntos com IA...");
      const mapa = await mapearAssuntos(textoFinal, nomeArq);

      setFase("salvando");
      setProgresso("Salvando material...");
      const materialId = await salvarMaterial(
        usuario.uid,
        mapa.tituloGeral,
        textoFinal,
        "",
        mapa.assuntos.map((a) => ({
          id: a.id,
          titulo: a.titulo,
          descricao: a.descricao,
          trecho: a.trecho,
          totalQuestoes: 0,
        }))
      );

      navigate(`/estudos/${materialId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido.";
      setErro(`Falha ao processar: ${msg}`);
      setFase("idle");
      setModalAberto(true);
    } finally {
      setCarregando(false);
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") { setErro("Apenas arquivos PDF são aceitos."); return; }
    if (file.size > 10 * 1024 * 1024) { setErro("Arquivo máximo: 10MB."); return; }
    setErro("");
    setCarregando(true);
    setFase("extraindo");
    setProgresso("Extraindo texto do PDF...");
    setModalAberto(false);

    try {
      const textoExtraido = await extrairTextoPDF(file);
      await processarENavegar(textoExtraido, file.name);
    } catch {
      setErro("Erro ao processar o PDF.");
      setFase("idle");
      setModalAberto(true);
    } finally {
      setCarregando(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  }, []);

  const handleEnviarTexto = async () => {
    if (texto.trim().length < 10) {
      setErro("Digite algum conteúdo para continuar.");
      return;
    }
    await processarENavegar(texto.trim());
  };

  const abrirModal = () => {
    setModalStep("escolha");
    setErro("");
    setTexto("");
    setCharCount(0);
    setModalAberto(true);
  };

  if (carregando && fase !== "idle") {
    return <AILoadingScreen progresso={progresso} fase={fase} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      <Navbar />

      <main className="relative mx-auto max-w-5xl px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-10 animate-fade-in-up">
          <span className="text-xs font-medium text-violet-400 uppercase tracking-widest">Área de Estudos</span>
          <h1 className="text-4xl font-bold text-white mt-2" style={{ fontFamily: "Syne, sans-serif" }}>
            Novo Material
          </h1>
          <p className="mt-2 text-muted-foreground">
            Faça upload de um PDF ou cole seu texto. A IA mapeia os assuntos automaticamente.
          </p>
        </div>

        {/* Upload CTA Card */}
        <div
          className="relative overflow-hidden rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer group transition-all duration-300 border border-violet-500/20 hover:border-violet-500/50 animate-fade-in-up"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(99,102,241,0.06) 100%)", minHeight: 320 }}
          onClick={abrirModal}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(99,102,241,0.1) 100%)" }} />
          <div className="absolute top-6 right-8 text-7xl opacity-5 group-hover:opacity-10 transition-opacity select-none pointer-events-none">✦</div>

          <div className="relative z-10 flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center text-3xl shadow-2xl group-hover:scale-110 transition-transform"
              style={{ boxShadow: "0 0 40px rgba(139,92,246,0.4)" }}>
              🚀
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
                Adicionar Material de Estudo
              </h2>
              <p className="text-muted-foreground mt-2 max-w-md">
                Upload de PDF ou cole anotações. A IA identifica os assuntos e gera questões personalizadas.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              {["📄 PDF", "📋 Texto", "🧠 IA Gemini"].map((tag) => (
                <span key={tag} className="glass px-3 py-1.5 rounded-lg text-xs text-muted-foreground border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {erro && !modalAberto && (
          <div className="mt-4 flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 animate-scale-in">
            <svg className="w-4 h-4 text-destructive shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-destructive">{erro}</p>
          </div>
        )}
      </main>

      {/* MODAL */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalAberto(false); }}
        >
          <div
            className="relative w-full max-w-lg glass-strong rounded-3xl animate-scale-in"
            style={{ border: "1px solid rgba(139,92,246,0.3)", boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,246,0.15)" }}
          >
            {/* Close */}
            <button
              onClick={() => setModalAberto(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all z-10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Step: Escolha */}
            {modalStep === "escolha" && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center text-2xl mx-auto mb-4"
                    style={{ boxShadow: "0 0 30px rgba(139,92,246,0.4)" }}>
                    📚
                  </div>
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
                    Como deseja adicionar?
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Escolha o formato do seu material</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* PDF */}
                  <button
                    onClick={() => setModalStep("pdf")}
                    className="group relative overflow-hidden rounded-2xl p-6 flex flex-col items-center gap-3 text-center transition-all duration-300 border border-white/10 hover:border-violet-500/50"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(99,102,241,0.06))" }} />
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-1 group-hover:scale-110 transition-transform"
                        style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
                        📄
                      </div>
                      <p className="font-semibold text-white text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Upload PDF</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Arraste ou selecione<br />um arquivo PDF</p>
                    </div>
                    <div className="relative flex gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
                        Até 10MB
                      </span>
                    </div>
                  </button>

                  {/* Texto */}
                  <button
                    onClick={() => setModalStep("texto")}
                    className="group relative overflow-hidden rounded-2xl p-6 flex flex-col items-center gap-3 text-center transition-all duration-300 border border-white/10 hover:border-blue-500/50"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.06))" }} />
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-1 group-hover:scale-110 transition-transform"
                        style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)" }}>
                        📋
                      </div>
                      <p className="font-semibold text-white text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Colar Texto</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Cole anotações,<br />trechos ou resumos</p>
                    </div>
                    <div className="relative flex gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                        Qualquer tamanho
                      </span>
                    </div>
                  </button>
                </div>

                <div className="mt-6 glass rounded-xl px-4 py-3 flex items-start gap-2">
                  <span className="text-sm">✨</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A IA vai <strong className="text-white">identificar automaticamente</strong> os assuntos do material e organizar os estudos por tópico.
                  </p>
                </div>
              </div>
            )}

            {/* Step: PDF */}
            {modalStep === "pdf" && (
              <div className="p-8">
                <button onClick={() => setModalStep("escolha")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors mb-6">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Voltar
                </button>

                <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "Syne, sans-serif" }}>
                  Upload de PDF
                </h2>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
                    dragOver ? "border-violet-500 bg-violet-500/10 scale-[1.02]" : "border-white/15 hover:border-violet-500/40 hover:bg-white/3"
                  }`}
                >
                  {dragOver && <div className="absolute inset-0 rounded-2xl bg-violet-500/5 animate-pulse" />}
                  <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all ${dragOver ? "bg-violet-500/20 scale-110" : "bg-white/5"}`}>
                      📄
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {dragOver ? "Solte aqui!" : "Arraste ou clique para selecionar"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PDF até 10MB</p>
                    </div>
                    {!dragOver && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Selecionar arquivo
                      </span>
                    )}
                  </div>
                </div>

                {erro && (
                  <div className="mt-3 flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
                    <p className="text-xs text-destructive">{erro}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step: Texto */}
            {modalStep === "texto" && (
              <div className="p-8">
                <button onClick={() => setModalStep("escolha")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors mb-6">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Voltar
                </button>

                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
                  Colar Anotações
                </h2>
                <p className="text-xs text-muted-foreground mb-5">
                  Cole qualquer conteúdo — a IA complementará com seu conhecimento.
                </p>

                <div className="relative">
                  <textarea
                    value={texto}
                    onChange={(e) => { setTexto(e.target.value); setCharCount(e.target.value.length); }}
                    rows={8}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground/40 outline-none transition-all resize-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
                    placeholder="Cole aqui seu conteúdo de estudo: edital, artigo, capítulo, legislação, resumo..."
                  />
                  <div className="flex items-center justify-between mt-2 px-1">
                    <span className="text-[11px] text-muted-foreground">{charCount} caracteres</span>
                    {charCount < 50 && charCount > 0 && (
                      <span className="text-[11px] text-yellow-500">A IA usará seu conhecimento para complementar</span>
                    )}
                  </div>
                </div>

                {erro && (
                  <div className="mt-3 flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
                    <p className="text-xs text-destructive">{erro}</p>
                  </div>
                )}

                <button
                  onClick={handleEnviarTexto}
                  disabled={texto.trim().length === 0}
                  className="btn-primary w-full mt-5 rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>🧠</span> Analisar com IA
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;