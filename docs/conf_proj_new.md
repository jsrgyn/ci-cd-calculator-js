### **Guia de Configuração de Novo Projeto na Stack DevOps**  
**Documentação: `conf_proj_new.md`**  

---

#### **1. Pré-requisitos**  
- **Ambiente DevOps Funcional**:  
  - Drone, Gitea, SonarQube, PostgreSQL, Nginx e `build-server-node` operacionais.  
  - Rede Docker `devops-network` configurada (`172.20.0.0/16`).  
- **Acesso Administrativo**:  
  - Gitea (criação de repositórios, tokens).  
  - Drone (gerenciamento de repositórios, secrets).  
  - SonarQube (criação de projetos, tokens).  
- **Chaves SSH**:  
  - Par de chaves SSH (pública/privada) para comunicação entre Drone e `build-server-node`.  

---

#### **2. Passo a Passo para Configuração do Novo Projeto**  

##### **2.1. Configurar Repositório no Gitea**  
1. **Criar Repositório**:  
   - Acesse `http://gitea.local` (via Nginx).  
   - Crie um novo repositório (ex: `meu-projeto`).  
   - Habilitar **Webhooks** (configuração automática via Drone posteriormente).  

2. **Gerar Token de Acesso**:  
   - Em `Settings > Applications`, gere um token com escopo `repo, admin:repo_hook`.  
   - Guarde o token (será usado no Drone).  

---

##### **2.2. Configurar Projeto no SonarQube**  
1. **Criar Projeto**:  
   - Acesse `http://sonar.local`.  
   - Vá para `Projects > Create` (ex: `meu-projeto`).  
   - Anote a **Project Key** (ex: `meu_projeto_key`).  

2. **Gerar Token de Usuário**:  
   - Em `User > My Account > Security`, gere um token (ex: `sonar_token_meu_projeto`).  
   - Guarde o token (será usado no Drone).  

---

##### **2.3. Configurar Secrets no Drone**  
1. **Habilitar Repositório no Drone**:  
   - Acesse `http://drone.local`.  
   - Ative o repositório `meu-projeto` (sincronizado via Gitea).  

2. **Adicionar Secrets**:  
   | Nome do Secret | Valor | Descrição |  
   |----------------|-------|-----------|  
   | `BUILD_SERVER_SSH_KEY` | Chave SSH **privada** | Acesso ao `build-server-node`. |  
   | `SONAR_TOKEN` | Token do SonarQube | Autenticação no SonarQube. |  
   | `SONAR_HOST_URL` | `http://sonarqube:9000` | URL interna do SonarQube. |  

---

##### **2.4. Preparar Build-Server-Node**  
1. **Configurar PM2 (Opcional)**:  
   - Se usar PM2 para deploy, crie os arquivos de configuração:  
     - `ecosystem.config.js` (exemplo abaixo).  
   ```javascript
   module.exports = {
     apps: [{
       name: 'meu-projeto-homolog',
       script: 'src/index.js',
       env: { NODE_ENV: 'homolog' }
     }, {
       name: 'meu-projeto-prod',
       script: 'src/index.js',
       env: { NODE_ENV: 'production' }
     }]
   };
   ```

2. **Liberar Portas (Se Necessário)**:  
   - Garanta que a porta da aplicação (ex: `3000`) está liberada no `build-server-node`.  

---

##### **2.5. Configurar Pipeline (.drone.yml)**  
1. **Personalizar o Pipeline**:  
   - Adapte o `.drone.yml` do projeto (exemplo base fornecido).  
   - Ajuste os passos conforme o projeto:  
     ```yaml
     steps:
       - name: Setup do Projeto
         commands:
           - npm ci
           - mkdir -p reports coverage

       - name: Testes Unitários
         commands:
           - npm run test -- --coverage
     ```

2. **Definir Triggers**:  
   - Especifique branches/tags para deploy:  
     ```yaml
     when:
       event: 
         - push
         - tag
       branch:
         - main  # Deploy em homologação
     ```

---

##### **2.6. Configurar Proxy Reverso (Nginx)**  
1. **Adicionar Novo Virtual Host**:  
   - Crie um arquivo em `./config/nginx/conf.d/meu-projeto.conf`:  
     ```nginx
     server {
       listen 80;
       server_name meu-projeto.local;

       location / {
         proxy_pass http://build-server-node:8000;  # Porta da aplicação
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
       }
     }
     ```

2. **Recarregar Nginx**:  
   ```bash
   docker exec nginx nginx -s reload
   ```

---

##### **2.7. Inicializar Projeto via Git**  
1. **Primeiro Push**:  
   ```bash
   git clone http://gitea.local/<user>/meu-projeto.git
   cd meu-projeto
   echo "# Meu Projeto" > README.md
   git add .drone.yml README.md
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Verificar Pipeline**:  
   - Acesse `http://drone.local` e monitore a execução.  

---

#### **3. Validação Pós-Configuração**  
| Componente | Como Validar |  
|------------|--------------|  
| **Pipeline** | Build bem-sucedido no Drone. |  
| **SonarQube** | Análise de código disponível em `http://sonar.local`. |  
| **Deploy** | Aplicação acessível via `http://meu-projeto.local`. |  
| **Logs** | Verifique logs no `build-server-node` via PM2: `pm2 logs`. |  

---

#### **4. Solução de Problemas Comuns**  
- **Falha no SSH**:  
  - Verifique se a chave pública está em `./secrets/ssh/id_rsa.pub` do `build-server-node`.  
- **Quality Gate Bloqueia Pipeline**:  
  - Ajuste as regras no SonarQube ou corrija issues no código.  
- **Deploy Não Inicia**:  
  - Valide as condições `when` no `.drone.yml`.  

---

#### **5. Boas Práticas Recomendadas**  
- **Secrets**: Nunca armazene tokens ou chaves em repositórios.  
- **Variáveis de Ambiente**: Use `.env` no build-server para configurações sensíveis.  
- **Tags Semânticas**: Use `v1.0.0` para deploys em produção.  
- **Healthchecks**: Adicione endpoints `/health` para monitoramento.  

> ✅ **Documentação Atualizada**: 2025-08-08  
> 🔄 **Revisão Técnica**: Semestral  

--- 

**Notas Finais**:  
- Este guia assume que a stack DevOps está configurada conforme o `docker-compose.yml`.  
- Adapte nomes de projetos, URLs e ports conforme necessário.  
- Em caso de dúvidas, consulte a documentação oficial de cada serviço.