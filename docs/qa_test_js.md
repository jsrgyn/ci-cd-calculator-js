# Boas Práticas de Testes em JavaScript e Pipeline CI/CD

## 1. Estrutura de Pipeline Eficiente (Melhorias Propostas)

### 1.1. Etapas Essenciais no Pipeline
```yaml
steps:
  - name: Instalação e Cache
    commands:
      - npm ci
      - mkdir -p reports coverage

  - name: Linting
    commands:
      - npm run lint:report
    # Fail early para problemas de estilo/código

  - name: Testes Unitários
    commands:
      - npm test -- --coverage --collectCoverage=true --coverageDirectory=coverage
    # Gera relatório de cobertura

  - name: Testes de Segurança
    commands:
      - npm audit --audit-level=moderate
    # Verifica vulnerabilidades críticas

  - name: Análise SonarQube
    environment:
      SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    commands:
      - npx sonar-scanner -Dsonar.qualitygate.wait=true
    # Espera pelo quality gate automaticamente

  - name: Deploy Homologação
    when:
      branch: main
    commands:
      - pm2 reload calculadora-api-homolog --update-env
    # Hot reload para zero downtime
```

### 1.2. Boas Práticas no Pipeline
- **Fail Fast**: Interromper no primeiro erro
- **Cobertura Mínima**: Configurar threshold (ex: 80%)
- **Paralelização**: Executar testes em paralelo (`jest --runInBand`)
- **Cache de Dependências**: Armazenar `node_modules` entre execuções
- **Ambientes Isolados**: Usar containers/Docker para consistência

## 2. Padrões de Escrita de Testes (Jest/SuperTest)

### 2.1. Estrutura de Testes Recomendada
```javascript
describe('API Calculator', () => {
  describe('Operações Matemáticas', () => {
    // Sucesso
    test('SUM (5+3) deve retornar 200 e resultado 8', async () => {
      const res = await request(app).get('/api/sum?a=5&b=3');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ result: 8 });
      expect(res.headers['content-type']).toMatch(/json/);
    });

    // Falhas
    test('DIVIDE por zero deve retornar 400 e erro', async () => {
      const res = await request(app).get('/api/divide?a=10&b=0');
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/dividir por zero/i);
    });
  });

  describe('Validação de Parâmetros', () => {
    test('Parâmetros inválidos devem retornar 400', async () => {
      const testCases = [
        '/api/sum?a=abc&b=2',
        '/api/divide?b=5',
        '/api/sqrt?a=-9'
      ];

      for (const url of testCases) {
        const res = await request(app).get(url);
        expect(res.statusCode).toEqual(400);
      }
    });
  });
});
```

### 2.2. Princípios Fundamentais
1. **Testes Determinísticos**:
   - Sem dependências externas
   - Mock de serviços (databases, APIs)

2. **Padrão AAA**:
   - **Arrange**: Preparar ambiente
   - **Act**: Executar ação
   - **Assert**: Verificar resultados

3. **Cobertura Efetiva**:
   - Valores limite (boundary values)
   - Casos de erro explícitos
   - Tipos de dados inválidos

4. **Nomenclatura Clara**:
   `[Método] [Cenário] deve [Resultado Esperado]`
   Ex: `GET /sum com números válidos deve retornar 200`

### 2.3. Melhores Práticas de Código
```javascript
// Evitar
test('Soma funciona', async () => { ... })

// Preferir
test('GET /api/sum com inteiros positivos deve retornar soma correta', async () => { ... })

// Evitar
expect(res.body.ok).toBe(true)

// Preferir
expect(res.body).toEqual({
  result: expect.any(Number)
})
```

## 3. Validação de Qualidade

### 3.1. SonarQube Configuração Essencial
```yaml
sonar-project.properties:
  sonar.javascript.lcov.reportPaths=coverage/lcov.info
  sonar.testExecutionReportPaths=reports/test-report.xml
  sonar.qualitygate.wait=true # Bloqueia pipeline se falhar
```

### 3.2. Métricas Obrigatórias
1. Cobertura de testes > 80%
2. Duplicação de código < 5%
3. Falhas críticas/code smells = 0
4. Security hotspots resolvidos > 95%

## 4. Monitoramento Pós-Deploy

### 4.1. Health Checks Automatizados
```yaml
- name: Smoke Test Homologação
  commands:
    - curl --fail http://homolog-api/health || exit 1
  when:
    event: [push, tag]
```

### 4.2. Logging Estruturado
```javascript
// Em src/index.js
app.use((req, res, next) => {
  console.log(JSON.stringify({
    method: req.method,
    path: req.path,
    params: req.query,
    timestamp: Date.now()
  }));
  next();
});
```

## 5. Referências de Padrões
- [Google Testing Framework](https://testing.googleblog.com/)
- [Jest Best Practices](https://jestjs.io/docs/best-practices)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#-testing-and-quality-assurance)
- [SuperTest Documentation](https://www.npmjs.com/package/supertest)

## 6. Checklist de Implementação
- [ ] Testes cobrem todos os fluxos de erro
- [ ] Pipeline falha rápido em erros
- [ ] Cobertura mínima configurada
- [ ] Health checks pós-deploy
- [ ] Logs estruturados para auditoria
- [ ] Monitoramento contínuo (APM)

## Principais Melhorias Propostas

1. **Pipeline Mais Robusto**:
   - Adição de security checks (`npm audit`)
   - Hot reload para zero downtime
   - Validação automática do quality gate

2. **Testes Mais Completos**:
   - Validação de headers (Content-Type)
   - Testes paramétricos para casos múltiplos
   - Verificação de propriedades com `expect.any()`

3. **Padronização**:
   - Convenção de nomes descritivos
   - Estrutura AAA em todos os testes
   - Relatórios machine-readable (JUnit, LCOV)

4. **Monitoramento Contínuo**:
   - Health checks automáticos
   - Logs estruturados para análise
   - Integração com APM (New Relic/Datadog)

Este documento segue os padrões do:
- [Testing Node.js Applications Book](https://www.manning.com/books/testing-nodejs-applications)
- [Jest Community Style Guides](https://github.com/jest-community/jest-extended#usage)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)