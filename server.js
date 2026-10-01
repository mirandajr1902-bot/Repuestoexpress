const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.static(__dirname));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- BASE DE DATOS EN MEMORIA ---
let tiendas = [
  { id: 1, email: "tienda@ejemplo.com", password: "123", nombre: "AutoRepuestos Express", activa: true },
  { id: 2, email: "ventas@misuperrepuesto.com", password: "123", nombre: "Mi Super Repuesto", activa: true }
];

let solicitudes = [];
let mensajesChat = [];

// --- RUTAS DE NAVEGACIÓN (PÁGINAS HTML) ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/tienda.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'tienda.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ======================================================
// 1. RUTAS CLIENTE
// ======================================================
app.post('/api/solicitudes', (req, res) => {
  try {
    const { marca, modelo, anio, repuesto, vin, foto_url, cliente_whatsapp } = req.body;

    if (!marca || !modelo || !anio || !repuesto || !cliente_whatsapp) {
      return res.status(400).json({ error: 'Por favor completa todos los campos requeridos.' });
    }

    const nuevaSolicitud = {
      id: Date.now(),
      marca,
      modelo,
      anio,
      repuesto,
      vin: vin || '',
      foto_url: foto_url || null,
      cliente_whatsapp,
      estado: 'Pendiente',
      tiendaAsignada: null,
      fecha: new Date().toISOString()
    };

    solicitudes.unshift(nuevaSolicitud);
    return res.status(200).json({ message: 'Solicitud enviada con éxito', solicitud: nuevaSolicitud });

  } catch (error) {
    return res.status(500).json({ error: 'Error interno en el servidor' });
  }
});

app.get('/api/solicitudes', (req, res) => {
  return res.json(solicitudes);
});

app.get('/api/solicitudes/:id', (req, res) => {
  const solicitud = solicitudes.find(s => s.id == req.params.id);
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
  return res.json(solicitud);
});

// ======================================================
// 2. RUTAS TIENDAS
// ======================================================
app.post('/api/tiendas/login', (req, res) => {
  const { email, password } = req.body;
  const tienda = tiendas.find(t => t.email === email && t.password === password);

  if (!tienda) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }

  if (!tienda.activa) {
    return res.status(403).json({ error: 'Esta tienda se encuentra desactivada por el administrador.' });
  }

  return res.json({
    message: 'Inicio de sesión exitoso',
    tienda: { id: tienda.id, nombre: tienda.nombre }
  });
});

app.post('/api/solicitudes/:id/aceptar', (req, res) => {
  const { id } = req.params;
  const { tiendaNombre } = req.body;

  const solicitud = solicitudes.find(s => s.id == id);
  if (!solicitud) {
    return res.status(404).json({ error: 'Solicitud no encontrada' });
  }

  solicitud.estado = 'Aceptada';
  solicitud.tiendaAsignada = tiendaNombre;

  return res.json({ message: 'Solicitud aceptada', solicitud });
});

// ======================================================
// 3. RUTAS CHAT
// ======================================================
app.get('/api/chat/:solicitudId', (req, res) => {
  const { solicitudId } = req.params;
  const mensajes = mensajesChat.filter(m => m.solicitudId == solicitudId);
  return res.json(mensajes);
});

app.post('/api/chat', (req, res) => {
  const { solicitudId, remitente, texto } = req.body;

  if (!texto || !solicitudId) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const nuevoMensaje = {
    id: Date.now(),
    solicitudId,
    remitente,
    texto,
    fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  mensajesChat.push(nuevoMensaje);
  return res.json(nuevoMensaje);
});

// ======================================================
// 4. RUTAS ADMINISTRADOR
// ======================================================
app.post('/api/admin/login', (req, res) => {
  const { usuario, password } = req.body;
  if (usuario === 'admin' && password === 'admin123') {
    return res.json({ message: 'Acceso concedido al administrador' });
  }
  return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
});

app.get('/api/admin/tiendas', (req, res) => {
  return res.json(tiendas);
});

// 🔴 CREAR NUEVA TIENDA DESDE ADMIN
app.post('/api/admin/tiendas', (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios para crear la tienda.' });
  }

  const existe = tiendas.some(t => t.email === email);
  if (existe) {
    return res.status(400).json({ error: 'Ya existe una tienda registrada con ese correo electrónico.' });
  }

  const nuevaTienda = {
    id: Date.now(),
    nombre,
    email,
    password,
    activa: true
  };

  tiendas.push(nuevaTienda);
  return res.status(201).json({ message: 'Tienda creada exitosamente', tienda: nuevaTienda });
});

// Cambiar estado de tienda (Activar / Desactivar)
app.post('/api/admin/tiendas/:id/toggle', (req, res) => {
  const { id } = req.params;
  const tienda = tiendas.find(t => t.id == id);

  if (!tienda) {
    return res.status(404).json({ error: 'Tienda no encontrada' });
  }

  tienda.activa = !tienda.activa;
  return res.json({ message: `Tienda ${tienda.activa ? 'activada' : 'desactivada'}`, tienda });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
