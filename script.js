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
    
    // I-save natin ang products sa window para ma-access ng openProductDetails
    window.currentProducts = products;

    products.forEach((p, index) => {
        const months = 12;
        const instPrice = Number(p.Installment_Price) || 0;
        const interest = Number(p.Interest_Rate) || 0;
        const fee = Number(p.Processing_Fee) || 0;
        const monthlyPayment = (instPrice / months) + (instPrice * interest) + (fee / months);

        // FIX: Imbes na JSON.stringify, index na lang ang ipasa natin
        const card = `
            <div class="product-card" onclick="openProductDetails(${index})" style="cursor: pointer;">
                ${p.Cash_Price < p.Regular_Price ? '<span class="sale-badge">SALE</span>' : ''}
                <img src="${p.Folder_Path}/photo1.jpg" class="product-image" onerror="this.src='https://via.placeholder.com/150'">
                <div class="product-name">${p.Name}</div>
                <div class="price-regular">₱${Number(p.Regular_Price).toLocaleString()}</div>
                <div class="price-cash">₱${Number(p.Cash_Price).toLocaleString()}</div>
                <div class="installment-text">
                    As low as <b>₱${Math.round(monthlyPayment).toLocaleString()}/mo</b>
                </div>
                <p style="font-size:9px; color:${p.Stock_Count > 0 ? 'gray' : 'red'};">
                    ${p.Stock_Count > 0 ? 'Stock: ' + p.Stock_Count : 'SOLD OUT'}
                </p>
            </div>
        `;
        container.innerHTML += card;
    });
}

function openProductDetails(index) {
    // Kunin ang product mula sa window variable gamit ang index
    const p = window.currentProducts[index];
    
    if (!p) return;

    const modal = document.getElementById('productViewModal');
    if (!modal) {
        alert("Error: productViewModal not found in HTML.");
        return;
    }
    
    modal.style.display = "flex";

    // Load Photos (1-14)
    let photoHTML = "";
    for(let i=1; i<=14; i++) {
        // Idinagdag ang class para sa styling ng gallery
        photoHTML += `<img src="${p.Folder_Path}/photo${i}.jpg" class="gallery-img" onerror="this.style.display='none'">`;
    }
    document.getElementById('photoGallery').innerHTML = photoHTML;

    // Load Details
    document.getElementById('viewName').innerText = p.Name;
    document.getElementById('viewDesc').innerText = p.Description;
    document.getElementById('viewColors').innerText = "Available Colors: " + p.Colors;
    document.getElementById('viewCapacity').innerText = "Storage: " + p.Capacity;

    // Installment Buttons
    const regularBtn = document.getElementById('regInstallBtn');
    const easyBtn = document.getElementById('easyInstallBtn');

    if(regularBtn) regularBtn.onclick = () => window.open(p.Installment_Regular, '_blank');

    if(easyBtn) {
        easyBtn.onclick = () => {
            const inputCode = prompt("Please enter the Easy Code Key to proceed:");
            if (inputCode === p.Easy_Code_Key.toString()) {
                window.open(p.Installment_Easy, '_blank');
            } else {
                alert("Incorrect Code. Please contact Flavi Deal support.");
            }
        };
    }
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
    // I-lock muna ang fields (View Mode)
    document.getElementById('dashboardFields').style.display = "block";
    document.getElementById('loginFields').style.display = "none";
    
    // I-display ang data base sa tamang keys mula sa JSON
    document.getElementById('dashName').innerText = data.name || "User"; 
    document.getElementById('editName').value = data.name || "";
    document.getElementById('editEmail').value = data.email || "No Email Found";
    
    // Itago ang "Change" fields hangga't wala pang OTP
    document.getElementById('extraFields').style.display = "none";
    
    // I-save ang buong data sa localStorage para sa update later
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

// --- FIX: PINAG-ISANG REQUEST PROFILE OTP ---
async function requestProfileOTP() {
    const savedUser = JSON.parse(localStorage.getItem("flavi_user"));
    const email = savedUser ? savedUser.email : "";

    if (!email || email === "No Email Found") {
        alert("Error: Your email could not be found. Please log in again.");
        return;
    }

    if (!confirm("We will send an OTP to " + email + " to authorize editing. Do you want to proceed?")) return;

    // Pakita natin na naglo-load
    const reqBtn = document.getElementById('requestUpdateBtn');
    if(reqBtn) {
        reqBtn.disabled = true;
        reqBtn.innerText = "Sending OTP...";
    }

    const url = `${webAppUrl}?action=requestUpdateOTP&email=${encodeURIComponent(email)}`;
    
    try {
        const response = await fetch(url);
        const result = await response.text();

        if (result.trim() === "Success") {
            alert("OTP sent to your email!");
            
            // FLOW: Lipat sa OTP Screen
            document.getElementById('dashboardFields').style.display = 'none';
            document.getElementById('otpFields').style.display = 'block';
            document.getElementById('modalTitle').innerText = "Verify Identity";
            
            // Itabi ang mobile number para sa verification later
            document.getElementById('regMobile').value = savedUser.mobile || "";
            
            // Importante: Flag para sa verifyOTP function
            window.isUpdatingProfile = true;
        } else {
            alert("Error: " + result);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Connection failed. Check your internet.");
    } finally {
        if(reqBtn) {
            reqBtn.disabled = false;
            reqBtn.innerText = "Request OTP to Edit Details";
        }
    }
}

// --- FIX: PINAG-ISANG VERIFY OTP FUNCTION ---
async function verifyOTP() {
    const verifyBtn = document.getElementById('verifyBtn');
    const otpInput = document.getElementById('otpInput').value;
    const mobileInput = document.getElementById('regMobile').value;
    const fullName = document.getElementById('regName').value; 

    if (!otpInput) return alert("Please enter the OTP code.");

    verifyBtn.disabled = true;
    verifyBtn.innerText = "Verifying...";

    const verifyUrl = `${webAppUrl}?action=verify&mobile=${encodeURIComponent(mobileInput)}&otp=${encodeURIComponent(otpInput)}`;

    try {
        const response = await fetch(verifyUrl);
        const result = await response.text();
        
        if (result === "Verified") {
            if (window.isUpdatingProfile) {
                // FLOW: Kung Profile Update ito, unlock the fields
                alert("Identity Verified! You can now edit your details.");
                document.getElementById('otpFields').style.display = 'none';
                document.getElementById('dashboardFields').style.display = 'block';
                document.getElementById('dash-profile').style.display = 'block';
                unlockProfileFields();
            } else {
                // FLOW: Kung Registration ito, login agad
                alert("Account verified successfully!");
                const userData = { status: "Success", name: fullName, mobile: mobileInput };
                localStorage.setItem("flavi_user", JSON.stringify(userData));
                showDashboard(userData);
            }
        } else {
            alert("Invalid OTP code. Please try again.");
        }
    } catch (error) {
        alert("Verification failed.");
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerText = "Verify & Complete";
    }
}

function unlockProfileFields() {
    // Siguraduhin na ang inputs ay may class na 'profile-input' sa HTML
    const inputs = document.querySelectorAll('.profile-input');
    inputs.forEach(input => {
        input.removeAttribute('readonly');
        input.style.border = "1px solid var(--forest-green)";
        input.style.background = "#fff";
    });

    if(document.getElementById('extraFields')) document.getElementById('extraFields').style.display = 'block';
    if(document.getElementById('requestUpdateBtn')) document.getElementById('requestUpdateBtn').style.display = 'none';
    if(document.getElementById('saveProfileBtn')) document.getElementById('saveProfileBtn').style.display = 'block';
}

async function saveProfileChanges() {
    const savedUser = JSON.parse(localStorage.getItem("flavi_user"));
    const oldEmail = savedUser.email;

    const newName = document.getElementById('editName').value;
    const newEmail = document.getElementById('editEmail').value;
    const newMobile = document.getElementById('editMobile').value;
    const newUser = document.getElementById('editUser').value;
    const newPin = document.getElementById('editPin').value;

    const url = `${webAppUrl}?action=updateUser&oldEmail=${encodeURIComponent(oldEmail)}&newName=${encodeURIComponent(newName)}&newEmail=${encodeURIComponent(newEmail)}&newMobile=${encodeURIComponent(newMobile)}&newUser=${encodeURIComponent(newUser)}&newPin=${encodeURIComponent(newPin)}`;

    try {
        const response = await fetch(url);
        const result = await response.text();
        if(result === "Success") {
            alert("Profile updated successfully! Logging out to refresh data.");
            handleLogout();
        } else {
            alert("Update failed: " + result);
        }
    } catch (e) {
        alert("Update Error.");
    }
}
