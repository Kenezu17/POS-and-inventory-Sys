import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mysql from "mysql2";

const app = express();

const port = 3000;


app.use(cors());

app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static("public"));


let clients = [];

app.post("/scanner", (req, res) => {
  const { barcode, image } = req.body;

  const data = JSON.stringify({ barcode, image });
  clients.forEach(client => client.write(`data: ${data}\n\n`));

  res.json({ success: true });
});

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);
  req.on("close", () => {
    clients = clients.filter(c => c !== res);
  });
});


const db = mysql.createConnection({
 host: 'localhost',
 user: 'root',
 password: '',
 database: 'coffee_shop' 
})

db.connect(err =>{
  if(err) throw err;
  console.log("MySQL  Connected")
})

// Get all items
app.get("/items", (req, res) => {
  db.query("SELECT * FROM items", (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(results);
  });
});

// Add item
app.post("/items", (req, res) => {
  const { barcode, item_name, categories, unit, quantity } = req.body;

  if (!barcode || !item_name || !categories || !unit || !quantity) {
    return res.status(400).json({ message: "All fields required" });
  }

  const sql = "INSERT INTO items (barcode, item_name, categories, unit, quantity) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [barcode, item_name, categories, unit, quantity], (err, result) => {
    if (err) return res.status(500).json({ message: "Insert Failed" });
    res.json({ message: "Item added successfully "});
  });
});

// Delete item
app.delete("/items/:id", (req, res) => {
  db.query("DELETE FROM items WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete Failed" });
    res.json({ message: "Item removed successfully " });
  });
});
// restock
app.put("/items/:id/restock", (req, res) => {
  const { quantity } = req.body;
  const id = req.params.id;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: "Quantity must be greater than 0" });
  }

  db.query("UPDATE items SET quantity = quantity + ? WHERE id = ?", [quantity, id], (err) => {
    if (err) return res.status(500).json({ message: "Restock Failed" });

    
    db.query("SELECT quantity FROM items WHERE id = ?", [id], (err, results) => {
      if (err) return res.status(500).json({ message: "Restock Failed" });

      res.json({
        message: "Restock successful",
        newQuantity: results[0].quantity
      });
    });
  });
});

app.get('/products', (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ message: "DB error" });
    }
    res.json(results);
  });
});

app.post("/products", (req, res) => {
  let { product_name, price, image } = req.body;

  if (!product_name || !price || isNaN(price) || !image) {
    return res.status(400).json({
      message: "All fields are required and price must be a number",
    });
  }

  price = parseInt(price, 10); 

  const sql = "INSERT INTO products (product_name, price, image) VALUES (?, ?, ?)";
  db.query(sql, [product_name, price, image], (err, results) => {
    if (err) {
      console.error("DB insert error:", err);
      return res.status(500).json({ message: "DB insert error" });
    }
    res.json({
      message: "Product added successfully",
      productId: results.insertId, 
    });
  });
});
//update the products
app.put("/products/:id", (req, res) => {
  let { price } = req.body;
  const { id } = req.params;

  if (!price || isNaN(price)) {
    return res.status(400).json({ message: "Price must be a valid number" });
  }

  price = parseInt(price, 10);

  const sql = "UPDATE products SET price = ? WHERE id = ?";
  db.query(sql, [price, id], (err) => {
    if (err) return res.status(500).json({ message: "DB update error" });
    res.json({ message: "Price updated successfully" });
  });
});

// Delete product
app.delete("/products/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ message: "DB delete error" });
    res.json({ message: "Product deleted successfully" });
  });
});


//login
app.post('/admin', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: 'Username and Password required' });
  }

  const sql = `SELECT * FROM owner WHERE username = ?`;

  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ message: 'Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).send({ message: 'Username does not exist' });
    }

    const user = results[0];

    if (user.password === password) {
      
      return res.status(200).send({ message: 'Login Successful' });
    } else {
      return res.status(401).send({ message: 'Wrong password' });
    }
  });


})

// sales chart
app.get("/sales",(req, res)=>{
 const query =  `
    SELECT 
      YEAR(sales_date) AS year,
      MONTH(sales_date) AS month,
      SUM(total) AS revenue
    FROM sales
    GROUP BY YEAR(sales_date), MONTH(sales_date)
    ORDER BY year, month;
  `;

  db.query(query,(err, results) =>{
  if(err){
     return res.status(500).json({ error: err.message });
  }
   res.json(results);
})
})



app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
