# Imagen base recomendada por Puppeteer
FROM ghcr.io/puppeteer/puppeteer:latest

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos del proyecto
COPY . .

# Instala dependencias
RUN npm install

# Expone el puerto
EXPOSE 3000

# Comando para ejecutar la app
CMD ["npm", "start"]
