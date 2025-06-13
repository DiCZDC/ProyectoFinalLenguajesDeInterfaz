const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io'); // para WebSocket

const app = express();
const server = http.createServer(app);

// Configurar Socket.IO con CORS habilitado para cualquier origen
const io = new Server(server, {
  cors: {
    origin: "*", // Permite cualquier origen
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: false
  },
  // Configuraciones adicionales opcionales
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// También configurar CORS para Express (opcional, pero recomendado)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Ruta de prueba para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.json({ 
    message: 'Servidor Socket.IO funcionando',
    timestamp: new Date().toISOString(),
    connectedClients: io.engine.clientsCount
  });
});

const portSerial = new SerialPort({ path: 'COM5', baudRate: 9600 });
const parser = portSerial.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Event listeners para Socket.IO
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  
  // Enviar un mensaje de bienvenida al cliente que se conecta
  socket.emit('connection-status', { 
    status: 'connected', 
    message: 'Conectado al servidor de radar',
    timestamp: new Date().toISOString()
  });

  socket.on('disconnect', (reason) => {
    console.log(`❌ Cliente desconectado: ${socket.id}, Razón: ${reason}`);
  });

  // Opcional: permitir que el cliente solicite datos actuales
  socket.on('request-current-data', () => {
    // Enviar los últimos datos disponibles si los hay
    console.log(`📡 Cliente ${socket.id} solicitó datos actuales`);
  });
});

// Manejar datos del puerto serial
parser.on('data', (line) => {
  console.log(`📥 Datos recibidos del serial: ${line}`);
  
  const [firstStr, secondStr] = line.split(',');
  let first = parseInt(firstStr, 10);
  let second = parseInt(secondStr, 10);
  
  // Validar datos
  if (isNaN(first)) {
    console.warn(`⚠️  Ángulo inválido: ${firstStr}`);
    first = 0;
  }
  if (isNaN(second)) {
    console.warn(`⚠️  Distancia inválida: ${secondStr}`);
    second = 41;
  }

  const data = { first, second, timestamp: new Date().toISOString() };
  
  // Enviar datos por WebSocket a todos los clientes conectados
  io.emit('serial-data', data);
  console.log(`📡 Datos enviados a ${io.engine.clientsCount} cliente(s):`, data);
});

// Manejar errores del puerto serial
portSerial.on('error', (err) => {
  console.error('🚫 Error serial:', err.message);
  
  // Notificar a los clientes sobre el error
  io.emit('serial-error', { 
    error: err.message, 
    timestamp: new Date().toISOString() 
  });
});

// Manejar apertura del puerto serial
portSerial.on('open', () => {
  console.log('✅ Puerto serial abierto correctamente');
  
  // Notificar a los clientes que el puerto serial está listo
  io.emit('serial-status', { 
    status: 'connected', 
    port: 'COM5',
    baudRate: 9600,
    timestamp: new Date().toISOString() 
  });
});

// Manejar cierre del puerto serial
portSerial.on('close', () => {
  console.log('⚠️  Puerto serial cerrado');
  
  // Notificar a los clientes
  io.emit('serial-status', { 
    status: 'disconnected', 
    timestamp: new Date().toISOString() 
  });
});

// Iniciar el servidor
server.listen(4000, () => {
  console.log('🚀 Servidor serial escuchando en http://localhost:4000');
  console.log('🔌 Socket.IO configurado con CORS habilitado para cualquier origen');
  console.log('📊 Puedes probar el servidor visitando http://localhost:4000');
});