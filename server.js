const express = require('express');
const path = require('path');
const app = express();

// 1. Servir archivos estáticos (HTML, CSS, imágenes como logo.png)
app.use(express.static(__dirname));

// 2. Definir la ruta principal para index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Arrancar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
