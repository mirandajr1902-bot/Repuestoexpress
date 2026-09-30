const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, '..')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'tu-anon-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// API para registrar tiendas
app.post('/api/registrar-tienda', async (req, res) => {
  try {
    // Acepta diferentes nombres de variables del formulario HTML
    const nombre = req.body.nombre || req.body.nombreNegocio || req.body.tienda;
    const ubicacion = req.body.ubicacion || req.body.ciudad || req.body.ub;
    const whatsapp = req.body.whatsapp || req.body.telefono || req.body.wh;

    console.log("Datos recibidos del formulario:", { nombre, ubicacion, whatsapp });

    if (!nombre || !ubicacion || !whatsapp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son requeridos. Verifica el HTML.' 
      });
    }

    // Inserción en Supabase con los nombres exactos de la tabla
    const { data, error } = await supabase
      .from('tiendas')
      .insert([{ 
        nombre: nombre, 
        ubicacion: ubicacion, 
        whatsapp: whatsapp, 
        estado: 'pendiente' 
      }]);

    if (error) {
      console.error('Error Supabase al insertar:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    io.emit('nueva-tienda', { nombre, ubicacion, whatsapp });
    return res.json({ success: true, message: 'Tienda registrada con éxito' });

  } catch (err) {
    console.error('Error Servidor:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

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
server.listen(PORT, () => console.log(`Servidor activo en el puerto ${PORT}`));
