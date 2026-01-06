# Diagnóstico - Erro de Sincronização Firebase

## Problema Relatado

A aplicação mostra uma mensagem inicial de "Erro de Sincronização" mas depois permite acesso, ficando com o estado "Offline".

## O que foi implementado

### 1. **Sistema de Retry Automático**

- A app tenta reconectar ao Firebase automaticamente até 5 vezes
- Usa exponential backoff: 1s, 2s, 4s, 8s, 16s (máximo 30s entre tentativas)
- Logs detalhados com `[Firebase]` prefix mostram cada etapa

### 2. **Indicador de Status Melhorado**

- Barra no topo mostra "Offline" quando desconectado
- Indicador é clicável - clique para tentar reconectar manualmente
- Cores: 🟢 Verde = Sincronizado, 🟡 Amarelo = Sincronizando, 🟠 Laranja = Offline

### 3. **Painel de Debug**

- Clique no ícone `Terminal` no canto superior direito para abrir o painel de debug
- Mostra estado atual da aplicação
- Aconselha abrir F12 para ver logs detalhados

### 4. **Logs Detalhados do Firebase**

Abra o browser console (F12) e procure por logs com `[Firebase]`:

```
[Firebase] Initializing...
[Firebase] Initializing app with project: gcc-scheduler-3ef7f
[Firebase] Signing in anonymously...
[Firebase] Anonymous auth successful
[Firebase] Setting up listener for: artifacts/gcc-scheduler/public/data/shift_scheduler/global_state
[Firebase] Document found. Loading data...
[Firebase] Data loaded successfully
```

## Como Diagnosticar o Problema

### Passo 1: Abrir Console do Browser (F12)

```
F12 → Console → Procurar por [Firebase]
```

### Passo 2: Identifique a Mensagem de Erro

**Se vir:**

```
[Firebase] Read Error: {
  code: "permission-denied",
  message: "Missing or insufficient permissions..."
}
```

**Solução:** Verificar regras de segurança do Firestore no Firebase Console

**Se vir:**

```
[Firebase] Initialization error: {
  code: "app/invalid-api-key",
  message: "..."
}
```

**Solução:** Verificar se a API Key no .env é válida

**Se vir:**

```
[Firebase] Auth Error: ...
```

**Solução:** Verificar se Firestore está habilitado no projeto Firebase

### Passo 3: Verificar Arquivo .env

```bash
cat .env
```

Confirme que todas as variáveis estão presentes:

- ✅ VITE_FIREBASE_API_KEY
- ✅ VITE_FIREBASE_AUTH_DOMAIN
- ✅ VITE_FIREBASE_PROJECT_ID
- ✅ VITE_FIREBASE_STORAGE_BUCKET
- ✅ VITE_FIREBASE_MESSAGING_SENDER_ID
- ✅ VITE_FIREBASE_APP_ID
- ✅ VITE_APP_ID

### Passo 4: Testar Manualmente

```bash
node debug.js
```

Confirme que todas as variáveis têm ✓:

```
VITE_FIREBASE_API_KEY: ✓ AIzaSyAlUxQju1Tccv1X...
VITE_FIREBASE_PROJECT_ID: ✓ gcc-scheduler-3ef7f
```

## Comportamento Esperado

### Cenário 1: Firebase Disponível ✅

1. App carrega com `🟢 Saved`
2. Dados do Cloud aparecem normalmente
3. Alterações sincronizam em tempo real

### Cenário 2: Firebase Indisponível 🟠

1. App tenta conectar
2. Após 1-2s, faz retry automático
3. Se continuar falhando, muda para `🟠 Offline`
4. **Importante:** App **continua funcionando** com dados locais
5. Alterações são salvas no navegador (localStorage)
6. Quando Firebase voltar online, sincroniza automaticamente

### Cenário 3: Erro Crítico ❌

1. App mostra tela vermelha com "Erro Crítico"
2. **Raramente ocorre** pois fallback para offline é automático
3. Clique "Tentar Novamente" para recarregar a página

## Verificação no Firebase Console

1. Abra https://console.firebase.google.com
2. Selecione projeto `gcc-scheduler-3ef7f`
3. Firestore Database:

   - Confirme que está **ativado**
   - Vá para Security Rules
   - Deve permitir leitura/escrita para usuários anônimos

4. Estrutura esperada:

```
artifacts/
  └─ gcc-scheduler/
     └─ public/
        └─ data/
           └─ shift_scheduler/
              └─ global_state  (documento)
```

## Resolução Rápida

Se o problema persistir:

1. **Clear Cache**

   ```
   Ctrl+Shift+Delete → Limpar dados de navegação → Todos os tempos
   ```

2. **Restart Dev Server**

   ```
   Ctrl+C no terminal
   npm run dev
   ```

3. **Verificar Conectividade**

   - Ping google.com
   - Verificar firewall/proxy

4. **Contactar Firebase Support**
   - Se aparecer erro `permission-denied` ou `unavailable`

## Status Atual (Git Commit)

Todas as melhorias foram implementadas:

- ✅ Retry automático com exponential backoff
- ✅ Logging detalhado com prefixo `[Firebase]`
- ✅ Indicador de status clicável para reconectar
- ✅ Painel de debug para diagnosticar rapidamente
- ✅ Fallback para offline mode automático
- ✅ Sincronização offline com localStorage

**Próximos passos:** Se o erro continuar, check Firebase Console rules e credentials.
