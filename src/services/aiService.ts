// Serviço centralizado para chamadas à API da IA via Firebase.
// Suporta busca na web para textos curtos e análise de assuntos.
//
// IMPORTANTE: Não instancie getGenerativeModel() aqui.
// Importe sempre `geminiModel` do firebaseConfig — ele já usa GoogleAIBackend,
// que roteia as chamadas pelo próprio Firebase sem expor a chave API ao cliente.

import { geminiModel } from "./firebaseConfig";

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

/**
 * Limpa a resposta da IA e garante que seja um JSON válido.
 */
function extrairJSON(texto: string): string {
  try {
    let limpo = texto.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const inicioObj = limpo.indexOf("{");
    const fimObj = limpo.lastIndexOf("}");
    if (inicioObj !== -1 && fimObj !== -1) {
      return limpo.substring(inicioObj, fimObj + 1);
    }
    return limpo;
  } catch (e) {
    return texto;
  }
}

/**
 * Mapeia assuntos de um texto/arquivo e gera título geral.
 */
export const mapearAssuntos = async (
  texto: string,
  nomeArquivo?: string
): Promise<RespostaMapaAssuntos> => {
  const prompt = `Você é um especialista em concursos públicos brasileiros. Analise o texto abaixo e identifique os assuntos/tópicos principais.

${nomeArquivo ? `Nome do arquivo: ${nomeArquivo}` : ""}

TAREFA:
1. Gere um título geral que represente o material (ex: "Direito Administrativo", "Matemática Financeira")
2. Identifique de 1 a 5 assuntos/tópicos distintos no texto
3. Para cada assunto, extraia um trecho relevante do texto original

Retorne APENAS este JSON (sem markdown, sem explicações):
{
  "tituloGeral": "Título geral do material",
  "assuntos": [
    {
      "id": "assunto_1",
      "titulo": "Nome do assunto/tópico",
      "descricao": "Breve descrição do que será estudado",
      "trecho": "Trecho do texto original relacionado a este assunto (mínimo 200 caracteres)"
    }
  ]
}

TEXTO:
${texto.substring(0, 6000)}`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const raw = result.response.text();
    const json = extrairJSON(raw);
    const dados: RespostaMapaAssuntos = JSON.parse(json);

    if (!dados.tituloGeral || !Array.isArray(dados.assuntos) || dados.assuntos.length === 0) {
      throw new Error("Estrutura inválida");
    }

    return dados;
  } catch (e) {
    console.error("Erro no mapeamento da IA:", e);
    return {
      tituloGeral:
        nomeArquivo?.replace(/\.(pdf|txt|docx?)$/i, "") || "Material de Estudo",
      assuntos: [
        {
          id: "assunto_1",
          titulo:
            nomeArquivo?.replace(/\.(pdf|txt|docx?)$/i, "") || "Conteúdo Principal",
          descricao: "Conteúdo do material enviado",
          trecho: texto.substring(0, 3000),
        },
      ],
    };
  }
};

/**
 * Gera questões e flashcards para um assunto específico.
 * Se o texto for curto, usa conhecimento interno da IA sobre o assunto.
 */
export const gerarConteudoParaAssunto = async (
  assunto: Assunto,
  tipoQuestao: "simples" | "elaborada" = "elaborada",
  quantidadeQuestoes = 5
): Promise<RespostaIA> => {
  const textoBase = assunto.trecho.trim();
  const usarConhecimentoIA = textoBase.length < 200;

  const instrucaoTipo =
    tipoQuestao === "simples"
      ? "Gere questões SIMPLES de memorização (verdadeiro/falso em formato múltipla escolha, definições diretas, conceitos básicos). As alternativas devem ser curtas e objetivas."
      : "Gere questões ELABORADAS no estilo CESPE/FCC/VUNESP (situações-problema, interpretação, aplicação de conceitos, pegadinhas técnicas). As alternativas devem ser completas e desafiadoras.";

  const fonteDados = usarConhecimentoIA
    ? `Use seu conhecimento sobre o assunto "${assunto.titulo}" para gerar questões de concurso público.`
    : `Base de estudo:\n${textoBase.substring(0, 4000)}`;

  const prompt = `Você é professor especialista em concursos públicos brasileiros.

ASSUNTO: ${assunto.titulo}
TIPO: ${tipoQuestao === "simples" ? "Flash Cards de Memorização" : "Questões Elaboradas de Concurso"}

${fonteDados}

${instrucaoTipo}

Gere exatamente ${quantidadeQuestoes} questões de múltipla escolha (5 alternativas A, B, C, D, E) e 5 flashcards.

Retorne APENAS este JSON válido (sem markdown):
{
  "resumo": "Resumo dos principais pontos do assunto em 2-3 frases",
  "questoes": [
    {
      "pergunta": "Enunciado da questão",
      "alternativas": ["A) texto", "B) texto", "C) texto", "D) texto", "E) texto"],
      "correta": "A) texto exato da alternativa correta",
      "explicacao": "Justificativa detalhada da resposta correta",
      "tipo": "${tipoQuestao}"
    }
  ],
  "flashcards": [
    {
      "frente": "Conceito ou pergunta curta",
      "verso": "Resposta objetiva"
    }
  ]
}`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const raw = result.response.text();
    const json = extrairJSON(raw);
    const dados: RespostaIA = JSON.parse(json);

    if (!dados.questoes || dados.questoes.length === 0) {
      throw new Error("Nenhuma questão gerada");
    }

    return dados;
  } catch (e) {
    console.error("Erro ao gerar conteúdo:", e);
    return { resumo: "Não foi possível gerar no momento.", questoes: [], flashcards: [] };
  }
};

/**
 * Gera questões e flashcards extras para reforço (questões erradas).
 */
export const gerarReforcoParaQuestao = async (
  perguntaOriginal: string,
  assunto: string
): Promise<RespostaIA> => {
  const prompt = `Você é professor de concursos públicos. O aluno errou a seguinte questão:

"${perguntaOriginal}"

Assunto: ${assunto}

Gere 3 questões adicionais sobre este mesmo tema para reforçar o aprendizado, e 3 flashcards de memorização.

Retorne APENAS este JSON (sem markdown):
{
  "resumo": "Este assunto requer atenção especial. Veja mais questões para fixar o conteúdo.",
  "questoes": [
    {
      "pergunta": "Questão de reforço",
      "alternativas": ["A) texto", "B) texto", "C) texto", "D) texto", "E) texto"],
      "correta": "A) texto exato",
      "explicacao": "Explicação detalhada",
      "tipo": "elaborada"
    }
  ],
  "flashcards": [
    {
      "frente": "Conceito-chave",
      "verso": "Definição objetiva"
    }
  ]
}`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const raw = result.response.text();
    const json = extrairJSON(raw);
    return JSON.parse(json);
  } catch {
    return { resumo: "Erro de reforço", questoes: [], flashcards: [] };
  }
};

/**
 * Gera feedback personalizado de desempenho.
 */
export const gerarFeedbackDesempenho = async (
  taxaAcerto: number,
  temasErrados: string[]
): Promise<string> => {
  const prompt = `Tutor de concursos públicos. O aluno teve ${taxaAcerto}% de acerto.
${temasErrados.length > 0 ? `Errou em: ${temasErrados.slice(0, 3).join(", ")}.` : "Acertou tudo."}
Feedback breve, motivador e estratégico (máximo 2 frases). Seja direto.`;

  try {
    const result = await geminiModel.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return "Continue praticando! A consistência é a chave para a aprovação.";
  }
};