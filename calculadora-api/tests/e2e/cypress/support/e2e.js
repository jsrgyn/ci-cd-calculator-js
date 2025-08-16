beforeEach(() => {
  // Configurações globais antes de cada teste
  cy.log(`Running test against: ${Cypress.config().baseUrl}`)
})

after(() => {
  // Tarefas de limpeza após todos os testes
  cy.log('E2E Test Suite Completed')
})