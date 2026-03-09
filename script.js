// 1. Web App URL
const webAppUrl = "https://script.google.com/macros/s/AKfycbwOAaFDHHvMAurq6wc5N8kN6fXmm1a2DyGP3rsLETh9nDt1PnXIyEKZPn1rV_DZWAEY/exec"; 

// 2. Loader
async function fetchProducts() {
    try {
        const response = await fetch(webAppUrl + "?action=getProducts"); 
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        document.getElementById('product-list').innerHTML = "<p>Loading products... Please refresh.</p>";
    }
}

// 3. Display Function
function displayProducts(products) {
    const container = document.getElementById('product-list');
    container.innerHTML = ""; 
    
    products.forEach(p => {
        const months = 12;
        const instPrice = Number(p.Installment_Price) || 0;
        const interest = Number(p.Interest_Rate) || 0;
        const fee = Number(p.Processing_Fee) || 0;

        const monthlyPayment = (instPrice / months) + (instPrice * interest) + (fee / months);

        const card = `
            <div class="product-card">
                ${p.Cash_Price < p.Regular_Price ? '<span class="sale-badge">SALE</span>' : ''}
                <img src="${p.Folder_Path}/photo1.jpg" class="product-image" onerror="this.src='https://via.placeholder.com/150'">
                <div class="product-name">${p.Name}</div>
                <div class="price-regular">₱${Number(p.Regular_Price).toLocaleString()}</div>
                <div class="price-cash">₱${Number(p.Cash_Price).toLocaleString()}</div>
                <div class="installment-text">
                    As low as <b>₱${Math.round(monthlyPayment).toLocaleString()}/mo</b>
                </div>
                <p style="font-size:9px; color:gray;">Stock: ${p.Stock_Count}</p>
            </div>
        `;
        container.innerHTML += card;
    });
}

// 4. Initial Load
window.onload = fetchProducts;

function toggleModal() {
    const modal = document.getElementById('accountModal');
    modal.style.display = (modal.style.display === "flex") ? "none" : "flex";
}

function showRegister() {
    document.getElementById('modalTitle').innerText = "Create Account";
    document.getElementById('loginFields').style.display = "none";
    document.getElementById('registerFields').style.display = "block";
}

function showLogin() {
    document.getElementById('modalTitle').innerText = "Customer Login";
    document.getElementById('loginFields').style.display = "block";
    document.getElementById('registerFields').style.display = "none";
}

async function handleRegister() {
    const regBtn = document.getElementById('regBtn');
    const name = document.getElementById('regName').value;
    const user = document.getElementById('regUser').value;
    const email = document.getElementById('regEmail').value;
    const mobile = document.getElementById('regMobile').value;
    const pin = document.getElementById('regPin').value;
    const subscribe = document.getElementById('regSubscribe').checked;

    if (!name || !user || !email || !mobile || !pin) {
        return alert("Please fill up all fields.");
    }

    // IMPORTANT: I-save ang mobile number para sa verification mamaya
    localStorage.setItem("tempMobile", mobile);

    regBtn.disabled = true;
    regBtn.innerText = "Sending OTP... Please wait";

    const url = `${webAppUrl}?action=register&name=${encodeURIComponent(name)}&user=${encodeURIComponent(user)}&email=${encodeURIComponent(email)}&mobile=${encodeURIComponent(mobile)}&pin=${encodeURIComponent(pin)}&subscribe=${subscribe}`;

    try {
        await fetch(url, { mode: 'no-cors' }); // 'no-cors' para iwas error sa browser
        alert("OTP request sent! Check your email.");
        showOTPBox(); 
    } catch (error) {
        // Kahit mag-error ang CORS, pumapasok pa rin ang data sa Sheet
        alert("Check your email for the OTP.");
        showOTPBox();
    } finally {
        regBtn.disabled = false;
        regBtn.innerText = "Send OTP to Email";
    }
}

function showOTPBox() {
    document.getElementById('modalTitle').innerText = "Verify Email OTP"; 
    document.getElementById('registerFields').style.display = "none";
    document.getElementById('otpFields').style.display = "block";
}
    
async function verifyOTP() {
    const verifyBtn = document.getElementById('verifyBtn');
    const otpInput = document.getElementById('otpInput').value;
    
    // Kunin ang sinave na mobile number mula sa handleRegister
    const mobileInput = localStorage.getItem("tempMobile");

    if (!otpInput) {
        return alert("Please enter the OTP code.");
    }
    
    if (!mobileInput) {
        return alert("Error: Mobile number not found. Please try registering again.");
    }

    verifyBtn.disabled = true;
    verifyBtn.innerText = "Verifying...";

    // Siguraduhin na ang mobile at otp ay kasama sa URL
    const verifyUrl = `${webAppUrl}?action=verify&mobile=${encodeURIComponent(mobileInput)}&otp=${encodeURIComponent(otpInput)}`;

    try {
        const response = await fetch(verifyUrl);
        const result = await response.text();
        
        if (result.trim() === "Verified") {
            alert("Account verified successfully! You can now login.");
            localStorage.removeItem("tempMobile"); // Burahin na ang temporary data
            showLogin();
        } else {
            alert("Invalid OTP code. Please check your email again.");
        }
    } catch (error) {
        console.error("Verification error:", error);
        alert("Verification failed. Make sure you are connected to the internet.");
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerText = "Verify & Complete";
    }
}
async function handleLogin() {
    const user = document.getElementById('username').value;
    const pin = document.getElementById('pin').value;

    if (!user || !pin) return alert("Please enter username and PIN.");

    try {
        const loginUrl = `${webAppUrl}?action=login&user=${user}&pin=${pin}`;
        const response = await fetch(loginUrl);
        const result = await response.json();

        if (result.status === "Success") {
    // Itago ang Shop at Hero section
    document.querySelector('.hero').style.display = 'none';
    document.getElementById('product-list').style.display = 'none';
    
    // Ipakita ang Dashboard
    document.getElementById('account-dashboard').style.display = 'block';
    document.getElementById('user-display-name').innerText = result.name;
    
    // Kunin ang orders (Sa susunod na step natin ito gagawin)
    // fetchOrders(user); 
    
    toggleModal();
}
