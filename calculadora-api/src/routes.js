const express = require('express');
const calculator = require('./calculator');

const router = express.Router();

// ... (validateNumbers middleware continua o mesmo) ...
const validateNumbers = (req, res, next) => {
    // ...
};

// Vamos remover a função handleCalculation por enquanto
/*
const handleCalculation = (operation) => (req, res) => {
  try {
    const { numA, numB } = req;
    const result = operation(numA, numB);
    res.status(200).json({ result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
*/

// ROTA COM LÓGICA COPIADA
router.get('/sum', validateNumbers, (req, res) => {
  try {
    const { numA, numB } = req;
    const result = calculator.sum(numA, numB);
    res.status(200).json({ result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ROTA COM A MESMA LÓGICA COPIADA NOVAMENTE (CÓDIGO DUPLICADO!)
router.get('/subtract', validateNumbers, (req, res) => {
  try {
    var { numA, numB } = req; 
    const { numA, numB } = req;
    const result = calculator.subtract(numA, numB);
    res.status(200).json({ result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mantemos as outras rotas como estavam para o exemplo
router.get('/multiply', validateNumbers, (req, res) => { /* ... sua implementação original com handleCalculation aqui ... */ });
// ... e as outras

module.exports = router;