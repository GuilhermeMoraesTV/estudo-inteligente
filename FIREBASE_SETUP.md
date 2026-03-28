# Configuração do Firebase — Guia Passo a Passo

Este guia detalha como criar e configurar o projeto no Firebase para o **StudyAgent**.

---

## 1. Criar o Projeto no Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Clique em **"Adicionar projeto"**.
3. Dê um nome ao projeto (ex: `studyagent`).
4. Desative o Google Analytics (não é necessário) ou mantenha ativado se preferir.
5. Clique em **"Criar projeto"** e aguarde a criação.

---

## 2. Registrar o App Web

1. Na página inicial do projeto, clique no ícone **Web** (`</>`).
2. Dê um apelido ao app (ex: `StudyAgent Web`).
3. **Não** marque "Configurar Firebase Hosting" (usaremos deploy separado).
4. Clique em **"Registrar app"**.
5. Copie as configurações que aparecerão. Você precisará dos seguintes valores:

```
apiKey: "AIza..."
authDomain: "seu-projeto.firebaseapp.com"
projectId: "seu-projeto"
storageBucket: "seu-projeto.appspot.com"
messagingSenderId: "123456789"
appId: "1:123456789:web:abc123"
```

---

## 3. Ativar o Firebase Authentication

1. No menu lateral, vá em **Build → Authentication**.
2. Clique em **"Começar"**.
3. Na aba **"Sign-in method"**, ative o provedor **"E-mail/senha"**.
4. Clique em **"Salvar"**.

---

## 4. Ativar o Cloud Firestore

1. No menu lateral, vá em **Build → Firestore Database**.
2. Clique em **"Criar banco de dados"**.
3. Selecione **"Iniciar no modo de produção"**.
4. Escolha a localização mais próxima dos seus usuários (ex: `southamerica-east1` para Brasil).
5. Clique em **"Ativar"**.

---

## 5. Configurar as Regras de Segurança do Firestore

Após criar o banco, vá na aba **"Regras"** e substitua o conteúdo por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Perfil do usuário: apenas o próprio pode ler/escrever
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Materiais: apenas o dono pode ler/escrever
    match /materiais/{docId} {
      allow read, write: if request.auth != null 
        && resource == null 
        || resource.data.userId == request.auth.uid;
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid;
    }
    
    // Questões: apenas o dono pode ler/escrever
    match /questoes/{docId} {
      allow read: if request.auth != null 
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid;
    }
    
    // Flashcards: apenas o dono pode ler/escrever/atualizar
    match /flashcards/{docId} {
      allow read, update: if request.auth != null 
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid;
    }
    
    // Histórico de respostas: apenas o dono pode ler/escrever
    match /historico_respostas/{docId} {
      allow read: if request.auth != null 
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

Clique em **"Publicar"**.

---

## 6. Criar os Índices Compostos

O Firestore pode pedir índices compostos quando consultas com `where` + `orderBy` forem executadas. Caso apareça um erro no console do navegador com um link para criar o índice, basta clicar nele.

Os índices necessários são:

| Coleção | Campos | Tipo |
|---------|--------|------|
| `materiais` | `userId` (Asc) + `criadoEm` (Desc) | Composto |
| `historico_respostas` | `userId` (Asc) + `criadoEm` (Desc) | Composto |
| `flashcards` | `userId` (Asc) + `proximaRevisao` (Asc) | Composto |

Para criar manualmente:
1. Vá em **Firestore → Índices**.
2. Clique em **"Criar índice"**.
3. Preencha os campos conforme a tabela acima.

---

## 7. Obter a API Key do Google Gemini

1. Acesse o [Google AI Studio](https://aistudio.google.com/).
2. Clique em **"Get API Key"**.
3. Crie uma nova chave ou use uma existente.
4. Copie a chave gerada.

---

## 8. Configurar o Arquivo `.env`

Na raiz do projeto, crie um arquivo chamado `.env` com o seguinte conteúdo (substitua pelos seus valores):

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXX
```

> ⚠️ **IMPORTANTE:** Nunca commite o arquivo `.env` no repositório. Ele já está no `.gitignore`.

---

## 9. Testar a Configuração

1. Inicie o servidor: `npm run dev`
2. Acesse `http://localhost:5173`
3. Crie uma conta na tela de cadastro
4. Verifique no Console do Firebase → Authentication se o usuário apareceu
5. Envie um texto de estudo e verifique se as coleções são criadas no Firestore

---

## Problemas Comuns

| Problema | Solução |
|----------|---------|
| "Firebase App not initialized" | Verifique se as variáveis no `.env` estão corretas |
| "Permission denied" no Firestore | Verifique as regras de segurança (seção 5) |
| Erro ao gerar conteúdo com IA | Verifique se a `VITE_GEMINI_API_KEY` está correta |
| Índice composto necessário | Clique no link de erro no console para criar automaticamente |
