const express = require('express');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 8000; // A porta 8000 será nosso padrão

app.use(express.json());
app.use('/api', routes);

// Rota health check para o CI/CD
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// A verificação `!module.parent` evita que o servidor inicie durante os testes
if (!module.parent) {
  app.listen(PORT, () => {
    // console.log(`Servidor da calculadora rodando na porta ${PORT}`);
  });
}

// Exemplo de código ruim:
function nomeMuitoCurto() { console.log("Olá") } // Não segue padrão de nomenclatura
var teste = 123 // Uso de var ao invés de let/const (trigger para Sonar)

module.exports = app; // Exportamos para usar nos testes


