const calculator = {
  sum: (a, b) => a + b,
  /* subtract: (a, b) => a - b, */
  subtract: (a, b) => a - b,
  // Alteração intencional para causar falha
  // subtract: (a, b) => a * b, // Ops! Em vez de subtrair, está multiplicando
  multiply: (a, b) => a * b,
  divide: (a, b) => {
    if (b === 0) {
      throw new Error('Não é possível dividir por zero.');
    }
    return a / b;
  },
  percentage: (value, percent) => (value * percent) / 100,
  squareRoot: (a) => {
    if (a < 0) {
      throw new Error('Não é possível calcular a raiz quadrada de um número negativo.');
    }
    return Math.sqrt(a);
  },
};

module.exports = calculator;
