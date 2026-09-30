const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// *** AGREGAR ESTA LÍNEA AQUÍ ***
// Sirve los archivos HTML (index.html, tienda.html, admin.html, etc.)
app.use(express.static(__dirname));

// Ruta básica de prueba
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Configuración de eventos de Socket.io
io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Render asigna dinámicamente el puerto mediante process.env.PORT
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
