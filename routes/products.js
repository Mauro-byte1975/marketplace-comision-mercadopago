const express = require("express");
const db = require("../db");

const router = express.Router();

// Listar productos publicados (lo que se muestra en el catálogo público)
router.get("/", (req, res) => {
  res.json(db.getProducts());
});

// Publicar un producto nuevo a nombre de un vendedor ya conectado
router.post("/", (req, res) => {
  const { seller_id, title, description, unit_price } = req.body;

  if (!seller_id || !title || !unit_price) {
    return res.status(400).json({ error: "Faltan datos: seller_id, title y unit_price son obligatorios." });
  }

  const seller = db.getSeller(seller_id);
  if (!seller) {
    return res.status(404).json({ error: "Ese vendedor no existe o todavía no conectó su cuenta de Mercado Pago." });
  }

  const product = db.addProduct({
    seller_id: Number(seller_id),
    title,
    description: description || "",
    unit_price: Number(unit_price),
    created_at: new Date().toISOString(),
  });

  res.status(201).json(product);
});

module.exports = router;
