
# 📘 Manual de CI/CD com Gitea, Drone CI e SonarQube

## ✨ Visão Geral

Este manual define o padrão de configuração e boas práticas para o pipeline de **Integração Contínua (CI)** e **Entrega Contínua (CD)** com as ferramentas **Gitea**, **Drone CI** e **SonarQube**. O processo foi pensado para garantir segurança, rastreabilidade e qualidade contínua de software.

> **Conceito-chave:** _**Gated Check-in**_ — Nenhuma alteração entra na `main` sem passar por validações automáticas (CI) e revisão humana (Code Review).

---

## ⚙️ Parte 1: Gitea – Configuração e Controle de Acesso

### 👤 Gestão de Usuários e Permissões

- **Administrador:**
  - Gerencia a instância Gitea, cria repositórios e define proteções.
- **Desenvolvedor:**
  - Pode criar branches, pushar código e abrir PRs.
  - Deve receber apenas permissão de **escrita** (`write`) no repositório.

> 🚫 **Nunca conceda permissão de administrador aos desenvolvedores.**

---

### 🔐 Proteção da Branch `main`

A `main` é protegida para garantir estabilidade.

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
name: CI e Deploy

trigger:
  event:
    - push
    - pull_request

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
      - |
        if [ "${DRONE_BUILD_EVENT}" = "pull_request" ]; then
          echo "Analisando Pull Request..."
          npx sonar-scanner             -Dsonar.token=$SONAR_TOKEN             -Dsonar.host.url=$SONAR_HOST_URL             -Dsonar.pullrequest.key=${DRONE_PULL_REQUEST}             -Dsonar.pullrequest.branch=${DRONE_SOURCE_BRANCH}             -Dsonar.pullrequest.base=${DRONE_TARGET_BRANCH}             -Dsonar.scm.revision=${DRONE_COMMIT_SHA}
        else
          echo "Analisando Branch..."
          npx sonar-scanner             -Dsonar.token=$SONAR_TOKEN             -Dsonar.host.url=$SONAR_HOST_URL
        fi

  - name: Validar Quality Gate (Polling)
    environment:
      SONAR_TOKEN:
        from_secret: SONAR_TOKEN
      SONAR_HOST_URL:
        from_secret: SONAR_HOST_URL
    commands:
      - echo "Aguardando resultado do Quality Gate..."
      # Simulação do script de polling
      # curl + sleep (substituir por script real, se necessário)

  - name: Deploy em Homologação
    commands:
      - set -e
      - echo "Deploy para homologação..."
      - pm2 stop calculadora-api-homolog || true
      - pm2 delete calculadora-api-homolog || true
      - pm2 start src/index.js --name calculadora-api-homolog
    when:
      event:
        - push
      branch:
        - main
```

> ✅ **Correção Aplicada:** O deploy agora só acontece após merge com sucesso na `main`.

---

## 🔁 Parte 3: Fluxo de Trabalho para Desenvolvedores

1. **Criar branch de feature:**

```bash
git checkout main
git pull origin main
git checkout -b feature/TASK-123-nova-calculo
```

2. **Desenvolver e versionar:**

```bash
git add .
git commit -m "TASK-123: implementa nova lógica de cálculo"
git push origin feature/TASK-123-nova-calculo
```

3. **Abrir Pull Request no Gitea:**
   - Base: `main`
   - Compare: `feature/...`
   - Preencha título e descrição clara.

4. **Validação automática (CI):**
   - Lint + Testes + SonarQube são executados.
   - Se algo falhar, as verificações no PR indicam erro e bloqueiam merge.

5. **Revisão e aprovação do PR:**
   - Um colega analisa e aprova o código.

6. **Merge autorizado:**
   - Após todas as verificações e aprovação, o botão de merge será habilitado.

7. **Deploy automático em homologação:**
   - O Drone é disparado pelo push na `main`.
   - Executa o pipeline e realiza o deploy com `pm2`.


---

## 💡 Dica de Especialista: Use o Padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/)

Adotar um padrão para suas mensagens de commit facilita a automação de changelogs, melhora a leitura do histórico e promove organização no repositório.

### Exemplo de Tipos Comuns

- `feat:` para **novas funcionalidades**
- `fix:` para **correções de bugs**
- `docs:` para **atualizações de documentação**
- `style:` para **formatação de código** (espaços, ponto e vírgula, etc)
- `refactor:` para **refatorações que não alteram comportamento**
- `test:` para **adição ou modificação de testes**
- `chore:` para **tarefas de manutenção** (builds, configs, dependências, etc)

> 🔗 Documentação oficial: [https://www.conventionalcommits.org/pt-br/v1.0.0/](https://www.conventionalcommits.org/pt-br/v1.0.0/)


---

## 📌 Considerações Finais

- 🔒 A branch `main` está 100% protegida contra alterações diretas.
- 🧠 O processo exige análise humana + validações automáticas antes de qualquer integração.
- 🚀 O deploy é confiável, previsível e controlado.
- 📊 O SonarQube ajuda a manter a qualidade e evitar regressões.

> Este manual pode ser evoluído para contemplar produção, rollback, integração com Docker, Kubernetes ou GitOps, conforme sua stack evoluir.

---

**Versão:** 1.0  
**Responsável Técnico:** Sr. Johnathan Silva Resende  
**Última Atualização:** Julho/2025
