import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mysql from "mysql2";
import multer from "multer";
import path from "path";
import { constants } from "buffer";
import bcrypt from 'bcrypt';
import fs from "fs";



const app = express();

const port = 3000;


app.use(cors());

app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));



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



let clients = [];

app.post("/scanner", (req, res) => {
  let { barcode, image } = req.body;
  const cleanBarcode = String(barcode).trim();  

  const sql = `SELECT item_name FROM barcodes WHERE barcode = ?`;
  db.query(sql, [cleanBarcode], (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ success: false });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const item = results[0].item_name;

    const data = JSON.stringify({ barcode: cleanBarcode, name: item, image });
    clients.forEach(client => client.write(`data: ${data}\n\n`));

    res.json({ success: true, barcode: cleanBarcode, name: item, image });
  });
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


// Get all items
app.get("/items", (req, res) => {
  db.query("SELECT * FROM items", (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(results);
  });
});

// Add item
app.post("/items", (req, res) => {
  const { barcode, item_name, categories, unit, quantity, price } = req.body;

  if (!barcode || !item_name || !categories || !unit || !quantity ||!price || isNaN(quantity) || quantity <= 0 || isNaN(price) || price <= 0) {
    return res.status(400).json({ message: "All fields required" });
  }

  const sql = "INSERT INTO items (barcode, item_name, categories, unit, quantity, price) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [barcode, item_name, categories, unit, quantity, price], (err, result) => {
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


// setup storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {

  
    cb(null, "uploads/"); 
  },
  filename: function (req, file, cb) {
    cb(null, (file.originalname)); 
  },
});

const upload = multer({ storage: storage });

app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ message: "DB error" });
    }
    res.json(results);
  });
});


app.post("/products", upload.single("image"), (req, res) => {
  let { product_name, price } = req.body;

  if (!product_name || !price || isNaN(price) || !req.file) {
    return res.status(400).json({
      message: "All fields are required and price must be a number",
    });
  }
  console.log(req.file)

  price = parseInt(price, 10);

  const fileName = req.file.filename; 

  const sql = "INSERT INTO products (product_name, price, image) VALUES (?, ?, ?)";

  db.query(sql, [product_name, price, fileName], (err, results) => {
    if (err) {
      console.error("DB insert error:", err);
      return res.status(500).json({ message: "DB insert error" });
    }
    res.json({
      message: "Product added successfully",
      productId: results.insertId,
      imageFile: fileName, 
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

// ====================
// TOTAL REPORT
// ====================
app.get('/reports', (req, res) => {
  const sql = `
    SELECT 
      SUM(rev.total_revenue) AS totalRevenue,
      SUM(COALESCE(exp.total_expenses, 0)) AS totalExpenses,
      SUM(rev.total_revenue) - SUM(COALESCE(exp.total_expenses, 0)) AS totalProfit
    FROM (
        SELECT 
          MONTH(s.sales_date) AS month_num,
          YEAR(s.sales_date) AS year_num,
          SUM(s.total) AS total_revenue
        FROM sales s
        WHERE YEAR(s.sales_date) = YEAR(CURDATE())
        GROUP BY YEAR(s.sales_date), MONTH(s.sales_date)
    ) rev
    LEFT JOIN (
        SELECT 
          MONTH(i.date) AS month_num,
          YEAR(i.date) AS year_num,
          SUM(i.price * i.quantity) AS total_expenses
        FROM items i
        WHERE YEAR(i.date) = YEAR(CURDATE())
        GROUP BY YEAR(i.date), MONTH(i.date)
    ) exp
    ON rev.month_num = exp.month_num AND rev.year_num = exp.year_num;
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });

    const { totalRevenue, totalExpenses, totalProfit } = results[0];

    const growthSql = `
      SELECT MONTH(sales_date) AS month_num, SUM(total) AS revenue
      FROM sales
      WHERE YEAR(sales_date) = YEAR(CURDATE())
      GROUP BY MONTH(sales_date)
      ORDER BY MONTH(sales_date) ASC;
    `;

    db.query(growthSql, (err, growthResults) => {
      if (err) return res.status(500).json({ message: "DB error" });

      let prevRev = null;
      const growthRates = [];

      growthResults.forEach(r => {
        const revenue = parseFloat(r.revenue) || 0;
        if (prevRev !== null && prevRev > 0) {
          const growth = ((revenue - prevRev) / prevRev) * 100;
          growthRates.push(growth);
        }
        prevRev = revenue;
      });

      const avgGrowth = growthRates.length > 0
        ? (growthRates.reduce((a, b) => a + b, 0) / growthRates.length).toFixed(2)
        : "0.00";

      res.json({
        totalRevenue,
        totalExpenses,
        totalProfit,
        avgGrowth
      });
    });
  });
});

// ====================
// MONTHLY REPORT
// ====================
app.get('/reports/monthly', (req, res) => {
  const sql = `
    SELECT 
        rev.month_num,
        rev.month,
        rev.total_revenue,
        COALESCE(exp.total_expenses, 0) AS total_expenses,
        (rev.total_revenue - COALESCE(exp.total_expenses, 0)) AS profit
    FROM (
        SELECT 
            MONTH(s.sales_date) AS month_num,
            MONTHNAME(s.sales_date) AS month,
            SUM(s.total) AS total_revenue
        FROM sales s
        WHERE YEAR(s.sales_date) = YEAR(CURDATE())
        GROUP BY MONTH(s.sales_date), MONTHNAME(s.sales_date)
    ) rev
    LEFT JOIN (
        SELECT 
            MONTH(i.date) AS month_num,
            SUM(i.price * i.quantity) AS total_expenses
        FROM items i
        WHERE YEAR(i.date) = YEAR(CURDATE())
        GROUP BY MONTH(i.date)
    ) exp
    ON rev.month_num = exp.month_num
    ORDER BY rev.month_num ASC;
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });

    let prevRev = null;
    const results = rows.map(r => {
      const revenue = parseFloat(r.total_revenue) || 0;
      const expenses = parseFloat(r.total_expenses) || 0;
      const profit = parseFloat(r.profit) || 0;

      const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : "0.00";
      let growth = "—";

      if (prevRev !== null && prevRev > 0) {
        growth = ((revenue - prevRev) / prevRev * 100).toFixed(2);
      }
      prevRev = revenue;

      return {
        month: r.month,
        revenue,
        expenses,
        profit,
        margin,
        growth
      };
    });
    
    res.json(results);
  });
});

// ====================
// YEARLY REPORT
// ====================
app.get('/report/yearly', (req, res) => {
  const sql = `
    SELECT 
      SUM(rev.total_revenue) AS totalRevenue,
      SUM(COALESCE(exp.total_expenses, 0)) AS totalExpenses,
      SUM(rev.total_revenue) - SUM(COALESCE(exp.total_expenses, 0)) AS totalProfit
    FROM (
        SELECT 
          YEAR(s.sales_date) AS year_num,
          SUM(s.total) AS total_revenue
        FROM sales s
        GROUP BY YEAR(s.sales_date)
    ) rev
    LEFT JOIN (
        SELECT 
          YEAR(i.date) AS year_num,
          SUM(i.price * i.quantity) AS total_expenses
        FROM items i
        GROUP BY YEAR(i.date)
    ) exp
    ON rev.year_num = exp.year_num;
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });

    const { totalRevenue, totalExpenses, totalProfit } = results[0];

    const growthSql = `
      SELECT YEAR(sales_date) AS year_num, SUM(total) AS revenue
      FROM sales
      GROUP BY YEAR(sales_date)
      ORDER BY YEAR(sales_date) ASC;
    `;

    db.query(growthSql, (err, growthResults) => {
      if (err) return res.status(500).json({ message: "DB error" });

      let prevRev = null;
      const growthRates = [];

      growthResults.forEach(r => {
        const revenue = parseFloat(r.revenue) || 0;
        if (prevRev !== null && prevRev > 0) {
          const growth = ((revenue - prevRev) / prevRev) * 100;
          growthRates.push(growth);
        }
        prevRev = revenue;
      });

      const avgGrowth = growthRates.length > 0
        ? (growthRates.reduce((a, b) => a + b, 0) / growthRates.length).toFixed(2)
        : "0.00";

      res.json({
        totalRevenue,
        totalExpenses,
        totalProfit,
        avgGrowth
      });
    });
  });
});

app.get('/yearly', (req, res)=>{
  const sql =`
  SELECT 
    rev.year_num,
    rev.year,
    rev.total_revenue,
    COALESCE(exp.total_expenses, 0) AS total_expenses,
    (rev.total_revenue - COALESCE(exp.total_expenses, 0)) AS profit
FROM (
    SELECT 
        YEAR(s.sales_date) AS year_num,
        YEAR(s.sales_date) AS year,
        SUM(s.total) AS total_revenue
    FROM sales s
    GROUP BY YEAR(s.sales_date)
) rev
LEFT JOIN (
    SELECT 
        YEAR(i.date) AS year_num,
        SUM(i.price * i.quantity) AS total_expenses
    FROM items i
    GROUP BY YEAR(i.date)
) exp
ON rev.year_num = exp.year_num
ORDER BY rev.year_num ASC;

  `;
  db.query(sql,(err, rows)=>{
    if(err) return res.status(500).json({message: 'DB error'});
    
    let prevRev =null
        const results = rows.map(r => {
      const revenue = parseFloat(r.total_revenue) || 0;
      const expenses = parseFloat(r.total_expenses) || 0;
      const profit = parseFloat(r.profit) || 0;

      const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : "0.00";
      let growth = "—";

      if (prevRev !== null && prevRev > 0) {
        growth = ((revenue - prevRev) / prevRev * 100).toFixed(2);
      }
      prevRev = revenue;

      return {
        year: r.year,
        revenue,
        expenses,
        profit,
        margin,
        growth
      };
    });
    
    res.json(results);
  });
})

//Daily records
app.get('/records', (req, res)=>{
  const sql = `SELECT 
  COALESCE(SUM(quantity),0) AS total_quantity,
  COALESCE(SUM(total),0) AS total_sales
  FROM sales
  WHERE DATE(sales_date) = CURDATE()
  `;
  db.query(sql, (err,results)=>{
    if(err) return res.status(500).json({message: 'DB error'})
     res.json(results[0])
  })
 
})

//barcode generator
app.post('/save-barcode', (req, res) => {
  const { item_name, barcode } = req.body;
 
  if (!item_name || !barcode) {
    return res.status(400).json({ message: 'Missing item name or barcode' });
  }

  
  const sqlCheck = `SELECT * FROM barcodes WHERE barcode = ?`;
  db.query(sqlCheck, [barcode], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'DB error' });
    }

    if (results.length > 0) {

      return res.json({ message: ' Barcode already exists!' });
    }

    const sqlInsert = `INSERT INTO barcodes (item_name, barcode, date) VALUES (?, ?, NOW())`;
    db.query(sqlInsert, [item_name, barcode], (err2, insertResult) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ message: 'DB error on insert' });
      }
      res.json({ message: ' Barcode saved successfully!', id: insertResult.insertId });
    });
  });
});
const uploadProfile = multer({ storage: multer.diskStorage({
  destination: "uploads/profiles",
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})});
// employee
app.get("/employee", (req, res) => {
  db.query("SELECT * FROM employee_account", (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ message: "DB error" });
    }

    const employees = results.map(emp => ({
      id: emp.id,
      fname: emp.fname,
      lname: emp.lname,
      address: emp.address,
      contact: emp.contact,
      profileImage: emp.profileImage
        ? `uploads/${emp.profileImage}`
        : `uploads/default.png`
    }));

    res.json(employees);
  });
});

// ==========================
// Create employee
// ==========================
app.post("/employee", upload.single("profilePic"), async (req, res) => {
  console.log("req.body:", req.body);
  console.log("req.file:", req.file);
  const { fname, lname, contact, address, username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const checkUser = "SELECT * FROM employee_account WHERE username = ?";
    db.query(checkUser, [username], async (err, results) => {
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const hashpassword = await bcrypt.hash(password, 10);

      const profileImage = req.file ? req.file.filename : "default.png";

      const sql = `
        INSERT INTO employee_account 
        (fname, lname, contact, address, username, password, profileImage) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [fname, lname, contact, address, username, hashpassword, profileImage],
        (err, results) => {
          if (err) {
            console.error("Insert Error:", err);
            return res.status(500).json({ message: "Database insert error" });
          }
          res.json({
            message: "Employee created successfully",
            employeeId: results.insertId,
            imageFile: profileImage
          });
        }
      );
    });
  } catch (err) {
    console.error("Hashing Error:", err);
    res.status(500).json({ message: "Error hashing password" });
  }
});

// ==========================
// Delete employee + remove file
// ==========================
app.delete("/employee/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT profileImage FROM employee_account WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (results.length === 0) return res.status(404).json({ message: "Not found" });

    const file = results[0].profileImage;
    if (file && file !== "default.png") {
      fs.unlink(`uploads/${file}`, () => {});
    }

    db.query("DELETE FROM employee_account WHERE id = ?", [id], err => {
      if (err) return res.status(500).json({ message: "Delete failed" });
      res.json({ message: "Employee deleted" });
    });
  });
});

// ==========================
// Change password
// ==========================
app.patch("/employee/:id/password", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) return res.status(400).json({ message: "Password required" });

  try {
    const hashpassword = await bcrypt.hash(password, 10);
    db.query("UPDATE employee_account SET password = ? WHERE id = ?", [hashpassword, id], err => {
      if (err) return res.status(500).json({ message: "Update failed" });
      res.json({ message: "Password updated" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error hashing password" });
  }
});



//login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and Password required" });
  }

  const ownerSql = "SELECT * FROM owner WHERE username = ?";
  const staffSql = "SELECT * FROM employee_account WHERE username = ?";

  
// ==========================
// OWNER
// ==========================
  db.query(ownerSql, [username], async (err, ownerResults) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Server Error" });
    }

    if (ownerResults.length > 0) {
     
      const owner = ownerResults[0];


      if (password === owner.password) {
        return res.status(200).json({
          success: true,
          message: "Owner login successful",
          role: "owner",
          userId: owner.id,
        });
      } else {
        return res.status(401).json({ message: "Wrong password for owner" });
      }
    }


// ==========================
// STAFF
// ==========================
    db.query(staffSql, [username], async (err, staffResults) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Server Error" });
      }

      if (staffResults.length === 0) {
        return res.status(404).json({ message: "Username does not exist" });
      }

      const staff = staffResults[0];
      const isMatch = await bcrypt.compare(password, staff.password);

      if (isMatch) {
        return res.status(200).json({
          success: true,
          message: "Staff login successful",
          role: staff.role || "staff",
          userId: staff.id,
        });
      } else {
        return res.status(401).json({ message: "Wrong password for staff" });
      }
    });
  });
});



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
