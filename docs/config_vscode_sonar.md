# Configuração do VS Code com SonarQube for IDE (Substituto do SonarLint)

> **Importante**: A extensão SonarLint foi oficialmente substituída pelo **SonarQube for IDE**, que oferece funcionalidades aprimoradas e suporte contínuo. Esta é a solução recomendada para integração com servidores SonarQube.

## Pré-requisitos
- Servidor SonarQube: `http://sonar.local/` (acessível localmente)
- Conta de usuário no SonarQube
- Visual Studio Code (versão 1.85 ou superior)
- Node.js 16+ (para projetos JavaScript)

---

## Fase 1: Configuração Local (SonarQube for IDE - Connected Mode)

### Passo 1: Instalar a Extensão Correta
1. Abra o VS Code
2. Acesse **Extensions** (`Ctrl+Shift+X`)
3. Busque por: `SonarQube for IDE`
4. Instale a extensão oficial da SonarSource
5. **Desinstale qualquer versão antiga do SonarLint**

🔗 [Link Direto para a Extensão](https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode)

### Passo 2: Configurar Conexão com o SonarQube
1. Abra a **Command Palette** (`Ctrl+Shift+P`):
2. Execute: `SonarQube: Connect to SonarQube`
3. Preencha as informações:
   ```
   Server URL: http://sonar.local
   Token: [Cole seu token aqui]
   ```

### Passo 3: Gerar Token de Acesso
1. Acesse: http://sonar.local
2. No canto superior direito: `Login` > `My Account`
3. Navegue para **Security** > **Tokens**
4. Crie novo token:
   ```yaml
   Name: vscode-{seu-usuario}  # Ex: vscode-johnathan
   Type: User Token
   ```
5. **Copie o token** imediatamente (não será exibido novamente)

### Passo 4: Associar Projeto (Binding)
1. Abra a pasta do projeto no VS Code
2. Execute na Command Palette:
   ```bash
   SonarQube: Bind project to SonarQube
   ```
3. Selecione seu servidor (`http://sonar.local`)
4. Escolha o projeto correspondente (ex: `calculadora-api`)
5. Confirme a associação

---

## Configuração Avançada (sonarlint.json)

Para personalizar regras por projeto, crie um arquivo `.sonarlint/sonarlint.json` na raiz:

```json
{
  "sonarQubeUri": "http://sonar.local",
  "projectKey": "calculadora-api",
  "serverId": "sonar-local",
  "analyzerProperties": {
    "sonar.javascript.node": "16.0.0"
  }
}
```

## Fluxo de Trabalho

1. Ao editar arquivos `.js`, problemas são destacados em tempo real
2. Para análise completa:
   ```bash
   SonarQube: Analyze Open Files  # Arquivos abertos
   SonarQube: Analyze Project     # Projeto inteiro
   ```
3. Use quick-fixes com `Ctrl+.` para correções automáticas

---

## Benefícios da Nova Extensão
✅ **Análise mais precisa** - Motor de análise atualizado  
✅ **Suporte a regras customizadas** - Herda configurações do servidor  
✅ **Hotfixes automáticos** - Correção de problemas com um clique  
✅ **Integração com Quality Gates** - Visualização direta no editor  
✅ **Suporte a múltiplos projetos** - Configurações independentes por workspace  

---

## Solução de Problemas

| Problema                          | Solução                                                                 |
|-----------------------------------|-------------------------------------------------------------------------|
| "Failed to bind project"          | Verifique permissões do token no SonarQube                              |
| Regras não atualizadas            | Execute `SonarQube: Update Binding`                                     |
| Erros de certificado SSL          | Adicione exceção em `settings.json`:                                   |
|                                   | `"sonarlint.ssl.trustedCertificates": ["path/to/cert.pem"]`             |
| Projeto não listado               | Verifique se o projeto existe no servidor com a chave correta           |
| "No issues found" (falso positivo)| Forçar reanálise com `SonarQube: Analyze Project`                       |

---

## Configuração Recomendada (settings.json)

```json
{
  "sonarlint.connectedMode.connections.sonarqube": [
    {
      "serverUrl": "http://sonar.local",
      "token": "sqa_..." // Opcional: armazenar token globalmente
    }
  ],
  "sonarlint.rules": {
    "javascript:S1481": "off" // Exemplo: desativar regra específica
  },
  "sonarlint.codeActions": {
    "quickFixes": true // Ativar correções rápidas
  }
}
```

> **Aviso de Segurança**: Evite armazenar tokens no settings.json compartilhado. Use a autenticação interativa.

---

## Migração do SonarLint
1. Desinstale a extensão SonarLint
2. Instale SonarQube for IDE
3. Reconecte ao servidor usando o mesmo token
4. Reassocie os projetos
5. Todos os bindings e configurações serão migrados automaticamente

Esta nova extensão mantém todos os benefícios do SonarLint com melhorias significativas na precisão da análise e experiência do desenvolvedor.

## Principais Mudanças na Nova Extensão

1. **Nome e Identidade Visual**:
   - Novo nome: SonarQube for IDE
   - Ícone atualizado (cubo azul ao invés de linter verde)

2. **Melhorias Técnicas**:
   - Motor de análise JavaScript atualizado
   - Suporte nativo a TypeScript e frameworks modernos
   - Integração direta com Quality Gates do SonarQube
   - Diagnósticos mais precisos com localização de problemas aprimorada

3. **Nova UX**:
   - Painel dedicado "SonarQube" na barra lateral
   - Visualização hierárquica de problemas
   - Hotspots de segurança destacados

A SonarSource recomenda a migração imediata para a nova extensão, que receberá todos os futuros updates e melhorias.