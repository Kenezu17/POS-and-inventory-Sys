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
  // Section Switching
  // ==============================
  const productsBtn = document.querySelector('.products-btn');
  const invbtn = document.querySelector('.inv-btn');
  const inventorySection = document.getElementById('inventory');
  const productsSection = document.getElementById('products');

  function closeall() {
    document.querySelector('.panel').classList.remove('active');
    document.querySelector('.side-Panel').classList.remove('active');
  }

  inventorySection.style.display = "block";
  productsSection.style.display = "none";

   if (productsBtn) {
    productsBtn.addEventListener("click", () => {
      inventorySection.style.display = "none";
      productsSection.style.display = "flex";
      closeall();
    });
  }

 
  if (invbtn) {
    invbtn.addEventListener("click", () => {
      productsSection.style.display = "none";
      inventorySection.style.display = "flex";
      closeall();
    });
  }

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

  let currentstock = null 

  // ==============================
  // Update Inventory Display
  // ==============================
  function update() {
  
  itemtotal.textContent = inventory.length;
  lowtotal.textContent = inventory.filter(item => item.quantity <= 5).length;

  const categories = [...new Set(inventory.map(item => item.category))];
  cattotal.textContent = categories.length;


  container.innerHTML = "";

  categories.forEach(cat => {
    inventory
      .filter(item => item.category === cat)
      .forEach(item => {
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
          <div class="card-header">
            <div class="card-header-left">
              <div class="icon-circle">
                ${icon[item.category] || '<i class="bi bi-question-circle"></i>'}
              </div>
              <div>
                <h2 class="item-title">${item.name}</h2>
                <p class="item-category">${item.category}</p>
              </div>
            </div>
          </div>
          <div class="quantity">
            ${item.quantity} <span>${item.unit} available</span>
          </div>
          <div class="actions">
            <button class="btn-restock">Restock</button>
            <button class="btn-remove">Remove</button>
          </div>
        `;


        if (item.quantity <= 5) {
          card.querySelector(".quantity").style.color = "red";
        }

        container.appendChild(card);

        card.querySelector('.btn-remove').addEventListener('click', (e) => {
          e.preventDefault();

         const index= inventory.findIndex(inv => inv.id === item.id)
         if(index !== -1){
          inventory.splice(index,1)
         }
           update();
        });  
        card.querySelector('.btn-restock').addEventListener('click', () => {
          currentstock = item;
          restock_qty.value = "";
          restock_panel.style.display = "flex";
        });     
      });
  });
}

   const restock_panel = document.getElementById('restock-panel')
   const restock_form = document.getElementById('restock-form')
   const restock_qty = document.getElementById('edit-restock')
   restock_form.addEventListener("submit", e => {
  e.preventDefault();

  const qty = parseInt(restock_qty.value, 10);
  if (isNaN(qty) || qty <= 0) {
    showmess("Please enter a valid number greater than 0.", "error");
    return;
  }

  if (currentstock) {
    currentstock.quantity += qty;
    update();
  }

  restock_panel.style.display = "none";
  currentstock = null;
});

  document.querySelector(".cancel").addEventListener("click", () => {
  restock_panel.style.display = "none";
  currentstock = null;
});

  // ==============================
  // Add Item to Inventory
  // ==============================
  const Add = document.querySelector(".save");
  Add?.addEventListener('click', () => {
    try{
    const barcode = document.getElementById('barcode').value.trim();
    const product_name = document.getElementById('p-name').value.trim();
    const category = document.getElementById('category').value.trim();
    const quantity = parseInt(document.getElementById('qty').value);
    const unit = document.getElementById('unit').value.trim();

   /* if (!product_name || !unit || !category || !barcode) {
      showmess("Please complete all fields before adding an item.", "error");
      return;
    }showmess("Successful added." ,'successful')

  if (isNaN(quantity)) {
    showmess(" Quantity must be a valid number!", "error");
    return;
  }

  if (quantity < 1) {
    showmess("Quantity must be greater than 0!", "error");
    return;
  }*/


    inventory.push({  id:Date.now() + Math.random(), barcode, name: product_name, category, quantity, unit });

    
    document.getElementById('barcode').value = "";
    document.getElementById('p-name').value = "";
    document.getElementById('qty').value = "";
    document.getElementById('unit').value = "";
    document.getElementById('category').value = "";
    if (icondisplay) icondisplay.innerHTML = "";
    update();
    }catch(err){
     showmess(err.message)
    }
  });


   // ==============================
  // Products Section
  // ==============================
const productImageInput = document.getElementById("productImage");
const preview = document.getElementById("imagepre");
const productList = document.querySelector(".i-list");

let selectedImageData = null;


productImageInput?.addEventListener("change", () => {
  try {
    const file = productImageInput.files[0];
    if (!file) {
      selectedImageData = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      selectedImageData = e.target.result;
      console.log("Image ready:", file.name);
    };
    reader.readAsDataURL(file);

  } catch (err) {
    console.error("Error reading product image:", err);
    selectedImageData = null;
  }
});


document.querySelector(".p-save").addEventListener("click", (e) => {
  e.preventDefault();

  const name = document.getElementById("productname").value.trim();
  const price = parseFloat(document.getElementById("price").value.trim());

  if (!name || isNaN(price) || price <= 0) {
    showmess("Please complete all fields with valid values.", 'error');
    return;
  }
  showmess("Succesfully added",'successful')
 
  const card = document.createElement("article");
  card.className = "cd";

  let imgTag = "";
  if (selectedImageData) {
    imgTag = `<img src="${selectedImageData}" alt="${name}" 
                style="width:130px; height:150px;">`;
  }

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
     <span class ="amount" style="font-size:1.75rem; font-weight:bold; color: black;">₱${price.toFixed(2)}</span>
      <span class="size">Large</span>
    </div>
    <div class="act">
      <button class="btn-edit" type="button">Edit</button>
      <button class="btn-reorder active" data-size="L">L</button>
      <button class="btn-reorder" data-size="M">M</button>
      <button class="btn-reorder" data-size="S">S</button>
    </div>
  `;

const editPanel = document.getElementById("edit-panel");
const editForm = document.getElementById("edit-form");
const editPrice = document.getElementById("edit-price");

let currentCard = null;

card.querySelector(".btn-edit").addEventListener("click", () => {
  currentCard = card;


  const currentPrice = parseFloat(
    currentCard.querySelector(".amount").textContent.replace("₱", "")
  );
  editPrice.value = currentPrice;

  editPanel.style.display = "flex";
});


editForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!currentCard) return;

  const newPrice = parseFloat(editPrice.value);
  if (isNaN(newPrice) || newPrice <= 0) {
    showmess("Enter a valid price", "error");
    return;
  }

  currentCard.dataset.basePrice = newPrice;

  currentCard.querySelector(".amount").textContent =
    "₱" + newPrice.toFixed(2);

 
  currentCard.querySelector(".size").textContent = "Large";

  editPanel.style.display = "none";
  currentCard = null;
});



document.querySelector(".btn-delete").addEventListener("click", () => {
  if (currentCard) {
    currentCard.remove();
    currentCard = null;
  }
  editPanel.style.display = "none";
});


document.querySelector(".btn-cancel").addEventListener("click", () => {
  editPanel.style.display = "none";
  currentCard = null;
});

  const product_price = card.querySelector('.p-price');
  const priceSpan = product_price.querySelector('.amount');
  const sizelabel = card.querySelector('.size');
  const buttons = card.querySelectorAll('.btn-reorder');

 buttons.forEach((btn) => {
  btn.addEventListener("click", function () {
    const size = btn.dataset.size;
    const basePrice = parseFloat(card.dataset.basePrice); 
    let newPrice = basePrice;
    if (size === "M") newPrice = basePrice * 0.8;
    if (size === "S") newPrice = basePrice * 0.6;

    priceSpan.textContent = "₱" + newPrice.toFixed(2);
    sizelabel.textContent =
      size === "L" ? "Large" :
      size === "M" ? "Medium" : "Small";

    buttons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

  productList.appendChild(card);

  document.getElementById("p-form").reset();
  selectedImageData = null;

  update();
});

  // ==============================
  // Messge
  // ==============================

function showmess(message, type = "info"){
  const mess = document.getElementById('toast')
  mess.textContent = message;

  mess.style.background =
  
  type === 'successful' ? "#28a745":
  type === 'error'? "#dc3545" :
  "#333";
  toast.className = "show";

  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, 3000);
}



});