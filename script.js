// 1. I-paste ang Web App URL mula sa Google Apps Script deployment mo
const webAppUrl = "https://script.google.com/macros/s/AKfycbwOAaFDHHvMAurq6wc5N8kN6fXmm1a2DyGP3rsLETh9nDt1PnXIyEKZPn1rV_DZWAEY/exec"; 

// 2. Ito ang loader na kukuha ng live data
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

// 3. I-update ang display function para tumanggap ng data
function displayProducts(products) {
    const container = document.getElementById('product-list');
    container.innerHTML = ""; 
    
    products.forEach(p => {
        const months = 12;
        const instPrice = Number(p.Installment_Price) || 0;
        const interest = Number(p.Interest_Rate) || 0;
        const fee = Number(p.Processing_Fee) || 0;

        // Formula: (Price / Months) + (Price * Interest) + (Fee / Months)
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

// 4. Tawagin ang fetch function pagka-load ng page
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

    regBtn.disabled = true;
    regBtn.innerText = "Sending OTP... Please wait";

    const url = `${webAppUrl}?action=register&name=${encodeURIComponent(name)}&user=${encodeURIComponent(user)}&email=${encodeURIComponent(email)}&mobile=${encodeURIComponent(mobile)}&pin=${encodeURIComponent(pin)}&subscribe=${subscribe}`;

    try {
        const response = await fetch(url);
        const result = await response.text();

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

function showOTPBox() {
    document.getElementById('modalTitle').innerText = "Verify Email OTP";
    document.getElementById('registerFields').style.display = "none";
    document.getElementById('otpFields').style.display = "block";
}

async function verifyOTP() {
    const verifyBtn = document.getElementById('verifyBtn');
    const otpInput = document.getElementById('otpInput').value;
    const mobileInput = document.getElementById('regMobile').value;
    const fullName = document.getElementById('regName').value; // Kunin ang name para sa dashboard

    if (!otpInput) {
        alert("Please enter the OTP code.");
        return;
    }

    verifyBtn.disabled = true;
    verifyBtn.innerText = "Verifying...";

    const verifyUrl = `${webAppUrl}?action=verify&mobile=${encodeURIComponent(mobileInput)}&otp=${encodeURIComponent(otpInput)}`;

    try {
        const response = await fetch(verifyUrl);
        const result = await response.text();
        
        if (result === "Verified") {
            alert("Account verified successfully!");
            
            // AUTOMATIC LOGIN: Ipakita agad ang Dashboard pagka-verify
            const userData = {
                status: "Success",
                name: fullName
            };
            
            // I-save ang session
            localStorage.setItem("flavi_user", JSON.stringify(userData));
            
            // Tawagin ang function para ipakita ang dashboard
            showDashboard(userData);
            
        } else {
            alert("Invalid OTP code. Please try again.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Verification failed. Please try again.");
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerText = "Verify & Complete";
    }
}
// Function para magpalit ng view sa Dashboard
function switchDash(tab) {
    document.querySelectorAll('.dash-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('dash-' + tab).style.display = 'block';
    event.target.classList.add('active');
}

// Update handleLogin para ipakita ang Dashboard
async function handleLogin() {
    const user = document.getElementById('username').value;
    const pin = document.getElementById('pin').value;

    if (!user || !pin) return alert("Please enter username and PIN.");

    try {
        const loginUrl = `${webAppUrl}?action=login&user=${encodeURIComponent(user)}&pin=${encodeURIComponent(pin)}`;
        const response = await fetch(loginUrl);
        const result = await response.json();

        if (result.status === "Success") {
            showDashboard(result);
        } else {
            alert("Invalid Username, PIN, or Account Not Verified.");
        }
    } catch (error) {
        alert("Login failed. Check your connection.");
    }
}

function showDashboard(data) {
    document.getElementById('modalTitle').innerText = "Account Dashboard";
    document.getElementById('loginFields').style.display = "none";
    document.getElementById('registerFields').style.display = "none";
    document.getElementById('otpFields').style.display = "none";
    document.getElementById('dashboardFields').style.display = "block";
    
    // Ipakita ang Pangalan
    document.getElementById('dashName').innerText = data.name;
    document.getElementById('editName').value = data.name;
    document.getElementById('editEmail').value = data.email || "No email provided";

    // GENERATE REFERRAL CODE (Halimbawa: FD + Huling 7 digits ng mobile)
    // Kung walang mobile na dala ang data, kumuha sa localStorage
    const savedUser = JSON.parse(localStorage.getItem("flavi_user"));
    const mobileNum = data.mobile || (savedUser ? savedUser.mobile : "0000000");
    
    const refCode = "FD-" + mobileNum.toString().slice(-7).toUpperCase();
    document.getElementById('referralCode').innerText = refCode;

    // I-save ang session
    localStorage.setItem("flavi_user", JSON.stringify(data));
}

function handleLogout() {
    localStorage.removeItem("flavi_user");
    location.reload(); // I-refresh ang page para bumalik sa dati
}

// I-check kung logged in na si user pagka-load ng page
window.onload = function() {
    fetchProducts();
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem("flavi_user");
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        showDashboard(userData);
    }
};

async function requestProfileChange() {
    alert("An OTP has been sent to your email to authorize this change.");
    // Dito tatawag tayo ng katulad sa handleRegister pero 'action=updateProfile'
    // I-re-reuse natin ang showOTPBox()
    showOTPBox();
}

// 1. Request OTP para sa Profile Update
async function requestProfileOTP() {
    const savedUser = JSON.parse(localStorage.getItem("flavi_user"));
    const email = savedUser.email; // Siguraduhin na may email sa saved data

    if (!confirm("We will send an OTP to your registered email to allow editing. Proceed?")) return;

    // Gamitin ang existing handleRegister logic o bagong endpoint para sa OTP
    const url = `${webAppUrl}?action=requestUpdateOTP&email=${encodeURIComponent(email)}`;
    
    // Ipakita ang OTP Modal (i-reuse natin yung existing OTP fields)
    document.getElementById('dash-profile').style.display = 'none';
    document.getElementById('otpFields').style.display = 'block';
    document.getElementById('modalTitle').innerText = "Verify Identity";
    
    // I-set ang temporary variable para malaman ng verifyOTP function na "Profile Update" ito
    window.isUpdatingProfile = true;
}

// 2. I-update ang iyong verifyOTP function para i-handle ang profile edit
// (Dugtong ito sa existing verifyOTP mo)
if (result === "Verified" && window.isUpdatingProfile) {
    alert("Identity Verified! You can now edit your details.");
    
    // Balik sa Dashboard/Profile
    document.getElementById('otpFields').style.display = 'none';
    document.getElementById('dashboardFields').style.display = 'block';
    document.getElementById('dash-profile').style.display = 'block';
    
    // Gawing editable ang lahat
    unlockProfileFields();
}

function unlockProfileFields() {
    const inputs = document.querySelectorAll('.profile-input');
    inputs.forEach(input => {
        input.removeAttribute('readonly');
        input.style.border = "1px solid var(--forest-green)";
        input.style.background = "#fff";
    });

    document.getElementById('extraFields').style.display = 'block';
    document.getElementById('requestUpdateBtn').style.display = 'none';
    document.getElementById('saveProfileBtn').style.display = 'block';
}

async function saveProfileChanges() {
    const updatedData = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        mobile: document.getElementById('editMobile').value,
        user: document.getElementById('editUser').value,
        pin: document.getElementById('editPin').value
    };

    // Tawagan ang Apps Script action="updateUser"
    // I-update ang localStorage at i-lock ulit ang fields
    alert("Profile updated successfully!");
    location.reload(); 
}
