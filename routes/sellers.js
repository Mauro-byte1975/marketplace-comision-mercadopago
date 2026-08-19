const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const db = require("../db");

const router = express.Router();

// Paso 1: mandamos al vendedor a autorizar nuestra app en Mercado Pago
router.get("/connect", (req, res) => {
  const state = crypto.randomBytes(8).toString("hex");
  const redirectUri = `${process.env.BASE_URL}/vendedores/callback`;

  const authUrl =
    `https://auth.mercadopago.com.ar/authorization` +
    `?client_id=${process.env.MP_CLIENT_ID}` +
    `&response_type=code` +
    `&platform_id=mp` +
    `&state=${state}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.redirect(authUrl);
});

// Paso 2: Mercado Pago nos devuelve el vendedor con un "code" que cambiamos por su token
router.get("/callback", async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.status(400).send("El vendedor no autorizó la conexión o hubo un error.");
  }

  try {
    const redirectUri = `${process.env.BASE_URL}/vendedores/callback`;

    const tokenResponse = await axios.post("https://api.mercadopago.com/oauth/token", {
      client_id: process.env.MP_CLIENT_ID,
      client_secret: process.env.MP_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const { access_token, refresh_token, user_id, public_key, expires_in } = tokenResponse.data;

    db.upsertSeller({
      mp_user_id: user_id,
      access_token,
      refresh_token,
      public_key,
      connected_at: new Date().toISOString(),
      expires_in,
    });

    res.redirect("/vender.html?conectado=1");
  } catch (err) {
    console.error("Error en callback de OAuth:", err.response?.data || err.message);
    res.status(500).send("No pudimos completar la conexión con Mercado Pago. Probá de nuevo.");
  }
});

router.get("/", (req, res) => {
  const sellers = db.getSellers().map((s) => ({
    id: s.id,
    mp_user_id: s.mp_user_id,
    connected_at: s.connected_at,
  }));
  res.json(sellers);
});

module.exports = router;
