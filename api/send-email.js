const nodemailer = require('nodemailer');
const formidable = require('formidable');
const fs = require('fs').promises;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  console.log('Solicitud recibida en /api/send-email');
  console.log('Encabezados de la solicitud:', req.headers);

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error al parsear el formulario:', err);
      return res.status(500).json({ error: 'Error al parsear el formulario', details: err.message });
    }

    const to = fields.clientEmail?.[0];
    const from = fields.predefinedEmail?.[0];
    const subject = 'Cotización Packvision';

    console.log('Campos recibidos:', { to, from });

    if (!to || !from) {
      console.error('Faltan datos requeridos:', { to, from });
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    let pdfBase64;
    try {
      const pdfFile = files.pdf?.[0];
      if (!pdfFile) {
        console.error('No se encontró el archivo PDF');
        return res.status(400).json({ error: 'No se encontró el archivo PDF' });
      }

      const pdfBuffer = await fs.readFile(pdfFile.filepath);
      pdfBase64 = pdfBuffer.toString('base64');
      console.log('PDF convertido a base64, tamaño:', pdfBuffer.length, 'bytes');
    } catch (error) {
      console.error('Error al leer el archivo PDF:', error);
      return res.status(500).json({ error: 'Error al leer el archivo PDF', details: error.message });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      text: 'Adjunto encontrarás el archivo PDF con tu cotización.',
      attachments: [
        {
          filename: 'cotizacion.pdf',
          content: pdfBase64,
          encoding: 'base64',
        },
      ],
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Correo enviado con éxito a:', to);
      res.status(200).json({ message: 'Correo enviado con éxito' });
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      res.status(500).json({ error: 'Error al enviar el correo', details: error.message });
    }
  });
};