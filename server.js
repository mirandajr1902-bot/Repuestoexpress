const express = require('express');
const cors = require('cors');

const app = express();

// Habilitar CORS para permitir peticiones desde el frontend
app.use(cors());

// Configurar el límite del parser de JSON a 10MB (Soporta imágenes en Base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Ruta principal para recibir solicitudes de repuestos
app.post('/api/solicitudes', async (req, res) => {
  try {
    const { marca, modelo, anio, repuesto, vin, foto_url, cliente_whatsapp } = req.body;

    // Validación básica de campos requeridos
    if (!marca || !modelo || !anio || !repuesto || !cliente_whatsapp) {
      return res.status(400).json({ 
        error: 'Por favor completa todos los campos obligatorios.' 
      });
    }

    // Registro en consola para verificación
    console.log('Solicitud recibida exitosamente:', {
      marca,
      modelo,
      anio,
      repuesto,
      vin,
      tieneFoto: Boolean(foto_url),
      cliente_whatsapp
    });

    // Respuesta exitosa
    return res.status(200).json({ 
      message: 'Solicitud enviada con éxito' 
    });

  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor al procesar la solicitud' 
    });
  }
});

// Puerto dinámico para Render / Producción
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de RepuestoExpress ejecutándose en el puerto ${PORT}`);
});
