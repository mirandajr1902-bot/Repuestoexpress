const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.static(__dirname));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// BBDD en Memoria
let tiendas = [
  { id: 1, email: "tienda@ejemplo.com", password: "123", nombre: "AutoRepuestos Express", activa: true },
  { id: 2, email: "ventas@misuperrepuesto.com", password: "123", nombre: "Mi Super Repuesto", activa: true }
];

let solicitudes = [];
let cotizaciones = []; // { id, solicitudId, tiendaId, tiendaNombre, precio, estado: 'Pendiente'|'Aceptada', metodoEntrega: null }
let mensajesChat = []; // { id, cotizacionId, remitente, texto, fecha }

// Páginas HTML
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/tienda.html', (req, res) => res.sendFile(path.join(__dirname, 'tienda.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// --- RUTAS CLIENTE ---
app.post('/api/solicitudes', (req, res) => {
  const { marca, modelo, anio, repuesto, vin, foto_url, cliente_whatsapp } = req.body;
  if (!marca || !modelo || !anio || !repuesto || !cliente_whatsapp) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const nueva = {
    id: Date.now(),
    marca, modelo, anio, repuesto, vin: vin || '', foto_url: foto_url || null,
    cliente_whatsapp, fecha: new Date().toISOString()
  };
  solicitudes.unshift(nueva);
  res.json({ message: 'Solicitud creada', solicitud: nueva });
});

app.get('/api/solicitudes/cliente/:whatsapp', (req, res) => {
  const misSolicitudes = solicitudes.filter(s => s.cliente_whatsapp === req.params.whatsapp);
  res.json(misSolicitudes);
});

app.get('/api/cotizaciones/solicitud/:solicitudId', (req, res) => {
  const cots = cotizaciones.filter(c => c.solicitudId == req.params.solicitudId);
  res.json(cots);
});

// Cliente acepta cotización
app.post('/api/cotizaciones/:id/aceptar', (req, res) => {
  const cot = cotizaciones.find(c => c.id == req.params.id);
  if (!cot) return res.status(404).json({ error: 'Cotización no encontrada' });
  cot.estado = 'Aceptada';
  res.json({ message: 'Cotización aceptada', cotizacion: cot });
});

// Cliente selecciona Retiro o Delivery
app.post('/api/cotizaciones/:id/finalizar', (req, res) => {
  const { metodoEntrega } = req.body; // 'Retiro en Local' o 'Delivery'
  const cot = cotizaciones.find(c => c.id == req.params.id);
  if (!cot) return res.status(404).json({ error: 'Cotización no encontrada' });
  
  cot.metodoEntrega = metodoEntrega;
  cot.estado = 'Finalizada';
  res.json({ message: 'Pedido finalizado con éxito', cotizacion: cot });
});

// --- RUTAS TIENDA ---
app.post('/api/tiendas/login', (req, res) => {
  const { email, password } = req.body;
  const t = tiendas.find(x => x.email === email && x.password === password);
  if (!t) return res.status(401).json({ error: 'Credenciales inválidas' });
  if (!t.activa) return res.status(403).json({ error: 'Tienda desactivada' });
  res.json({ tienda: { id: t.id, nombre: t.nombre } });
});

app.get('/api/solicitudes/tienda', (req, res) => {
  // Las tiendas ven solicitudes pero NINGUNA ve datos de contacto de otras o cliente
  const anonimas = solicitudes.map(s => {
    const miCot = cotizaciones.find(c => c.solicitudId === s.id && c.tiendaId === req.query.tiendaId);
    return {
      id: s.id, marca: s.marca, modelo: s.modelo, anio: s.anio, repuesto: s.repuesto,
      vin: s.vin, foto_url: s.foto_url,
      miCotizacion: miCot || null,
      // Solo revela el WhatsApp si el cliente finalizó la compra con esta tienda
      cliente_whatsapp: (miCot && miCot.metodoEntrega) ? s.cliente_whatsapp : 'Protegido hasta aceptar pedido'
    };
  });
  res.json(anonimas);
});

app.post('/api/cotizaciones', (req, res) => {
  const { solicitudId, tiendaId, tiendaNombre, precio } = req.body;
  let cot = cotizaciones.find(c => c.solicitudId == solicitudId && c.tiendaId == tiendaId);
  
  if (cot) {
    cot.precio = precio;
  } else {
    cot = {
      id: Date.now(),
      solicitudId, tiendaId, tiendaNombre, precio, estado: 'Pendiente', metodoEntrega: null
    };
    cotizaciones.push(cot);
  }
  res.json({ message: 'Cotización enviada', cotizacion: cot });
});

// --- CHAT INTERNO ---
app.get('/api/chat/cotizacion/:cotizacionId', (req, res) => {
  const msgs = mensajesChat.filter(m => m.cotizacionId == req.params.cotizacionId);
  res.json(msgs);
});

app.post('/api/chat', (req, res) => {
  const { cotizacionId, remitente, texto } = req.body;
  const msg = {
    id: Date.now(),
    cotizacionId,
    remitente,
    texto,
    fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  mensajesChat.push(msg);
  res.json(msg);
});

// --- ADMIN ---
app.post('/api/admin/login', (req, res) => {
  if (req.body.usuario === 'admin' && req.body.password === 'admin123') return res.json({ ok: true });
  res.status(401).json({ error: 'Credenciales inválidas' });
});
app.get('/api/admin/tiendas', (req, res) => res.json(tiendas));
app.post('/api/admin/tiendas', (req, res) => {
  const { nombre, email, password } = req.body;
  if (tiendas.some(t => t.email === email)) return res.status(400).json({ error: 'Correo registrado' });
  const t = { id: Date.now(), nombre, email, password, activa: true };
  tiendas.push(t);
  res.json(t);
});
app.post('/api/admin/tiendas/:id/toggle', (req, res) => {
  const t = tiendas.find(x => x.id == req.params.id);
  if (t) t.activa = !t.activa;
  res.json(t);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
