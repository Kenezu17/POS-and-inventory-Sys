document.addEventListener('DOMContentLoaded', function () {

  // ==============================
  // Sidebar Toggle
  // ==============================
  const menuBtn = document.getElementById("menu-btn");
  const sidebar = document.querySelector(".sidebar");
  menuBtn?.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  // ==============================
  // Search
  // ==============================

  const inventorySearch = document.querySelector('#inventory .search input');

    inventorySearch?.addEventListener('input', () => {
    const query = inventorySearch.value.toLowerCase();

    document.querySelectorAll('.inventory-list .card').forEach(card => {
     const name = card.querySelector('.item-title').textContent.toLowerCase();

     if (name.includes(query)) {
       card.style.display = 'flex';
     } else {
       card.style.display = 'none';
     }
   });
});

 const ProductSearch = document.querySelector('#products .sh input');

    ProductSearch?.addEventListener('input', () => {
    const query = ProductSearch.value.toLowerCase();

    document.querySelectorAll('.i-list .cd').forEach(card => {
     const name = card.querySelector('.item-name').textContent.toLowerCase();

     if (name.includes(query)) {
       card.style.display = 'flex';
     } else {
       card.style.display = 'none';
     }
   });
});


  // ==============================
  // Section Switching
  // ==============================
  const productsBtn = document.querySelector('.products-btn');
  const invbtn = document.querySelector('.inv-btn');
  const inventorySection = document.getElementById('inventory');
  const productsSection = document.getElementById('products');

  function closeall() {
    document.querySelector('.panel')?.classList.remove('active');
    document.querySelector('.side-Panel')?.classList.remove('active');
  }

  inventorySection.style.display = "block";
  productsSection.style.display = "none";

  productsBtn?.addEventListener("click", () => {
    inventorySection.style.display = "none";
    productsSection.style.display = "flex";
    closeall();
  });

  invbtn?.addEventListener("click", () => {
    productsSection.style.display = "none";
    inventorySection.style.display = "flex";
    closeall();
  });

  // ==============================
  // Highlight Active Nav Link
  // ==============================
  const navLinks = document.querySelectorAll(".nav a");
  const currentpage = location.pathname.split('/').pop();
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentpage) {
      link.classList.add('active');
    }
  });

  // ==============================
  // Product Modal
  // ==============================
  const addBtn = document.querySelector('.add-BTN');
  const modal = document.querySelector('.side-Panel');
  const closeBtn = document.querySelector('.p-close');

  addBtn?.addEventListener('click', () => modal.classList.add('active'));
  closeBtn?.addEventListener('click', () => modal.classList.remove('active'));

  // ==============================
  // Inventory Panel
  // ==============================
  const additem = document.querySelector('.additem');
  const Panel = document.querySelector('.panel');
  const cl = document.querySelector('.close');

  additem?.addEventListener('click', () => Panel.classList.add('active'));
  cl?.addEventListener('click', () => Panel.classList.remove('active'));

  // ==============================
  // Inventory & Icons
  // ==============================
  const inventory = [];
  const itemtotal = document.querySelector(".item-total");
  const lowtotal = document.querySelector(".low-total");
  const cattotal = document.querySelector(".cat-total");
  const container = document.querySelector(".inventory-list");

  const select = document.getElementById('category');
  const icondisplay = document.getElementById('icons');

  const icon = {
    "coffee & beverages": '<i class="bi bi-cup-hot"></i>',
    "food & ingredients": '<i class="bi bi-egg"></i>',
    "consumables & supplies": '<i class="bi bi-basket"></i>',
    "equipment & tools": '<i class="bi bi-tools"></i>',
    "cleaning & maintenance": '<i class="bi bi-bucket-fill"></i>'
  };

  if (select && icondisplay) {
    select.addEventListener('change', () => {
      icondisplay.innerHTML = icon[select.value] || "";
    });
    icondisplay.innerHTML = icon[select.value] || "";
  }

  let currentstock = null;

  async function loadinven() {
    try {
      const res = await fetch('http://localhost:3000/items');
      const data = await res.json();

      inventory.length = 0;
      data.forEach(item => inventory.push(item));

      update();
    } catch(err) {
      showmess("Failed to load items", 'error');
    }
  }

 function update() {
  itemtotal.textContent = inventory.length;
  lowtotal.textContent = inventory.filter(item => item.quantity <= 5).length;

  const categories = [...new Set(inventory.map(item => item.categories))];
  cattotal.textContent = categories.length;

  container.innerHTML = "";

  categories.forEach(cat => {
    inventory
      .filter(item => item.categories === cat)
      .forEach(item => {
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
          <div class="card-header">
            <div class="card-header-left">
              <div class="icon-circle">
                ${icon[item.categories] || '<i class="bi bi-question-circle"></i>'}
              </div>
              <div>
                <h2 class="item-title">${item.item_name}</h2>
                <p class="item-category">${item.categories}</p>
              </div>
            </div>
          </div>
          <div class="quantity" style="${item.quantity <= 5 ? 'color:red;' : ''}">
            ${item.quantity} <span>${item.unit} available</span>
          </div>
          <div class="actions">
            <button class="btn-restock" data-id="${item.id}">Restock</button>
            <button class="btn-remove">Remove</button>
          </div>
        `;

        container.appendChild(card);

        // Remove Item
        card.querySelector('.btn-remove').addEventListener('click', async () => {
          try {
            const res = await fetch(`http://localhost:3000/items/${item.id}`, { method: "DELETE" });
            const data = await res.json();
            showmess(data.message, res.ok ? 'successful' : 'error');
            loadinven();
          } catch(err) {
            showmess('Delete Failed', "error");
          }
        });

        // Restock Item (fixed)
        card.querySelector(".btn-restock").addEventListener("click", () => {
          const id = card.querySelector(".btn-restock").getAttribute("data-id");
          currentstock = inventory.find(i => i.id == id);
          document.getElementById("edit-restock").value = "";
          document.getElementById("restock-panel").style.display = "flex";
        });
      });
  });
}

// Save Restock (fixed)
document.querySelector('.Sve').addEventListener('click', async () => {
  const qty = parseInt(document.querySelector('#edit-restock').value);
  if (isNaN(qty) || qty < 1) {
    showmess("Enter valid quantity", 'error');
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/items/${currentstock.id}/restock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: qty })
    });

    const data = await res.json();
    showmess(`${data.message}. New Quantity: ${data.newQuantity}`, res.ok ? 'successful' : 'error');

    document.getElementById("restock-panel").style.display = "none";
    loadinven();
  } catch (err) {
    showmess("Restock Failed", "error");
  }
});


document.querySelector(".cancel").addEventListener("click", () => {
  document.getElementById("restock-panel").style.display = "none";
});


loadinven();


  // ==============================
  // Add Inventory Item Form
  // ==============================
  document.querySelector('.item-form').addEventListener('submit', async function(e){
    e.preventDefault();

    const items = {
      barcode: document.getElementById('barcode').value.trim(),
      item_name: document.getElementById('p-name').value.trim(),
      price: parseFloat(document.getElementById('p-price').value.trim()),
      categories: document.getElementById('category').value.trim(),
      quantity: parseInt(document.getElementById('qty').value),
      unit: document.getElementById('unit').value.trim()
    }

    if ( !items.item_name || !items.categories ||!items.price ||isNaN(items.price || isNaN(items.quantity) || items.quantity < 1 || !items.unit)) {
      showmess("Please complete all fields properly", "error");
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/items', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items)
      });
      const data = await res.json();
      showmess(data.message, res.ok ? 'successful' : 'error');
      loadinven();
    } catch(err) {
      showmess("Server error", 'error');
    }

    document.getElementById('barcode').value = "";
    document.getElementById('p-name').value = "";
    document.getElementById('qty').value = "";
    document.getElementById('unit').value = "";
    document.getElementById('category').value = "";
    document.getElementById('p-price').value = "";
    if (icondisplay) icondisplay.innerHTML = "";
  });

// ==============================
// Products Section
// ==============================
const productImageInput = document.getElementById("productImage");
const productList = document.querySelector(".i-list");
let selectedImageData = null;
let currentCard = null; 


productImageInput?.addEventListener("change", () => {
    const file = productImageInput.files[0];
    if (!file) {
      selectedImageData = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedImageData = e.target.result;
    };
    reader.readAsDataURL(file);
  });
function addProductCard(id, name, price, imageData) {
  const card = document.createElement("article");
  card.className = "cd";
  card.dataset.id = id;
  card.dataset.basePrice = price;

  const imgTag = imageData
    ? `<img src="${imageData}" alt="${name}" style="width:130px; height:150px;">`
    : "";

  card.innerHTML = `
    <div class="cdh">
      <div class="card-left">
        ${imgTag}
        <div>
          <h2 class="item-name"><strong>${name}</strong></h2>
        </div>
      </div>
    </div>
    <div class="p-price">
      <span class="amount" style="font-size:1.75rem; font-weight:bold; color: black;">₱${price.toFixed(2)}</span>
      <span class="size">Large</span>
    </div>
    <div class="act">
      <button class="btn-edit" type="button">Edit</button>
      <button class="btn-reorder active" data-size="L">L</button>
      <button class="btn-reorder" data-size="M">M</button>
      <button class="btn-reorder" data-size="S">S</button>
    </div>
  `;


  const priceSpan = card.querySelector(".amount");
  const sizelabel = card.querySelector(".size");
  const buttons = card.querySelectorAll(".btn-reorder");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const size = btn.dataset.size;
      const basePrice = parseFloat(card.dataset.basePrice);
      let newPrice = basePrice;
      if (size === "M") newPrice = basePrice * 0.8;
      if (size === "S") newPrice = basePrice * 0.6;

      priceSpan.textContent = "₱" + newPrice.toFixed(2);
      sizelabel.textContent =
        size === "L" ? "Large" : size === "M" ? "Medium" : "Small";

      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });


  const editBtn = card.querySelector(".btn-edit");
  editBtn.addEventListener("click", () => {
    currentCard = card;
    document.getElementById("edit-price").value = card.dataset.basePrice;
    document.getElementById("edit-panel").style.display = "block";
  });

  productList.appendChild(card);
}

async function loadProducts() {
  try {
    const res = await fetch("http://localhost:3000/products");
    const products = await res.json();

    productList.innerHTML = "";
    products.forEach((p) => {
      const price = parseFloat(p.price);
      const imageUrl = p.image ? `http://localhost:3000/uploads/${p.image}` : null;
      addProductCard(p.id, p.product_name, price, imageUrl);
    });
  } catch (err) {
    showmess("Error loading products: " + err.message, "error");
  }
}

loadProducts();


document.querySelector(".p-save").addEventListener("click", async (e) => {
  e.preventDefault();
  const name = document.getElementById("productname").value.trim();
  const price = parseFloat(document.getElementById("price").value.trim());

  if (!name || isNaN(price) || price <= 0) {
    showmess("Please complete all fields with valid values.", "error");
    return;
  }
  if (!selectedImageData) {
    showmess("Please select an image", "error");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("product_name", name);
    formData.append("price", price);
    formData.append("image", document.getElementById("productImage").files[0]);

    const res = await fetch("http://localhost:3000/products", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) {
      showmess(result.message, "error");
      return;
    }

    showmess("Successfully added to database", "successful");


    const imageUrl = `http://localhost:3000/uploads/${result.imageFile}`;
    addProductCard(result.productId, name, price, imageUrl);

    document.getElementById("p-form").reset();
    selectedImageData = null;
  } catch (err) {
    showmess("Error saving product: " + err.message, "error");
  }
});




document.getElementById("edit-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentCard) return;

  const newPrice = parseFloat(document.getElementById("edit-price").value);
  if (isNaN(newPrice) || newPrice <= 0) {
    showmess("Invalid price", "error");
    return;
  }

  try {
    const productId = currentCard.dataset.id;
    const res = await fetch(`http://localhost:3000/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: newPrice }),
    });

    const result = await res.json();
    if (!res.ok) {
      showmess(result.message, "error");
      return;
    }

    currentCard.dataset.basePrice = newPrice;
    currentCard.querySelector(".amount").textContent =
      "₱" + newPrice.toFixed(2);

    showmess("Price updated successfully", "successful");
    document.getElementById("edit-panel").style.display = "none";
  } catch (err) {
    showmess("Error updating product: " + err.message, "error");
  }
});


document.querySelector(".btn-cancel").addEventListener("click", () => {
  document.getElementById("edit-panel").style.display = "none";
  currentCard = null;
});


document.querySelector(".btn-delete").addEventListener("click", async () => {
  if (!currentCard) return;
  const productId = currentCard.dataset.id;

  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    const res = await fetch(`http://localhost:3000/products/${productId}`, {
      method: "DELETE",
    });

    const result = await res.json();
    if (!res.ok) {
      showmess(result.message, "error");
      return;
    }

    productList.removeChild(currentCard);
    showmess("Product deleted successfully", "successful");
    document.getElementById("edit-panel").style.display = "none";
    currentCard = null;
  } catch (err) {
    showmess("Error deleting product: " + err.message, "error");
  }
});


  // ==============================
  // Toast Message
  // ==============================
  function showmess(message, type = "info"){
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background =
      type === 'successful' ? "#28a745":
      type === 'error'? "#dc3545" :
      "#333";
    toast.className = "show";

    setTimeout(() => {
      toast.className = toast.className.replace("show", "");
    }, 3000);
  }

  loadinven();

});
