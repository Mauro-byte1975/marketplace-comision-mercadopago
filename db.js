// Base de datos simple en un archivo JSON. Suficiente para arrancar y validar
// el modelo de negocio. Cuando haya volumen real, conviene migrar a Postgres/MySQL.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// En Render, DATA_DIR apunta al disco persistente montado (ver render.yaml).
// Sin esa variable (ej. desarrollo local) usamos la carpeta del proyecto.
const DATA_DIR = process.env.DATA_DIR || __dirname;
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, "data.json");

function load() {
    if (!fs.existsSync(DB_FILE)) {
          const initial = { sellers: [], products: [], orders: [] };
          fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
          return initial;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function save(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function nextId(list) {
    return list.length ? Math.max(...list.map((i) => i.id)) + 1 : 1;
}

module.exports = {
    // Vendedores conectados via OAuth
    getSellers() {
          return load().sellers;
    },
    getSeller(id) {
          return load().sellers.find((s) => s.id === Number(id));
    },
    upsertSeller(seller) {
          const data = load();
          const idx = data.sellers.findIndex((s) => s.mp_user_id === seller.mp_user_id);
          if (idx >= 0) {
                  data.sellers[idx] = { ...data.sellers[idx], ...seller };
                  if (!data.sellers[idx].seller_token) {
                            data.sellers[idx].seller_token = crypto.randomBytes(16).toString("hex");
                  }
                  save(data);
                  return data.sellers[idx];
          }
          seller.id = nextId(data.sellers);
          seller.seller_token = crypto.randomBytes(16).toString("hex");
          data.sellers.push(seller);
          save(data);
          return seller;
    },

    // Productos publicados por los vendedores
    getProducts() {
          return load().products;
    },
    getProductsBySeller(sellerId) {
          return load().products.filter((p) => p.seller_id === Number(sellerId));
    },
    getProduct(id) {
          return load().products.find((p) => p.id === Number(id));
    },
    addProduct(product) {
          const data = load();
          product.id = nextId(data.products);
          data.products.push(product);
          save(data);
          return product;
    },
    deleteProduct(id) {
          const data = load();
          data.products = data.products.filter((p) => p.id !== Number(id));
          save(data);
    },

    // Ordenes / ventas
    getOrders() {
          return load().orders;
    },
    addOrder(order) {
          const data = load();
          order.id = nextId(data.orders);
          data.orders.push(order);
          save(data);
          return order;
    },
    updateOrderByPreference(preferenceId, patch) {
          const data = load();
          const idx = data.orders.findIndex((o) => o.preference_id === preferenceId);
          if (idx >= 0) {
                  data.orders[idx] = { ...data.orders[idx], ...patch };
                  save(data);
                  return data.orders[idx];
          }
          return null;
    },
};
