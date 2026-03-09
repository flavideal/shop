const webAppUrl = "https://script.google.com/macros/s/AKfycbwOAaFDHHvMAurq6wc5N8kN6fXmm1a2DyGP3rsLETh9nDt1PnXIyEKZPn1rV_DZWAEY/exec"; 

// 1. BALIK NATIN ANG PRODUCTS (Para hindi "nasira" ang display)
async function fetchProducts() {
    try {
        const response = await fetch(webAppUrl + "?action=getProducts"); 
        const products = await response.json();
        const container = document.getElementById('product-list');
        container.innerHTML = ""; 
        
        products.forEach(p => {
            const months = 12;
            const instPrice = Number(p.Installment_Price) || 0;
            const interest = Number(p.Interest_Rate) || 0;
            const fee = Number(p.Processing_Fee) || 0;
            const monthlyPayment = (instPrice / months) + (instPrice * interest) + (fee / months);

            container.innerHTML += `
                <div class="product-card">
                    ${p.Cash_Price < p.Regular_Price ? '<span class="sale-badge">SALE</span>' : ''}
                    <img src="${p.Folder_Path}/photo1.jpg" class="product-image" onerror="this.src='https://via.placeholder.com/150'">
                    <div class="product-name">${p.Name}</div>
                    <div class="price-regular">₱${Number(p.Regular_Price).toLocaleString()}</div>
                    <div class="price-cash">₱${Number(p.Cash_Price).toLocaleString()}</div>
                    <div class="installment-text">As low as <b>₱${Math.round(monthlyPayment).toLocaleString()}/mo</b></div>
                    <p style="font-size:9px; color:gray;">Stock: ${p.Stock_Count}</p>
                </div>`;
        });
    } catch (e) { console.log("Product Load Error"); }
}

// 2. IYONG ORIGINAL REGISTRATION CODE (Walang bago dito para gumana ang email)
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

    regBtn.disabled = true;
    regBtn.innerText = "Sending OTP... Please wait";

    const url = `${webAppUrl}?action=register&name=${encodeURIComponent(name)}&user=${encodeURIComponent(user)}&email=${encodeURIComponent(email)}&mobile=${encodeURIComponent(mobile)}&pin=${encodeURIComponent(pin)}&subscribe=${subscribe}`;

    try {
        const response = await fetch(url);
        alert("OTP request sent! Check your email.");
        showOTPBox(); 
    } catch (error) {
        alert("Check your email for the OTP.");
        showOTPBox();
    } finally {
        regBtn.disabled = false;
        regBtn.innerText = "Send OTP to Email";
    }
}

// 3. DUGTONG NA VERIFY OTP (Para maging "Verified" ang Column G)
async function verifyOTP() {
    const verifyBtn = document.getElementById('verifyBtn');
    const otpInput = document.getElementById('otpInput').value;
    const mobileInput = document.getElementById('regMobile').value;

    if (!otpInput) return alert("Please enter the OTP code.");
    verifyBtn.disabled = true;
    verifyBtn.innerText = "Verifying...";

    const verifyUrl = `${webAppUrl}?action=verify&mobile=${encodeURIComponent(mobileInput)}&otp=${encodeURIComponent(otpInput)}`;

    try {
        const response = await fetch(verifyUrl);
        const result = await response.text();
        if (result.trim() === "Verified") {
            alert("Success! Your account is now Verified.");
            showLogin(); 
        } else {
            alert("Invalid OTP code.");
        }
    } catch (e) { alert("Verification processed. Try logging in."); showLogin(); }
    finally { verifyBtn.disabled = false; verifyBtn.innerText = "Verify & Complete"; }
}

// 4. UI LOGIC (Modal controls)
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
    document.getElementById('otpFields').style.display = "none";
}
function showOTPBox() {
    document.getElementById('modalTitle').innerText = "Verify Email OTP";
    document.getElementById('registerFields').style.display = "none";
    document.getElementById('otpFields').style.display = "block";
}

// PAG-LOAD NG PAGE
window.onload = fetchProducts;
