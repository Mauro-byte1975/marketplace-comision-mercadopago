const express = require("express");
const axios = require("axios");
const db = require("../db");

const router = express.Router();

// Crea la preferencia de pago (Checkout Pro) a nombre del vendedor,
// con nuestra comision incluida via marketplace_fee.
router.post("/:productId", async (req, res) => {
    const { productId } = req.params;
    const quantity = Number(req.body.quantity || 1);

              const product = db.getProduct(productId);
    if (!product) {
          return res.status(404).json({ error: "Producto no encontrado." });
    }

              const seller = db.getSeller(product.seller_id);
    if (!seller) {
          return res.status(400).json({ error: "El vendedor de este producto no está conectado." });
    }

              const commissionPercent = Number(process.env.COMMISSION_PERCENT || 10);
    const totalAmount = Number(product.unit_price) * quantity;
    const marketplaceFee = Math.round(totalAmount * (commissionPercent / 100) * 100) / 100;

              try {
                    const preference = await axios.post(
                            "https://api.mercadopago.com/checkout/preferences",
                      {
                                items: [
                                  {
                                                id: String(product.id),
                                                title: product.title,
                                                description: product.description,
                                                currency_id: "ARS",
                                                quantity,
                                                unit_price: Number(product.unit_price),
                                                ...(product.image_url ? { picture_url: product.image_url } : {}),
                                  },
                                          ],
                                marketplace_fee: marketplaceFee,
                                back_urls: {
                                            success: `${process.env.BASE_URL}/gracias.html`,
                                            failure: `${process.env.BASE_URL}/index.html`,
                                            pending: `${process.env.BASE_URL}/gracias.html`,
                                },
                                auto_return: "approved",
                                notification_url: `${process.env.BASE_URL}/webhooks/mercadopago`,
                                external_reference: `product-${product.id}-${Date.now()}`,
                      },
                      {
                                headers: { Authorization: `Bearer ${seller.access_token}` },
                      }
                          );

      db.addOrder({
              product_id: product.id,
              seller_id: seller.id,
              quantity,
              total_amount: totalAmount,
              commission_amount: marketplaceFee,
              preference_id: preference.data.id,
              status: "pending",
              created_at: new Date().toISOString(),
      });

      res.json({
              init_point: preference.data.init_point,
              commission_amount: marketplaceFee,
      });
              } catch (err) {
                    console.error("Error creando preferencia:", err.response?.data || err.message);
                    res.status(500).json({ error: "No se pudo generar el link de pago." });
              }
});

module.exports = router;
