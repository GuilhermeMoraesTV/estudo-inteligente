import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDk8JiuSDkRuQQh-mLt280DP09UmlZiEaA",
  authDomain: "studyagente.firebaseapp.com",
  projectId: "studyagente",
  storageBucket: "studyagente.firebasestorage.app",
  messagingSenderId: "714555050121",
  appId: "1:714555050121:web:8944aed9f6a29c9ec9de58"
};

const app = initializeApp(firebaseConfig, "teste");
const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-2.0-flash-lite" });

async function teste() {
  try {
    const result = await model.generateContent("Diga apenas: funcionou");
    console.log("✅ SUCESSO:", result.response.text());
  } catch (e) {
    console.error("❌ ERRO COMPLETO:", JSON.stringify(e, null, 2));
  }
}

teste();