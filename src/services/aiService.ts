const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function chamarGemini(prompt: string, temperature = 0.7): Promise<string> {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: 8192 },
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || `Erro HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export interface Assunto {
  id: string;
  titulo: string;
  descricao: string;
  trecho: string;
}

export interface RespostaMapaAssuntos {
  tituloGeral: string;
  assuntos: Assunto[];
}

export interface QuestaoGerada {
  pergunta: string;
  alternativas: string[];
  correta: string;
  explicacao: string;
  tipo: "simples" | "elaborada";
}

export interface RespostaIA {
  resumo: string;
  questoes: QuestaoGerada[];
  flashcards: Array<{ frente: string; verso: string }>;
}

function extrairJSON(texto: string): string {
  let limpo = texto.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const inicioObj = limpo.indexOf("{");
  const fimObj = limpo.lastIndexOf("}");
  if (inicioObj !== -1 && fimObj !== -1) {
    limpo = limpo.substring(inicioObj, fimObj + 1);
  }
  limpo = limpo.replace(/,\s*([}\]])/g, "$1");
  limpo = limpo.replace(/,\s*""\s*}/g, "}");
  limpo = limpo.replace(/,\s*""\s*]/g, "]");
  return limpo;
}

// ==================== MAPEAMENTO DE ASSUNTOS (MELHORADO) ====================

export const mapearAssuntos = async (
  texto: string,
  nomeArquivo?: string
): Promise<RespostaMapaAssuntos> => {
  // Estratégia: dividir texto em chunks para análise mais completa
  const textoTruncado = texto.substring(0, 12000);
  const totalChars = texto.length;
  const totalPaginas = Math.ceil(totalChars / 3000);

  const prompt = `Você é um especialista pedagógico em concursos públicos brasileiros com profundo conhecimento em mapeamento de conteúdo educacional.

ARQUIVO: ${nomeArquivo || "Material de Estudo"}
TAMANHO ESTIMADO: ~${totalPaginas} páginas

SUA MISSÃO: Analisar o texto abaixo e identificar TODOS os assuntos/tópicos pedagógicos distintos e relevantes para estudo.

REGRAS CRÍTICAS:
- IGNORE completamente: apresentações, prefácios, sumários, índices, informações sobre bancas, dados editoriais, biografias de autores, instruções de uso do material
- FOQUE apenas em conteúdo pedagógico real: definições, conceitos, regras, teorias, leis, princípios
- Identifique de 3 a 8 assuntos principais (nunca menos de 3 se o texto tiver conteúdo)
- Cada assunto deve ter pelo menos 150 caracteres de trecho relevante
- Os títulos devem ser específicos (ex: "Concordância Verbal", não apenas "Gramática")
- Se o texto for sobre uma disciplina específica, mapeie os subtópicos dela

EXEMPLOS DE MAPEAMENTO CORRETO:
- Português → [Concordância Verbal, Regência Nominal, Crase, Pontuação, Colocação Pronominal]
- Direito Administrativo → [Atos Administrativos, Licitações, Poderes da Administração, Serviços Públicos]
- Matemática → [Porcentagem, Juros Simples, Juros Compostos, Regra de Três]

Retorne APENAS este JSON válido (sem markdown, sem texto extra, sem comentários):
{
  "tituloGeral": "Título específico que representa o material (ex: 'Língua Portuguesa - Gramática e Redação')",
  "assuntos": [
    {
      "id": "assunto_1",
      "titulo": "Nome específico e preciso do tópico",
      "descricao": "O que será estudado neste tópico e sua importância para concursos",
      "trecho": "Trecho do texto original que contém o conteúdo deste tópico (mínimo 200 caracteres)"
    }
  ]
}

TEXTO PARA ANÁLISE:
${textoTruncado}`;

  try {
    const raw = await chamarGemini(prompt, 0.3);
    const json = extrairJSON(raw);
    const dados: RespostaMapaAssuntos = JSON.parse(json);

    if (!dados.tituloGeral || !Array.isArray(dados.assuntos) || dados.assuntos.length === 0) {
      throw new Error("Estrutura inválida");
    }

    // Filtrar assuntos que parecem ser apresentação/sumário
    const palavrasProibidas = ["apresentação", "prefácio", "sumário", "índice", "sobre o autor", "banca", "edital de referência", "como usar", "introdução ao material"];
    const assuntosFiltrados = dados.assuntos.filter(a => {
      const tituloLower = a.titulo.toLowerCase();
      return !palavrasProibidas.some(p => tituloLower.includes(p));
    });

    if (assuntosFiltrados.length === 0) {
      return dados; // retorna original se filtrou tudo
    }

    return { ...dados, assuntos: assuntosFiltrados };
  } catch (e) {
    console.error("Erro no mapeamento da IA:", e);
    return {
      tituloGeral: nomeArquivo?.replace(/\.(pdf|txt|docx?)$/i, "") || "Material de Estudo",
      assuntos: [
        {
          id: "assunto_1",
          titulo: nomeArquivo?.replace(/\.(pdf|txt|docx?)$/i, "") || "Conteúdo Principal",
          descricao: "Conteúdo do material enviado",
          trecho: texto.substring(0, 3000),
        },
      ],
    };
  }
};

// ==================== GERAÇÃO DE CONTEÚDO (MELHORADO) ====================

export const gerarConteudoParaAssunto = async (
  assunto: Assunto,
  tipoQuestao: "simples" | "elaborada" = "elaborada",
  quantidadeQuestoes = 5
): Promise<RespostaIA> => {
  const textoBase = assunto.trecho.trim();
  const usarConhecimentoIA = textoBase.length < 200;

  const fonteDados = usarConhecimentoIA
    ? `ASSUNTO PARA GERAR QUESTÕES: "${assunto.titulo}" - ${assunto.descricao}`
    : `CONTEÚDO DE REFERÊNCIA (use para embasar as questões, mas NÃO mencione o material, apostila ou texto nas questões):
${textoBase.substring(0, 5000)}`;

  const promptConcurso = `Você é um elaborador sênior de provas de concursos públicos brasileiros com 20 anos de experiência nas bancas CESPE/CEBRASPE, FCC, VUNESP, FGV e ESAF.

ASSUNTO: ${assunto.titulo}
NÍVEL: Questões elaboradas para concurso público de nível médio/superior

${fonteDados}

INSTRUÇÕES ABSOLUTAS PARA AS QUESTÕES:
1. NUNCA mencione "o texto", "o material", "a apostila", "o trecho acima", "conforme apresentado", "segundo o autor" ou qualquer referência ao material
2. As questões devem ser AUTOSSUFICIENTES — um candidato sem acesso ao material deve conseguir respondê-las
3. Crie situações-problema reais, casos concretos, aplicações práticas
4. Use linguagem técnica precisa como nas bancas reais
5. As alternativas incorretas devem ser plausíveis e conter erros sutis (pegadinhas técnicas)
6. Varie os verbos: analise, julgue, identifique, assinale, é correto afirmar que...

INSTRUÇÕES PARA AS EXPLICAÇÕES (MODO CONCURSO - DETALHADAS):
Para cada questão, a explicação deve ter OBRIGATORIAMENTE:
- Por que a alternativa correta está certa (fundamentação técnica)
- Por que CADA alternativa errada está errada (análise individual)
- Regra/conceito/lei que fundamenta a resposta
- Dica de memorização para a prova
Use o formato:
"✅ CORRETA [LETRA]: [motivo detalhado]
❌ [LETRA]: [por que está errada]
❌ [LETRA]: [por que está errada]
❌ [LETRA]: [por que está errada]
❌ [LETRA]: [por que está errada]
📌 CONCEITO-CHAVE: [regra ou fundamento]
💡 DICA PROVA: [estratégia de memorização]"

Gere exatamente ${quantidadeQuestoes} questões no estilo CESPE/FCC com 5 alternativas (A, B, C, D, E).

Retorne APENAS JSON válido (sem markdown, sem texto antes ou depois):
{
  "resumo": "Síntese dos principais pontos do assunto em 2-3 frases objetivas",
  "questoes": [
    {
      "pergunta": "Enunciado completo e autossuficiente da questão",
      "alternativas": ["A) texto completo", "B) texto completo", "C) texto completo", "D) texto completo", "E) texto completo"],
      "correta": "A) texto exato da alternativa correta",
      "explicacao": "Explicação detalhada seguindo o formato acima",
      "tipo": "elaborada"
    }
  ],
  "flashcards": [
    {
      "frente": "Conceito, definição ou pergunta objetiva sobre ${assunto.titulo}",
      "verso": "Resposta precisa e completa"
    }
  ]
}`;

  const promptFlash = `Você é um professor especialista em concursos públicos brasileiros, mestre em técnicas de memorização e estudo ativo.

ASSUNTO: ${assunto.titulo}

${fonteDados}

INSTRUÇÕES PARA QUESTÕES FLASH (MEMORIZAÇÃO):
1. Questões diretas que testam definições, conceitos e classificações
2. NUNCA mencione o material, texto ou apostila nas questões
3. Enunciados curtos e diretos: "Assinale a alternativa CORRETA sobre...", "É CORRETO afirmar que..."
4. Alternativas curtas e objetivas (máx 15 palavras cada)
5. Foco em conceitos que costumam cair em prova

INSTRUÇÕES PARA AS EXPLICAÇÕES (MODO FLASH - CONCISAS):
Cada explicação deve ter:
- 1 linha explicando a resposta correta
- Regra-chave em negrito
- Dica de memorização
Formato: "✅ [razão objetiva da resposta correta]. 📌 Regra: [conceito fundamental]. 💡 Lembre-se: [mnemônico ou dica]"

Gere exatamente ${quantidadeQuestoes} questões de memorização com 5 alternativas.

Retorne APENAS JSON válido:
{
  "resumo": "Pontos-chave do assunto para memorização rápida",
  "questoes": [
    {
      "pergunta": "Enunciado direto sobre ${assunto.titulo}",
      "alternativas": ["A) texto", "B) texto", "C) texto", "D) texto", "E) texto"],
      "correta": "A) texto exato",
      "explicacao": "Explicação concisa seguindo o formato acima",
      "tipo": "simples"
    }
  ],
  "flashcards": [
    {
      "frente": "Conceito ou pergunta flash sobre ${assunto.titulo}",
      "verso": "Resposta objetiva e memorável"
    }
  ]
}`;

  const prompt = tipoQuestao === "elaborada" ? promptConcurso : promptFlash;

  try {
    const raw = await chamarGemini(prompt, 0.6);
    const json = extrairJSON(raw);
    const dados: RespostaIA = JSON.parse(json);

    if (!dados.questoes || dados.questoes.length === 0) {
      throw new Error("Nenhuma questão gerada");
    }

    return dados;
  } catch (e) {
    console.error("Erro ao gerar conteúdo:", e);

    try {
      const promptFallback = `Elabore ${quantidadeQuestoes} questões de concurso público sobre "${assunto.titulo}" no estilo ${tipoQuestao === "elaborada" ? "CESPE com situações-problema" : "memorização direta"}.
NÃO mencione material, texto ou apostila. Questões autossuficientes.
JSON válido apenas:
{"resumo":"síntese do assunto","questoes":[{"pergunta":"questão","alternativas":["A) op1","B) op2","C) op3","D) op4","E) op5"],"correta":"A) op1","explicacao":"✅ CORRETA A: motivo. ❌ B: motivo. 📌 Conceito-chave: fundamento","tipo":"${tipoQuestao}"}],"flashcards":[{"frente":"conceito","verso":"definição"}]}`;

      const raw2 = await chamarGemini(promptFallback, 0.5);
      const json2 = extrairJSON(raw2);
      const dados2: RespostaIA = JSON.parse(json2);
      if (dados2.questoes?.length > 0) return dados2;
    } catch {
      // fallback final
    }

    return { resumo: "Não foi possível gerar no momento.", questoes: [], flashcards: [] };
  }
};

// ==================== REFORÇO ====================

export const gerarReforcoParaQuestao = async (
  perguntaOriginal: string,
  assunto: string
): Promise<RespostaIA> => {
  const prompt = `Você é um professor de concursos públicos especialista em reforço de aprendizagem.

O aluno errou a seguinte questão sobre ${assunto}:
"${perguntaOriginal}"

TAREFA: Gere 3 questões de reforço sobre este mesmo conceito, abordando-o de ângulos diferentes.
NÃO mencione o texto, material ou apostila.
As questões devem reforçar especificamente o ponto onde o aluno errou.

Retorne APENAS JSON válido:
{
  "resumo": "Este ponto requer atenção. Aqui estão questões para solidificar o conceito.",
  "questoes": [
    {
      "pergunta": "Questão de reforço autossuficiente",
      "alternativas": ["A) texto", "B) texto", "C) texto", "D) texto", "E) texto"],
      "correta": "A) texto exato",
      "explicacao": "✅ CORRETA A: [razão]. ❌ B: [razão]. 📌 Conceito-chave: [fundamento]. 💡 Dica: [memorização]",
      "tipo": "elaborada"
    }
  ],
  "flashcards": [
    {
      "frente": "Conceito-chave sobre ${assunto}",
      "verso": "Definição precisa para memorizar"
    }
  ]
}`;

  try {
    const raw = await chamarGemini(prompt, 0.6);
    const json = extrairJSON(raw);
    return JSON.parse(json);
  } catch {
    return { resumo: "Erro ao gerar reforço", questoes: [], flashcards: [] };
  }
};

// ==================== FEEDBACK ====================

export const gerarFeedbackDesempenho = async (
  taxaAcerto: number,
  temasErrados: string[]
): Promise<string> => {
  const prompt = `Tutor sênior de concursos públicos. O aluno obteve ${taxaAcerto}% de acerto.
${temasErrados.length > 0 ? `Pontos fracos identificados: ${temasErrados.slice(0, 3).join(", ")}.` : "Desempenho excelente."}
Forneça feedback motivador, estratégico e específico em no máximo 2 frases. Seja direto e prático.`;

  try {
    return await chamarGemini(prompt, 0.8);
  } catch {
    return "Continue praticando! A consistência diária é o diferencial para a aprovação.";
  }
};