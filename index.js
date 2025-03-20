const express = require('express');
const sendEmail = require('./api/send-email');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.post('/api/send-email', sendEmail);

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});