# --- Estágio de Build ---
# Usamos uma imagem Node completa para instalar dependências e rodar testes
FROM node:18-alpine AS builder

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos de manifesto de dependências
COPY package*.json ./

# Instala SOMENTE as dependências de produção
# Isso evita que as dependências de dev (jest, eslint) vão para a imagem final
RUN npm install --only=production

# Copia o código fonte da aplicação
COPY . .

# --- Estágio Final (Produção) ---
# Usamos uma imagem "slim" para reduzir o tamanho e a superfície de ataque
FROM node:18-alpine

WORKDIR /usr/src/app

# Copia as dependências de produção instaladas no estágio anterior
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copia o código fonte da aplicação
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/package.json ./package.json

# Expõe a porta que a aplicação vai usar
EXPOSE 8000

# Comando para iniciar a aplicação quando o contêiner for executado
CMD [ "node", "src/index.js" ]