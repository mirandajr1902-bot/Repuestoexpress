const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración para guardar fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Base de datos en memoria
const db = {
  tiendas: [],      // { id, nombre, correo, password, whatsapp, ubicacion, activa }
  clientes: [],     // { whatsapp }
  cotizaciones: [], // { id, marca, modelo, ano, repuesto, vin, foto, whatsapp, fecha }
  mensajes: []      // { cotizacionId, remitente, texto, fecha }
};

// Configuración de correo (ajusta con tus datos SMTP o variables de entorno)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'tu-correo@gmail.com',
    pass: process.env.EMAIL_PASS || 'tu-password'
  }
});

// ==================== RUTAS DE CLIENTE ====================

// Enviar solicitud de repuesto desde el index.html
app.post('/api/cotizaciones', upload.single('foto'), async (req, res) => {
  const { marca, modelo, ano, repuesto, vin, whatsapp } = req.body;
  const foto = req.file ? `/uploads/${req.file.filename}` : null;

  const nuevaCotizacion = {
    id: Date.now().toString(),
    marca,
    modelo,
    ano,
    repuesto,
    vin: vin || 'N/A',
    foto,
    whatsapp,
    fecha: new Date().toLocaleString()
  };

  db.cotizaciones.push(nuevaCotizacion);

  // Registrar cliente por WhatsApp si no está
  if (!db.clientes.find(c => c.whatsapp === whatsapp)) {
    db.clientes.push({ whatsapp, fechaRegistro: new Date().toLocaleDateString() });
  }

  // Notificar solo a las tiendas ACTIVAS
  const tiendasActivas = db.tiendas.filter(t => t.activa);
  const correos = tiendasActivas.map(t => t.correo);

  if (correos.length > 0) {
    try {
      await transporter.sendMail({
        from: '"RepuestoExpress" <noreply@repuestoexpress.com>',
        to: correos,
        subject: `Nueva Cotización: ${marca} ${modelo} (${ano})`,
        html: `
          <h2>¡Nueva Solicitud de Repuesto!</h2>
          <p><strong>Marca / Modelo:</strong> ${marca} ${modelo} (${ano})</p>
          <p><strong>Repuesto:</strong> ${repuesto}</p>
          <p><strong>VIN:</strong> ${vin || 'N/A'}</p>
          <p>Ingresa a tu panel de tienda para responder.</p>
        `
      });
    } catch (e) {
      console.log('Error enviando correos:', e.message);
    }
  }

  // Enviar a los sockets conectados de las tiendas activas
  io.emit('nueva-cotizacion', nuevaCotizacion);

  res.json({ success: true, message: 'Solicitud enviada correctamente.' });
});

// ==================== RUTAS DE TIENDA ====================

// Login de tienda
app.post('/api/tiendas/login', (req, res) => {
  const { correo, password } = req.body;
  const tienda = db.tiendas.find(t => t.correo === correo && t.password === password);

  if (!tienda) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  res.json({ success: true, tienda: { id: tienda.id, nombre: tienda.nombre, activa: tienda.activa } });
});

// Obtener cotizaciones recibidas (solo si la tienda está activa)
app.get('/api/tiendas/cotizaciones/:tiendaId', (req, res) => {
  const tienda = db.tiendas.find(t => t.id === req.params.tiendaId);
  if (!tienda) return res.status(404).json({ error: 'Tienda no encontrada' });
  if (!tienda.activa) return res.json({ cotizaciones: [], activa: false });

  res.json({ cotizaciones: db.cotizaciones, activa: true });
});

// ==================== RUTAS DE ADMINISTRADOR ====================

// Registrar tienda desde el panel Admin
app.post('/api/admin/tiendas', (req, res) => {
  const { nombre, correo, whatsapp, ubicacion, password } = req.body;

  if (db.tiendas.find(t => t.correo === correo)) {
    return res.status(400).json({ error: 'El correo ya está registrado.' });
  }

  const nuevaTienda = {
    id: Date.now().toString(),
    nombre,
    correo,
    whatsapp,
    ubicacion,
    password,
    activa: true // Habilitada por defecto
  };

  db.tiendas.push(nuevaTienda);
  res.json({ success: true, tienda: nuevaTienda });
});

// Cambiar estado de la tienda (Activar / Desactivar cotizar)
app.patch('/api/admin/tiendas/:id/estado', (req, res) => {
  const tienda = db.tiendas.find(t => t.id === req.params.id);
  if (!tienda) return res.status(404).json({ error: 'Tienda no encontrada' });

  tienda.activa = req.body.activa;
  res.json({ success: true, activa: tienda.activa });
});

// Consultar datos completos para el Admin
app.get('/api/admin/datos', (req, res) => {
  res.json({
    tiendas: db.tiendas,
    clientes: db.clientes,
    totalCotizaciones: db.cotizaciones.length
  });
});

// ==================== CHAT EN TIEMPO REAL ====================

io.on('connection', (socket) => {
  socket.on('unirse-chat', (cotizacionId) => {
    socket.join(cotizacionId);
    // Enviar historial previo
    const historial = db.mensajes.filter(m => m.cotizacionId === cotizacionId);
    socket.emit('historial-chat', historial);
  });

  socket.on('enviar-mensaje', (data) => {
    // data = { cotizacionId, remitente, texto }
    const mensaje = { ...data, fecha: new Date().toLocaleTimeString() };
    db.mensajes.push(mensaje);
    io.to(data.cotizacionId).emit('nuevo-mensaje', mensaje);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor iniciado en el puerto ${PORT}`));
