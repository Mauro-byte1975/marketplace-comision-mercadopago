require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const sellersRoutes = require("./routes/sellers");
const productsRoutes = require("./routes/products");
const checkoutRoutes = require("./routes/checkout");
const webhooksRoutes = require("./routes/webhooks");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Salud del servidor (útil para chequear que está vivo)
app.get("/health", (req, res) => {
  res.json({ ok: true, commission_percent: Number(process.env.COMMISSION_PERCENT || 10) });
});

app.use("/vendedores", sellersRoutes);
app.use("/api/productos", productsRoutes);
app.use("/checkout", checkoutRoutes);
app.use("/webhooks", webhooksRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Marketplace corriendo en el puerto ${PORT}`);
  console.log(`Comisión configurada: ${process.env.COMMISSION_PERCENT || 10}%`);
});
