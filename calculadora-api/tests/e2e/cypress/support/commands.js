Cypress.Commands.add('calculate', (operation, a, b = null) => {
  const params = b ? `?a=${a}&b=${b}` : `?a=${a}`
  return cy.request({
    method: 'GET',
    url: `${Cypress.env('API_BASE_PATH')}/${operation}${params}`
  })
})