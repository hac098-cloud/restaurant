const menuItems = [
  { id: 1, name: "牛肉面", category: "主食", price: 12.99, desc: "浓汤牛肉面，香菜可选", emoji: "🍜" },
  { id: 2, name: "宫保鸡丁饭", category: "主食", price: 13.99, desc: "微辣，配米饭", emoji: "🍛" },
  { id: 3, name: "煎饺", category: "小吃", price: 7.99, desc: "一份 8 个", emoji: "🥟" },
  { id: 4, name: "春卷", category: "小吃", price: 5.99, desc: "酥脆素春卷", emoji: "🌯" },
  { id: 5, name: "珍珠奶茶", category: "饮料", price: 4.99, desc: "可备注少冰少糖", emoji: "🧋" },
  { id: 6, name: "柠檬茶", category: "饮料", price: 3.99, desc: "清爽冰柠檬茶", emoji: "🍋" },
  { id: 7, name: "红烧肉", category: "热菜", price: 15.99, desc: "经典家常味", emoji: "🥘" },
  { id: 8, name: "麻婆豆腐", category: "热菜", price: 11.99, desc: "麻辣下饭", emoji: "🍲" }
];

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let orders = JSON.parse(localStorage.getItem("orders")) || [];
let currentCategory = "全部";

const menuGrid = document.getElementById("menuGrid");
const categoryBar = document.getElementById("categoryBar");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const searchInput = document.getElementById("searchInput");

const menuPage = document.getElementById("menuPage");
const ordersPage = document.getElementById("ordersPage");
const menuTab = document.getElementById("menuTab");
const ordersTab = document.getElementById("ordersTab");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function saveOrders() {
  localStorage.setItem("orders", JSON.stringify(orders));
}

function money(num) {
  return "$" + num.toFixed(2);
}

function renderCategories() {
  const categories = ["全部", ...new Set(menuItems.map(item => item.category))];

  categoryBar.innerHTML = categories.map(cat => `
    <button class="${cat === currentCategory ? "active" : ""}" onclick="setCategory('${cat}')">
      ${cat}
    </button>
  `).join("");
}

function setCategory(category) {
  currentCategory = category;
  renderCategories();
  renderMenu();
}

function renderMenu() {
  const keyword = searchInput.value.trim().toLowerCase();

  const filtered = menuItems.filter(item => {
    const matchCategory = currentCategory === "全部" || item.category === currentCategory;
    const matchKeyword = item.name.toLowerCase().includes(keyword) || item.desc.toLowerCase().includes(keyword);
    return matchCategory && matchKeyword;
  });

  menuGrid.innerHTML = filtered.map(item => `
    <div class="card">
      <div class="emoji">${item.emoji}</div>
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <div class="price-row">
        <span class="price">${money(item.price)}</span>
        <button class="primary" onclick="addToCart(${item.id})">加入</button>
      </div>
    </div>
  `).join("");
}

function addToCart(id) {
  const item = menuItems.find(food => food.id === id);
  const existing = cart.find(food => food.id === id);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...item, qty: 1 });
  }

  saveCart();
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(food => food.id === id);
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    cart = cart.filter(food => food.id !== id);
  }

  saveCart();
  renderCart();
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = "<p>购物车为空</p>";
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong>
          <div>${money(item.price)} × ${item.qty}</div>
        </div>
        <div class="qty">
          <button onclick="changeQty(${item.id}, -1)">-</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      </div>
    `).join("");
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartTotal.textContent = money(total);
}

function checkout() {
  const customerName = document.getElementById("customerName").value.trim();
  const note = document.getElementById("note").value.trim();

  if (cart.length === 0) {
    alert("请先加入菜品");
    return;
  }

  if (!customerName) {
    alert("请输入客人姓名或桌号");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const order = {
    id: Date.now(),
    customerName,
    note,
    items: cart,
    total,
    status: "新订单",
    createdAt: new Date().toLocaleString()
  };

  orders.unshift(order);
  saveOrders();

  cart = [];
  saveCart();

  document.getElementById("customerName").value = "";
  document.getElementById("note").value = "";

  renderCart();
  alert("订单已提交！");
}

function renderOrders() {
  const ordersList = document.getElementById("ordersList");

  if (orders.length === 0) {
    ordersList.innerHTML = "<p>还没有订单</p>";
    return;
  }

  ordersList.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-top">
        <div>
          <h3>订单 #${order.id}</h3>
          <p><strong>客人/桌号：</strong>${order.customerName}</p>
          <p><strong>时间：</strong>${order.createdAt}</p>
        </div>
        <span class="status">${order.status}</span>
      </div>

      <ul>
        ${order.items.map(item => `
          <li>${item.name} × ${item.qty} — ${money(item.price * item.qty)}</li>
        `).join("")}
      </ul>

      <p><strong>备注：</strong>${order.note || "无"}</p>
      <h3>总计：${money(order.total)}</h3>

      <button class="secondary" onclick="markDone(${order.id})">标记完成</button>
      <button class="danger" onclick="deleteOrder(${order.id})">删除</button>
    </div>
  `).join("");
}

function markDone(id) {
  const order = orders.find(order => order.id === id);

  if (order) {
    order.status = "已完成";
    saveOrders();
    renderOrders();
  }
}

function deleteOrder(id) {
  if (confirm("确定删除这个订单吗？")) {
    orders = orders.filter(order => order.id !== id);
    saveOrders();
    renderOrders();
  }
}

function switchPage(page) {
  const isMenu = page === "menu";

  menuPage.classList.toggle("hidden", !isMenu);
  ordersPage.classList.toggle("hidden", isMenu);
  menuTab.classList.toggle("active", isMenu);
  ordersTab.classList.toggle("active", !isMenu);
}

function adminLogin() {
  const password = document.getElementById("adminPassword").value;

  if (password === "1234") {
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("ordersList").classList.remove("hidden");
    renderOrders();
  } else {
    alert("密码错误");
  }
}

function exportOrders() {
  const data = JSON.stringify(orders, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "orders.json";
  a.click();

  URL.revokeObjectURL(url);
}

function clearOrders() {
  if (confirm("确定清空所有订单吗？")) {
    orders = [];
    saveOrders();
    renderOrders();
  }
}

document.getElementById("checkoutBtn").addEventListener("click", checkout);

document.getElementById("clearCartBtn").addEventListener("click", () => {
  cart = [];
  saveCart();
  renderCart();
});

document.getElementById("loginBtn").addEventListener("click", adminLogin);
document.getElementById("exportBtn").addEventListener("click", exportOrders);
document.getElementById("clearOrdersBtn").addEventListener("click", clearOrders);

searchInput.addEventListener("input", renderMenu);

menuTab.addEventListener("click", () => switchPage("menu"));
ordersTab.addEventListener("click", () => switchPage("orders"));

renderCategories();
renderMenu();
renderCart();
