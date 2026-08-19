const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/", (req, res) => {
    res.json(db.getProducts());
});

// Productos de un vendedor puntual (para su panel), requiere su token
router.get("/mios", (req, res) => {
    const { seller_id, token } = req.query;
    const seller = db.getSeller(seller_id);

             if (!seller || !token || seller.seller_token !== token) {
                   return res.status(403).json({ error: "No autorizado." });
             }

             res.json(db.getProductsBySeller(seller_id));
});

// Publicar un producto nuevo a nombre de un vendedor ya conectado
router.post("/", (req, res) => {
    const { seller_id, token, title, description, unit_price, image_url } = req.body;

              if (!seller_id || !token || !title || !unit_price) {
                    return res.status(400).json({ error: "Faltan datos: seller_id, token, title y unit_price son obligatorios." });
              }

              const seller = db.getSeller(seller_id);
    if (!seller) {
          return res.status(404).json({ error: "Ese vendedor no existe o todavía no conectó su cuenta de Mercado Pago." });
    }

              if (seller.seller_token !== token) {
                    return res.status(403).json({ error: "Token inválido. Volvé a conectar tu cuenta desde /vender.html." });
              }

              const product = db.addProduct({
                    seller_id: Number(seller_id),
                    title,
                    description: description || "",
                    unit_price: Number(unit_price),
                    image_url: image_url || "",
                    created_at: new Date().toISOString(),
              });

              res.status(201).json(product);
});

// Eliminar un producto (el vendedor dueño con su token, o uso administrativo sin token)
router.delete("/:id", (req, res) => {
    const { token } = req.query;
    const product = db.getProduct(req.params.id);

                if (product && token) {
                      const seller = db.getSeller(product.seller_id);
                      if (!seller || seller.seller_token !== token) {
                              return res.status(403).json({ error: "No autorizado para borrar este producto." });
                      }
                }

                db.deleteProduct(req.params.id);
    res.status(204).end();
});

module.exports = router;
