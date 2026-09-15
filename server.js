const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// IMPORTANTE: Aumentar el límite para recibir imágenes en Base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'TU_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'TU_SUPABASE_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Endpoint para guardar solicitudes (con foto comprimida)
app.post('/api/solicitudes', async (req, res) => {
  try {
    const { marca, modelo, anio, repuesto, vin, foto_url, cliente_whatsapp } = req.body;

    const { data, error } = await supabase
      .from('solicitudes')
      .insert([{ marca, modelo, anio, repuesto, vin, foto_url, cliente_whatsapp }]);

    if (error) throw error;

    res.status(201).json({ mensaje: 'Solicitud creada con éxito', data });
  } catch (err) {
    console.error('Error guardando solicitud:', err);
    res.status(500).json({ error: 'Error al registrar solicitud' });
  }
});

// Endpoint para listar solicitudes
app.get('/api/solicitudes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo solicitudes' });
  }
});

// Endpoint para guardar tiendas
app.post('/api/tiendas', async (req, res) => {
  try {
    const { nombre, ubicacion, whatsapp } = req.body;

    const { data, error } = await supabase
      .from('tiendas')
      .insert([{ nombre, ubicacion, whatsapp }]);

    if (error) throw error;

    res.status(201).json({ mensaje: 'Tienda registrada', data });
  } catch (err) {
    res.status(500).json({ error: 'Error registrando tienda' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
