describe('Calculadora API - Testes E2E', () => {
  const operations = [
    { name: 'Soma', path: '/sum', a: 5, b: 3, expected: 8 },
    { name: 'Subtração', path: '/subtract', a: 10, b: 4, expected: 6 },
    { name: 'Multiplicação', path: '/multiply', a: 7, b: 2, expected: 14 },
    { name: 'Divisão', path: '/divide', a: 20, b: 5, expected: 4 },
    { name: 'Porcentagem', path: '/percentage', a: 200, b: 10, expected: 20 },
    { name: 'Raiz Quadrada', path: '/sqrt', a: 16, expected: 4 }
  ]

  const errorCases = [
    { 
      name: 'Divisão por zero', 
      path: '/divide', 
      params: 'a=10&b=0',
      expectedError: 'Não é possível dividir por zero.'
    },
    { 
      name: 'Raiz quadrada de número negativo', 
      path: '/sqrt', 
      params: 'a=-9',
      expectedError: 'Não é possível calcular a raiz quadrada de um número negativo.'
    }
  ]

  operations.forEach(({ name, path, a, b, expected }) => {
    it(`${name} - ${a} e ${b} deve retornar ${expected}`, () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('API_BASE_PATH')}${path}`,
        qs: { a, b }
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('result', expected)
      })
    })
  })

  errorCases.forEach(({ name, path, params, expectedError }) => {
    it(`${name} deve retornar erro`, () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('API_BASE_PATH')}${path}?${params}`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.have.property('error', expectedError)
      })
    })
  })

  it('Deve retornar erro para parâmetros inválidos', () => {
    cy.request({
      method: 'GET',
      url: `${Cypress.env('API_BASE_PATH')}/sum`,
      qs: { a: 'dez', b: 'cinco' },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body).to.have.property('error')
    })
  })
})

/* Exemplo alternativo usando fixture e comando customizado

beforeEach(() => {
  cy.fixture('operations').as('ops')
})

it('Operações válidas', function() {
  this.ops.validOperations.forEach((operation) => {
    cy.calculate(operation.path, operation.a, operation.b)
      .its('body.result')
      .should('eq', operation.expected)
  })
}) */

  it('Deve responder em menos de 500ms', () => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('API_BASE_PATH')}/sum?a=5&b=3`,
    timeout: 500
  }).then((response) => {
    expect(response.duration).to.be.lessThan(500)
  })
})

afterEach(() => {
  const testState = cy.state('runnable').ctx.currentTest.state
  const testName = cy.state('runnable').ctx.currentTest.title

  cy.task('logToPrometheus', {
    metric: 'cypress_test_result',
    labels: `{test="${testName}", status="${testState}"}`,
    value: 1
  })
})