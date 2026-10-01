const express = require('express');
const cors = require('cors');

const app = express();

// Habilitar CORS
app.use(cors());

// Aumento de límite a 10MB para soportar la foto en Base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- BASE DE DATOS EN MEMORIA ---
// Tiendas preregistradas para la prueba
let tiendas = [
  { id: 1, email: "tienda@ejemplo.com", password: "123", nombre: "AutoRepuestos Express" },
  { id: 2, email: "ventas@misuperrepuesto.com", password: "123", nombre: "Mi Super Repuesto" }
];

let solicitudes = [];  // Lista de solicitudes creadas
let mensajesChat = []; // Historial de mensajes entre cliente y tienda

// ======================================================
// 1. RUTAS PARA EL CLIENTE (FORMULARIO)
// ======================================================

// Registrar nueva solicitud del cliente
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

    solicitudes.unshift(nuevaSolicitud); // Agregar al inicio de la lista

    return res.status(200).json({ 
      message: 'Solicitud enviada con éxito',
      solicitud: nuevaSolicitud
    });

  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    return res.status(500).json({ error: 'Error en el servidor al guardar la solicitud' });
  }
});

// ======================================================
// 2. RUTAS PARA LAS TIENDAS
// ======================================================

// Login de tiendas
app.post('/api/tiendas/login', (req, res) => {
  const { email, password } = req.body;
  const tienda = tiendas.find(t => t.email === email && t.password === password);

  if (!tienda) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }

  return res.json({
    message: 'Inicio de sesión exitoso',
    tienda: { id: tienda.id, nombre: tienda.nombre }
  });
});

// Obtener todas las solicitudes registradas
app.get('/api/solicitudes', (req, res) => {
  return res.json(solicitudes);
});

// Aceptar una solicitud por parte de una tienda
app.post('/api/solicitudes/:id/aceptar', (req, res) => {
  const { id } = req.params;
  const { tiendaNombre } = req.body;

  const solicitud = solicitudes.find(s => s.id == id);
  if (!solicitud) {
    return res.status(404).json({ error: 'Solicitud no encontrada' });
  }

  solicitud.estado = 'Aceptada';
  solicitud.tiendaAsignada = tiendaNombre;

  return res.json({
    message: 'Solicitud aceptada exitosamente',
    solicitud
  });
});

// ======================================================
// 3. RUTAS PARA EL CHAT INTERNO
// ======================================================

// Obtener mensajes de una solicitud específica
app.get('/api/chat/:solicitudId', (req, res) => {
  const { solicitudId } = req.params;
  const mensajes = mensajesChat.filter(m => m.solicitudId == solicitudId);
  return res.json(mensajes);
});

// Enviar un mensaje en el chat
app.post('/api/chat', (req, res) => {
  const { solicitudId, remitente, texto } = req.body;

  if (!texto || !solicitudId) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para enviar el mensaje' });
  }

  const nuevoMensaje = {
    id: Date.now(),
    solicitudId,
    remitente, // 'Tienda' o 'Cliente'
    texto,
    fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  mensajesChat.push(nuevoMensaje);
  return res.json(nuevoMensaje);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
