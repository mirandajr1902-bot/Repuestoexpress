const express = require('express');
const cors = require('cors');

const app = express();

// Permitir peticiones desde cualquier origen (GitHub Pages)
app.use(cors());
app.use(express.json());

// Base de datos temporal en memoria
let tiendas = [];

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor RepuestoExpress funcionando correctamente');
});

// Obtener todas las tiendas
app.get('/api/tiendas', (req, res) => {
  res.json(tiendas);
});

// Guardar una nueva tienda
app.post('/api/tiendas', (req, res) => {
  const { nombre, ubicacion, whatsapp } = req.body;
  if (!nombre || !whatsapp) {
    return res.status(400).json({ error: 'Nombre y WhatsApp son obligatorios' });
  }
  
  const nuevaTienda = { id: Date.now(), nombre, ubicacion, whatsapp };
  tiendas.push(nuevaTienda);
  res.status(201).json({ mensaje: 'Tienda registrada con éxito', tienda: nuevaTienda });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
