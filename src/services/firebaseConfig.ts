// Configuração do Firebase
// As variáveis de ambiente devem ser definidas no arquivo .env na raiz do projeto.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Inicializa a IA pelo Firebase (GoogleAIBackend roteia via Firebase,
// sem expor a chave diretamente ao cliente — mesmo padrão do sistema de editais)
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Modelo pré-configurado — importe este nas services, nunca instancie getGenerativeModel() de novo
export const geminiModel = getGenerativeModel(ai, {
  model: "gemini-2.5-flash-lite", // mesmo modelo usado no sistema de editais
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 8192,
  },
});

export default app;