const express = require('express');
const calculator = require('./calculator');

const router = express.Router();

// Middleware para garantir que os inputs são números
const validateNumbers = (req, res, next) => {
  const { a, b } = req.query;
  const numA = parseFloat(a);
  const numB = parseFloat(b);

  if (Number.isNaN(numA) || (b !== undefined && Number.isNaN(numB))) {
    return res.status(400).json({ error: 'Parâmetros inválidos. Por favor, forneça apenas números.' });
  }

  req.numA = numA;
  req.numB = numB;
  return next();
};

const handleCalculation = (operation) => (req, res) => {
  try {
    const { numA, numB } = req;
    const result = operation(numA, numB);
    res.status(200).json({ result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

router.get('/sum', validateNumbers, handleCalculation(calculator.sum));
router.get('/subtract', validateNumbers, handleCalculation(calculator.subtract));
router.get('/multiply', validateNumbers, handleCalculation(calculator.multiply));
router.get('/divide', validateNumbers, handleCalculation(calculator.divide));
router.get('/percentage', validateNumbers, handleCalculation(calculator.percentage));
router.get('/sqrt', validateNumbers, handleCalculation(calculator.squareRoot));

module.exports = router;
