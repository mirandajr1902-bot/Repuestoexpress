const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Sirve archivos estáticos desde la raíz del proyecto y desde la carpeta actual
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(__dirname));

// Rutas explícitas para las páginas principal, tienda y admin
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/tienda.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../tienda.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin.html'));
});

// Configuración de Socket.io
io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
