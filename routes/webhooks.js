const express = require("express");
const axios = require("axios");
const db = require("../db");

const router = express.Router();

// Mercado Pago llama acá cada vez que cambia el estado de un pago.
router.post("/mercadopago", async (req, res) => {
  // Respondemos rápido siempre (Mercado Pago reintenta si no le contestás 200).
  res.sendStatus(200);

  try {
    const topic = req.query.topic || req.query.type || req.body.type;
    const paymentId = req.query.id || req.body.data?.id;

    if (topic !== "payment" || !paymentId) return;

    // Para leer el pago hace falta el access_token de ALGÚN vendedor conectado
    // (cualquiera sirve para pagos de su propia cuenta); acá usamos el primero
    // como ejemplo simple, pero en producción conviene guardar qué vendedor
    // generó cada preferencia y usar su token puntual.
    const sellers = db.getSellers();
    if (!sellers.length) return;

    const payment = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${sellers[0].access_token}` },
    });

    const preferenceId = payment.data.order?.id || payment.data.preference_id;
    const status = payment.data.status; // approved, pending, rejected, etc.

    if (preferenceId) {
      db.updateOrderByPreference(preferenceId, {
        status,
        payment_id: paymentId,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Error procesando webhook:", err.response?.data || err.message);
  }
});

module.exports = router;
