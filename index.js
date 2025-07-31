const express = require('express');
const app = express();

// Acepta JSON
app.use(express.json({ limit: '10mb' }));

// Middleware para logging de todas las requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} desde ${req.ip}`);
  console.log('🌐 Headers:', req.headers);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Health check solicitado desde:', req.ip);
  console.log('🏥 Memoria actual:', process.memoryUsage());
  console.log('🏥 Uptime:', process.uptime(), 'segundos');
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    message: 'Servidor funcionando sin Puppeteer'
  });
});

// Endpoint raíz
app.get('/', (req, res) => {
  console.log('🏠 Request al endpoint raíz');
  res.status(200).json({
    message: 'API de prueba funcionando',
    endpoints: {
      health: '/health',
      test: '/test'
    }
  });
});

// Endpoint de prueba simple
app.get('/test', (req, res) => {
  console.log('🧪 Request al endpoint de prueba');
  res.status(200).json({
    message: 'Test exitoso',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Puerto configurado por Railway
const PORT = process.env.PORT || 3000;
console.log('🔧 Puerto desde variable de entorno:', process.env.PORT);
console.log('🔧 Puerto final que usaremos:', PORT);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor escuchando en el puerto ${PORT}`);
  console.log('🔧 Variables de entorno importantes:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  console.log('  - PORT:', process.env.PORT);
});

// Manejo de señales para cierre limpio
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  server.close(() => {
    console.log('🛑 Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  server.close(() => {
    console.log('🛑 Servidor cerrado correctamente');
    process.exit(0);
  });
});

console.log('🚀 Aplicación iniciada correctamente');
