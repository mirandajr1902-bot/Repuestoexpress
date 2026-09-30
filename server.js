const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta actual y la carpeta padre
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, '..')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'tu-anon-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// API de Registro
app.post('/api/registrar-tienda', async (req, res) => {
  try {
    const { nombre, ubicacion, whatsapp } = req.body;

    if (!nombre || !ubicacion || !whatsapp) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    const { data, error } = await supabase
      .from('tiendas')
      .insert([{ nombre, ubicacion, whatsapp, estado: 'pendiente' }]);

    if (error) {
      console.error('Error Supabase:', error);
      return res.status(500).json({ success: false, message: 'Error en base de datos' });
    }

    io.emit('nueva-tienda', { nombre, ubicacion, whatsapp });
    return res.json({ success: true, message: 'Tienda registrada con éxito' });
  } catch (err) {
    console.error('Error Servidor:', err);
    return res.status(500).json({ success: false, message: 'Error de servidor' });
  }
});

// Servir las páginas HTML
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'), (err) => {
    if (err) res.sendFile(path.resolve(__dirname, '../index.html'));
  });
});

app.get('/tienda.html', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'tienda.html'), (err) => {
    if (err) res.sendFile(path.resolve(__dirname, '../tienda.html'));
  });
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'admin.html'), (err) => {
    if (err) res.sendFile(path.resolve(__dirname, '../admin.html'));
  });
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`));
