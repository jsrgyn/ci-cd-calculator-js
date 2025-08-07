# 📘 Manual de CI/CD com Gitea, Drone CI e SonarQube

## ✨ Visão Geral

Este manual define o padrão de configuração e boas práticas para o pipeline de **Integração Contínua (CI)** e **Entrega Contínua (CD)** com as ferramentas **Gitea**, **Drone CI** e **SonarQube**. O processo foi projetado para garantir segurança, rastreabilidade, qualidade contínua de software e um fluxo robusto de desenvolvimento, homologação e produção.

> **Conceito-chave:** _**Gated Check-in**_ — Nenhuma alteração entra na `main` sem passar por validações automáticas (CI) e revisão humana (Code Review). O deploy em produção é condicionado à criação de tags, garantindo versões estáveis e validadas.

---

## ⚙️ Parte 1: Gitea – Configuração e Controle de Acesso

### 👤 Gestão de Usuários e Permissões

- **Administrador:**
  - Gerencia a instância Gitea, cria repositórios e define proteções.
- **Desenvolvedor:**
  - Pode criar branches, pushar código e abrir Pull Requests (PRs).
  - Deve receber apenas permissão de **escrita** (`write`) no repositório.
- **Release Manager:**
  - Responsável por criar releases (tags) no Gitea para disparar deploys em produção.

> 🚫 **Nunca conceda permissão de administrador aos desenvolvedores.**

---

### 🔐 Proteção da Branch `main`

A branch `main` é protegida para garantir estabilidade e qualidade.

| Campo                                      | Valor               | Justificativa                                                                 |
|-------------------------------------------|---------------------|-------------------------------------------------------------------------------|
| Nome da Branch Protegida                  | `main`              | Protege a principal linha de desenvolvimento.                                |
| Push Direto                               | **Desabilitado**    | Evita código não revisado/validado.                                          |
| Aprovação de PR                           | `1+`                | Aplicação do princípio dos 4 olhos.                                          |
| Descartar Aprovações Antigas              | **Habilitado**      | Garante nova revisão a cada mudança.                                         |
| Status Checks Obrigatórios                | Drone + SonarQube   | Bloqueia merge se build ou análise falhar.                                  |
| Impedir Merge com Branch desatualizada    | **Habilitado**      | Força rebase ou merge da `main` atualizada antes do merge final.            |

---

## 🧪 Parte 2: Pipeline de Automação com Drone CI

### 📄 `.drone.yml` Padrão e Seguro

```yaml
kind: pipeline
type: ssh
name: CI + push + Deploy Homologação

trigger:
  event:
    - push
    - pull_request
    - tag

server:
  host: build-server-node
  user: root
  ssh_key:
    from_secret: BUILD_SERVER_SSH_KEY

steps:
  - name: Setup do Projeto
    commands:
      - npm ci
      - mkdir -p reports coverage

  - name: Verificação de Lint
    commands:
      - npm run lint:report

  - name: Testes Unitários com Cobertura
    commands:
      - npm test -- --coverage

  - name: Análise e Validação do SonarQube
    environment:
      SONAR_TOKEN:
        from_secret: SONAR_TOKEN
      SONAR_HOST_URL:
        from_secret: SONAR_HOST_URL
    commands:
      - set -e
      - npx sonar-scanner -Dsonar.token=$SONAR_TOKEN -Dsonar.host.url=$SONAR_HOST_URL
    when:
      event:
        - push
        - pull_request
        - tag

  - name: Validar Quality Gate
    environment:
      SONAR_TOKEN:
        from_secret: SONAR_TOKEN
      SONAR_HOST_URL:
        from_secret: SONAR_HOST_URL
    commands:
      - set -e
      - |
        echo "Aguardando processamento da análise no SonarQube..."
        sleep 10
        taskId=$(curl -s -u "$SONAR_TOKEN:" "$SONAR_HOST_URL/api/project_analyses/search?project=calculadora-api" | jq -r '.current.component.analysisId')
        echo "Último taskId: $taskId"
        status=""
        tentativas=0
        while [ "$status" != "SUCCESS" ] && [ $tentativas -lt 10 ]; do
          sleep 5
          status=$(curl -s -u "$SONAR_TOKEN:" "$SONAR_HOST_URL/api/ce/task?id=$taskId" | jq -r '.task.status')
          echo "Status: $status"
          tentativas=$((tentativas+1))
        done
        qualityStatus=$(curl -s -u "$SONAR_TOKEN:" "$SONAR_HOST_URL/api/qualitygates/project_status?projectKey=calculadora-api" | jq -r '.projectStatus.status')
        echo "Resultado do Quality Gate: $qualityStatus"
        if [ "$qualityStatus" != "OK" ]; then
          echo "❌ Quality Gate falhou. Bloqueando deploy."
          exit 1
        else
          echo "✅ Quality Gate aprovado. Continuando pipeline."
        fi
    when:
      event:
        - push
        - pull_request
        - tag

  - name: Deploy em Homologação
    commands:
      - set -e
      - echo ">>> Iniciando deploy para o ambiente de HOMOLOGAÇÃO..."
      - pm2 stop calculadora-api-homolog || true
      - pm2 delete calculadora-api-homolog || true
      - pm2 start src/index.js --name calculadora-api-homolog
      - echo ">>> Deploy em Homologação concluído."
    when:
      event:
        - push
      branch:
        - main

  - name: Deploy em Produção
    commands:
      - set -e
      - echo "🚀🚀🚀 INICIANDO DEPLOY PARA O AMBIENTE DE PRODUÇÃO 🚀🚀🚀"
      - pm2 stop calculadora-api-prod || true
      - pm2 delete calculadora-api-prod || true
      - pm2 start src/index.js --name calculadora-api-prod
      - echo "✅ Deploy em Produção concluído com sucesso."
    when:
      event:
        - tag
```

> ✅ **Correção Aplicada:** O pipeline agora suporta eventos de `tag` para deploy em produção, mantendo a lógica de deploy em homologação apenas para pushes na `main`.

---

## 🔁 Parte 3: Fluxo de Trabalho para Desenvolvedores e Release Managers

1. **Criar branch de feature:**

```bash
git checkout main
git pull origin main
git checkout -b feature/TASK-123-nova-calculo
```

2. **Desenvolver e versionar:**

```bash
git add .
git commit -m "feat: TASK-123 implementa nova lógica de cálculo"
git push origin feature/TASK-123-nova-calculo
```

3. **Abrir Pull Request no Gitea:**
   - Base: `main`
   - Compare: `feature/...`
   - Preencha título e descrição clara, seguindo o padrão **Conventional Commits**.

4. **Validação automática (CI):**
   - Lint, testes unitários e análise do SonarQube são executados.
   - Se algo falhar, as verificações no PR indicam erro e bloqueiam o merge.

5. **Revisão e aprovação do PR:**
   - Um colega revisa e aprova o código, garantindo o princípio dos 4 olhos.

6. **Merge autorizado:**
   - Após todas as verificações e aprovação, o botão de merge será habilitado.

7. **Deploy e validação em homologação:**
   - O Drone é disparado pelo push na `main`.
   - Executa o pipeline e realiza o deploy com `pm2` no ambiente de homologação.
   - A equipe realiza testes manuais e de aceitação no ambiente de homologação.

8. **Criar release de produção (ação do Release Manager):**
   - Com a versão em homologação aprovada, navegue até a aba **Versões (Releases)** no Gitea.
   - Clique em **Nova Versão**.
   - Defina a **Tag** (ex: `v1.2.0`), o **Destino** (`main`), o **Título** e a **Descrição** das mudanças.
   - Clique em **Publicar Versão**.

9. **Deploy automático em produção:**
   - O Drone detecta a nova tag e inicia o pipeline.
   - Executa todas as validações novamente (testes, lint, SonarQube) como uma última verificação de sanidade.
   - O passo **Deploy em Produção** é executado, atualizando a aplicação no ambiente de produção.

---

## 🚀 Parte 4: Deploy em Produção com Tags

O deploy em produção é um processo controlado, disparado manualmente pela criação de uma release (tag) no Gitea. Isso garante que apenas versões estáveis e validadas em homologação cheguem aos usuários finais.

- **Gatilho:** Criação de uma tag Git (ex: `v1.0.0`) no último commit da `main`.
- **Boas práticas para tags:**
  - Use versionamento semântico (`vX.Y.Z`, onde `X` é versão maior, `Y` é versão menor, `Z` é patch).
  - Inclua notas de release detalhando mudanças, correções e melhorias.
  - Valide a estabilidade em homologação antes de criar a tag.

> 🔒 **Segurança:** O deploy em produção só ocorre após validações completas no pipeline, incluindo Quality Gate do SonarQube.

---

## 💡 Parte 5: Boas Práticas e Convenções

### 🛠️ Padrão de Desenvolvimento e Commits

> 🔗 Adotar o padrão **[Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/)** é essencial para manter um histórico claro, facilitar automações (como geração de changelogs) e promover organização. A convenção inclui:

### Tipos Comuns

- `feat:` para **novas funcionalidades**
- `fix:` para **correções de bugs**
- `docs:` para **atualizações de documentação**
- `style:` para **formatação de código** (espaços, ponto e vírgula, etc)
- `refactor:` para **refatorações que não alteram comportamento**
- `test:` para **adição ou modificação de testes**
- `chore:` para **tarefas de manutenção** (builds, configs, dependências, etc)

- **Estrutura do Commit:**
  - `<tipo>(<escopo>): <descrição curta>` (ex: `feat(calculadora): adiciona função de soma`).
  - Use tipos comuns: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
  - Inclua o ID da tarefa (ex: `TASK-123`) para rastreabilidade.


- **Exemplo de Commits:**

```bash

feat: TASK-123 implementa nova lógica de cálculo
fix: TASK-124 corrige erro de divisão por zero
docs: atualiza documentação do README
chore: atualiza dependências do npm

```


- **Boas práticas:**
  - **Commits atômicos:** Cada commit deve representar uma única mudança lógica.
  - **Mensagens claras e concisas:** Evite mensagens genéricas como "atualização" ou "correção".
  - **Rebase frequente:** Mantenha a branch de feature atualizada com a `main` para evitar conflitos.


### 🔄 Fluxo Pull Request → Homologação → Produção

1. **Pull Request (PR):**
   - Crie PRs com descrições detalhadas, incluindo o contexto da mudança e testes realizados.
   - Assegure que o PR passe por todas as verificações automáticas (lint, testes, SonarQube).
   - Solicite revisão de pelo menos um colega para garantir qualidade.

2. **Homologação:**
   - Após o merge na `main`, o deploy em homologação ocorre automaticamente.
   - Realize testes manuais e de aceitação para validar a funcionalidade.
   - Documente quaisquer problemas encontrados e corrija-os em novas branches de feature.

3. **Produção:**
   - Apenas o Release Manager cria tags para deploy em produção.
   - Antes de criar a tag, confirme que a versão em homologação está estável.
   - Após a criação da tag, o pipeline executa todas as validações novamente antes do deploy.

### 🏆 Convenções

- **Rastreabilidade total:** Todas as mudanças devem ser vinculadas a uma tarefa (ex: JIRA, Trello) e documentadas no PR e na release.
- **Automação como padrão:** Evite processos manuais sempre que possível, exceto na criação de tags (controle humano intencional).
- **Qualidade acima de tudo:** O Quality Gate do SonarQube é inegociável; falhas bloqueiam qualquer deploy.
- **Feedback contínuo:** Use o histórico do Gitea e relatórios do SonarQube para revisar e melhorar o processo.
- **Versionamento semântico:** Siga `vX.Y.Z` para clareza e compatibilidade com automações.

---

## 📌 Considerações Finais

- 🔒 A branch `main` está 100% protegida contra alterações diretas.
- 🧠 O processo exige análise humana e validações automáticas antes de qualquer integração.
- 🚀 O deploy é confiável, previsível e controlado, com separação clara entre homologação e produção.
- 📊 O SonarQube garante a qualidade e evita regressões.
- 🔄 O fluxo pode ser evoluído para incluir rollback, integração com Docker, Kubernetes ou GitOps.

> **Versão:** 2.0  
> **Responsável Técnico:** Johnathan Silva  
> **Última Atualização:** Julho/2025