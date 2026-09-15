const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());

// Conexión a Supabase usando las variables de entorno de Render
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/', (req, res) => {
  res.send('Servidor RepuestoExpress conectado a Supabase');
});

// Obtener tiendas registradas
app.get('/api/tiendas', async (req, res) => {
  const { data, error } = await supabase.from('tiendas').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Registrar nueva tienda
app.post('/api/tiendas', async (req, res) => {
  const { nombre, ubicacion, whatsapp } = req.body;
  const { data, error } = await supabase.from('tiendas').insert([{ nombre, ubicacion, whatsapp }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ mensaje: 'Tienda guardada en Supabase', tienda: data[0] });
});

// Crear solicitud interna de repuesto
app.post('/api/solicitudes', async (req, res) => {
  const { marca, modelo, anio, vin, repuesto, cliente_whatsapp } = req.body;
  const { data, error } = await supabase.from('solicitudes').insert([{ marca, modelo, anio, vin, repuesto, cliente_whatsapp }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ mensaje: 'Solicitud creada con éxito', solicitud: data[0] });
});

// Obtener todas las solicitudes para el panel de las repuesteras
app.get('/api/solicitudes', async (req, res) => {
  const { data, error } = await supabase.from('solicitudes').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
        
