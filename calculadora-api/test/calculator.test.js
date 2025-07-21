const request = require('supertest');
const app = require('../src/index'); // Importamos nosso app Express

jest.setTimeout(10000);

describe('API da Calculadora', () => {
  // Testes de Sucesso
  test('GET /api/sum -> deve somar dois números', async () => {
    const response = await request(app).get('/api/sum?a=5&b=3');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ result: 8 });
  });

  test('GET /api/subtract -> deve subtrair dois números', async () => {
    const response = await request(app).get('/api/subtract?a=10&b=4');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ result: 6 });
  });

  test('GET /api/multiply -> deve multiplicar dois números', async () => {
    const response = await request(app).get('/api/multiply?a=7&b=2');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ result: 14 });
  });

  test('GET /api/divide -> deve dividir dois números', async () => {
    const response = await request(app).get('/api/divide?a=20&b=5');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ result: 4 });
  });
  
  test('GET /api/percentage -> deve calcular a porcentagem', async () => {
    const response = await request(app).get('/api/percentage?a=200&b=10'); // 10% de 200
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ result: 20 });
  });

  test('GET /api/sqrt -> deve calcular a raiz quadrada', async () => {
    const response = await request(app).get('/api/sqrt?a=16');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ result: 4 });
  });

  // Testes de Falha (Casos de Borda)
  test('GET /api/divide -> deve retornar erro ao dividir por zero', async () => {
    const response = await request(app).get('/api/divide?a=10&b=0');
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Não é possível dividir por zero.' });
  });
  
/*
  test('GET /api/sum -> deve retornar erro com parâmetros não numéricos', async () => {
    const response = await request(app).get('/api/sum?a=dez&b=cinco');
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Parâmetros inválidos. Por favor, forneça apenas números.' });
  });
  test('GET /api/sqrt -> deve retornar erro para número negativo', async () => {
    const response = await request(app).get('/api/sqrt?a=-9');
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Não é possível calcular a raiz quadrada de um número negativo.' });
  });
  */
});