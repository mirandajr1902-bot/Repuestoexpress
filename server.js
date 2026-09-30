const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middlewares para procesar datos de formularios JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración del cliente de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'TU_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'TU_SUPABASE_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Servir archivos estáticos (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Ruta API para registrar tiendas
app.post('/api/registrar-tienda', async (req, res) => {
  try {
    const { nombre, ubicacion, whatsapp } = req.body;

    if (!nombre || !ubicacion || !whatsapp) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    // Insertar en la tabla "tiendas" de Supabase
    const { data, error } = await supabase
      .from('tiendas')
      .insert([{ nombre, ubicacion, whatsapp, estado: 'pendiente' }]);

    if (error) {
      console.error('Error Supabase:', error);
      return res.status(500).json({ success: false, message: 'Error en la base de datos' });
    }

    // Notificar en tiempo real por WebSockets
    io.emit('nueva-tienda', { nombre, ubicacion, whatsapp });

    return res.json({ success: true, message: 'Tienda registrada con éxito' });
  } catch (err) {
    console.error('Error Servidor:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Rutas explícitas de navegación
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));
app.get('/tienda.html', (req, res) => res.sendFile(path.join(__dirname, '../tienda.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, '../admin.html')));

// Eventos de WebSockets
io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado:', socket.id);
  socket.on('disconnect', () => console.log('Cliente desconectado:', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`));
