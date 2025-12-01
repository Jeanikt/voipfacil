# 🚀 VoipFácil - Plataforma Open Source de VoIP + IA

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green)
![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

Plataforma brasileira para integração facilitada de VoIP com IA, permitindo que desenvolvedores e PMEs automatizem comunicação telefônica com transcrição, análise de sentimento e fallback inteligente de troncos.

---

## 📋 Índice

- [Características](#-características)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação Windows](#-instalação-windows)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Planos Directcall](#-planos-directcall-integrados)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Deploy Produção](#-deploy-produção)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## ✨ Características

- ✅ **OAuth Google** - Login único sem senha
- ✅ **Fallback Automático** - 3 tentativas em troncos diferentes
- ✅ **TypeScript 100%** - Código fortemente tipado
- ✅ **Asterisk + Janus** - PBX tradicional + WebRTC
- ✅ **IA Híbrida** - Whisper + HuggingFace
- ✅ **Compliance LGPD** - Criptografia + Audit logs
- ✅ **Rate Limiting** - Proteção contra abuso
- ✅ **Monitoring** - Sentry + Health checks
- ✅ **Planos Directcall** - 19 planos integrados

---

## 🔧 Pré-requisitos

### Obrigatórios

- **Node.js 20+** - [Download](https://nodejs.org)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com/download/win)
- **Visual Studio Code** - [Download](https://code.visualstudio.com) (recomendado)

### Contas Necessárias

1. **Google Cloud Console** (OAuth)
   - Criar projeto em https://console.cloud.google.com
   - Obter Client ID e Client Secret

2. **Directcall** (Tronco SIP - opcional para dev)
   - Trial gratuito em https://directcall.com.br/trial

3. **Sentry** (Monitoramento - opcional)
   - Conta gratuita em https://sentry.io

---

## 💻 Instalação Windows

### Opção 1: Setup Automático (Recomendado)

```powershell
# 1. Clone o repositório
git clone https://github.com/Jeanikt/voipfacil.git
cd voipfacil

# 2. Execute o script de setup (PowerShell como Administrador)
.\setup-windows.ps1

# 3. Aguarde instalação completa
# O script vai:
# - Verificar dependências
# - Instalar pacotes Node
# - Subir containers Docker
# - Rodar migrations
# - Popular banco com planos Directcall
```

### Opção 2: Setup Manual

```powershell
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/voipfacil.git
cd voipfacil

# 2. Instalar dependências
npm install

# 3. Subir containers Docker
docker-compose up -d

# 4. Aguardar containers iniciarem
timeout /t 10

# 5. Configurar Prisma
npm run prisma:generate
npm run prisma:migrate

# 6. Popular banco
npm run prisma:seed
```

---

## ⚙️ Configuração

### 1. Criar arquivo .env

```bash
# Copiar exemplo
cp .env.example .env
```

### 2. Configurar Google OAuth

**Obter credenciais:**

1. Acesse https://console.cloud.google.com
2. Crie novo projeto: "VoipFácil"
3. Ative Google+ API
4. Vá em "Credenciais" → "Criar credenciais" → "ID do cliente OAuth 2.0"
5. Configure:
   - Tipo: Aplicativo da Web
   - URIs autorizados: `http://localhost:3000`
   - URIs de redirecionamento: `http://localhost:3000/api/auth/google/callback`

**Editar .env:**

```env
GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
```

### 3. Verificar Configurações

```powershell
# Verificar containers
docker ps

# Deve mostrar:
# - voipfacil-postgres
# - voipfacil-redis
# - voipfacil-adminer
# - voipfacil-redis-insight
```

---

## 🚀 Uso

### Iniciar Servidor de Desenvolvimento

```powershell
npm run dev
```

A aplicação estará rodando em:
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### Interfaces Gráficas (Opcionais)

- **PostgreSQL (Adminer)**: http://localhost:8080
  - Sistema: PostgreSQL
  - Servidor: postgres
  - Usuário: voipfacil
  - Senha: VoipF@cil2025!Dev
  - Base: voipfacil

- **Redis (RedisInsight)**: http://localhost:8001

### Testar Aplicação

```powershell
# 1. Health Check
curl http://localhost:3000/health

# 2. Login Google (abrir no navegador)
start http://localhost:3000/api/auth/google

# 3. Ver planos Directcall
curl http://localhost:3000/api/providers/recommendations
```

---

## 📡 API Endpoints

### Autenticação

```bash
GET  /api/auth/google              # Redireciona para Google OAuth
GET  /api/auth/google/callback     # Callback do Google
GET  /api/auth/me                  # Dados do usuário (requer auth)
POST /api/auth/logout              # Fazer logout
POST /api/auth/regenerate-api-key  # Gerar nova API key
```

### Troncos SIP

```bash
POST   /api/trunks           # Criar tronco
GET    /api/trunks           # Listar troncos
GET    /api/trunks/:id       # Obter tronco
PUT    /api/trunks/:id       # Atualizar tronco
DELETE /api/trunks/:id       # Deletar tronco
POST   /api/trunks/:id/test  # Testar conexão
```

**Exemplo - Criar Tronco:**

```bash
curl -X POST http://localhost:3000/api/trunks \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Meu Tronco Directcall",
    "sipUri": "sip:usuario@sip.directcall.com.br",
    "sipUsername": "usuario",
    "sipPassword": "senha123",
    "provider": "Directcall",
    "isPrimary": true,
    "maxChannels": 5
  }'
```

### Chamadas

```bash
POST /api/calls/initiate    # Iniciar chamada
GET  /api/calls             # Listar chamadas
GET  /api/calls/:id         # Obter chamada
```

**Exemplo - Iniciar Chamada:**

```bash
curl -X POST http://localhost:3000/api/calls/initiate \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5511999999999",
    "recordCall": true,
    "enableTranscription": true,
    "enableSentimentAnalysis": true
  }'
```

### Provedores

```bash
GET /api/providers/recommendations  # Listar planos Directcall
```

**Filtros disponíveis:**

```bash
# Por preço máximo
GET /api/providers/recommendations?maxPrice=100

# Por canais mínimos
GET /api/providers/recommendations?minChannels=10

# Ordenar por rating
GET /api/providers/recommendations?sortBy=rating
```

---

## 📊 Planos Directcall Integrados

A plataforma vem pré-configurada com **19 planos** da Directcall:

### Portabilidade e Números Virtuais
- Portabilidade Telefônica
- Número Fixo Virtual (DID)

### SIP Trunk
- SIP Trunk Ilimitado (R$ 60,16/mês)
- SIP Trunk Atacado

### 0800
- 0800 IP Ilimitado (R$ 220,72/mês)
- 0800 IP Atacado

### PBX e Callcenter
- 3CX PBX IP na Nuvem (R$ 99,80/mês)
- 3CX PBX IP Hospedado

### Features Avançadas
- URA Avançada + Auditoria
- Gravação de Chamadas (5 anos)
- Chamada Verificada (Stir/Shaken)

### Integrações
- Microsoft Teams
- APIs de Voz, IA e SMS
- Click to Call
- Form to Call

### Outros
- Número Único Nacional (NUN)
- Número para WhatsApp

**Ver todos**: http://localhost:3000/api/providers/recommendations

---

## 📁 Estrutura do Projeto

```
voipfacil/
├── src/
│   ├── config/          # Configurações (env, db, logger, redis, passport)
│   ├── models/          # Schemas Zod para validação
│   ├── controllers/     # Controllers (auth, trunk, call, provider)
│   ├── services/        # Lógica de negócio + integrações
│   ├── middlewares/     # Auth, validação, rate-limit, errors
│   ├── routes/          # Rotas Express
│   ├── types/           # TypeScript types
│   ├── utils/           # Funções utilitárias
│   └── app.ts           # Aplicação Express principal
├── prisma/
│   ├── schema.prisma    # Schema do banco
│   └── seed.ts          # Seed com planos Directcall
├── tests/
│   ├── unit/            # Testes unitários
│   └── integration/     # Testes de integração
├── logs/                # Logs da aplicação
├── docker-compose.yml   # Containers Docker
├── package.json
├── tsconfig.json
└── .env
```

---

## 🚀 Deploy Produção

### Pré-requisitos VPS

- Ubuntu 22.04 LTS
- 4GB RAM mínimo
- Node.js 20+
- Docker + Docker Compose
- Asterisk 20
- Janus Gateway

### Deploy Automático

```bash
# Na VPS
cd /var/www/voipfacil
bash scripts/deploy.sh
```

**O script vai:**
1. Instalar dependências
2. Compilar TypeScript
3. Rodar migrations
4. Popular banco
5. Reiniciar aplicação (PM2)

### Configurar Nginx

```nginx
server {
    listen 80;
    server_name voipfacil.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL (Let's Encrypt)

```bash
certbot --nginx -d voipfacil.com.br
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

---

## 📝 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

## 🙋‍♂️ Suporte

- **Issues**: [GitHub Issues](https://github.com/SEU_USUARIO/voipfacil/issues)
- **Email**: suporte@voipfacil.com.br
- **Discord**: [Comunidade VoipFácil](https://discord.gg/voipfacil)

---

## 🔗 Links Úteis

- **Directcall**: https://directcall.com.br
- **Documentação Asterisk**: https://docs.asterisk.org
- **Janus Gateway**: https://janus.conf.meetecho.com
- **Prisma**: https://www.prisma.io/docs

---

**Feito com ❤️ no Brasil 🇧🇷**