// 1. I-paste ang Web App URL mula sa Google Apps Script deployment mo
const webAppUrl = "https://script.google.com/macros/s/AKfycbwOAaFDHHvMAurq6wc5N8kN6fXmm1a2DyGP3rsLETh9nDt1PnXIyEKZPn1rV_DZWAEY/exec"; 

// 2. Ito ang loader na kukuha ng live data
async function fetchProducts() {
    const container = document.getElementById('product-list');
    
    // Ipakita ang loading state
    container.innerHTML = `
        <div class="loader-container">
            <div class="spinner"></div>
            <p style="color: gray; font-size: 14px;">Loading products...</p>
        </div>
    `;

    try {
        const response = await fetch(webAppUrl + "?action=getProducts"); 
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        container.innerHTML = `
            <div class="loader-container">
                <p style="color: red;">Failed to load products. Please refresh the page.</p>
            </div>
        `;
    }
}

// 3. I-update ang display function para tumanggap ng data
function displayProducts(products) {
    const container = document.getElementById('product-list');
    container.innerHTML = ""; 
    
    window.currentProducts = products;

    products.forEach((p, index) => {
    // 1. Siguraduhin na ang headers sa Sheets ay "Plan", "Installment Price", at "Interest Rate"
    // Gagamit tayo ng parseFloat para sa decimals (0.05)
    const months = Number(p.Plan) || 12; 
    const instPrice = Number(p.Installment_Price) || 0;
    const interestRate = parseFloat(p.Interest_Rate) || 0; // Ginamitan ng parseFloat

    // 2. COMPUTATION: (Price / Plan) + (Monthly Interest)
    // Example: (15000 / 12) + (15000 * 0.05)
    const monthlyPayment = (instPrice / months) + (instPrice * interestRate);

    const isOutOfStock = p.Stock_Count <= 0;
    const stockStatus = isOutOfStock 
        ? `<b style="color: #e74c3c;">● SOLD OUT</b>` 
        : `<b style="color: #27ae60;">● In Stock</b>`;

    const card = `
        <div class="product-card" onclick="openProductDetails(${index})" style="cursor: pointer; position: relative; opacity: ${isOutOfStock ? '0.8' : '1'};">
            ${p.Cash_Price < p.Regular_Price ? '<span class="sale-badge">SALE</span>' : ''}
            
            ${isOutOfStock ? '<div style="position:absolute; top:40%; left:0; width:100%; background:rgba(231, 76, 60, 0.85); color:white; text-align:center; padding:5px; font-size:11px; font-weight:bold; z-index:2;">SOLD OUT</div>' : ''}
            
            <img src="${p.Folder_Path}/1.png" class="product-image" onerror="this.src='https://via.placeholder.com/150'">
            <div class="product-name">${p.Name}</div>
            <div class="price-regular">₱${Number(p.Regular_Price).toLocaleString()}</div>
            <div class="price-cash">₱${Number(p.Cash_Price).toLocaleString()}</div>
            
            <div class="installment-text">
                As low as <b>₱${Math.round(monthlyPayment).toLocaleString()} / ${months}mo</b>
            </div>
            
            <p style="font-size:10px; margin-top: 8px;">
                ${stockStatus}
            </p>
        </div>
    `;
    container.innerHTML += card;
});
}

let currentGalleryImages = []; // Dito itatago ang mga gumaganang image links

function openProductDetails(index) {
    const p = window.currentProducts[index];
    if (!p) return;

    const modal = document.getElementById('productViewModal');
    if (!modal) return;
    
    modal.style.display = "flex";

    const gallery = document.getElementById('photoGallery');
    const counter = document.getElementById('image-counter');
    // IPALIT ITO: Pakita muna na naglo-load ang photos
    gallery.innerHTML = `
        <div style="width:100%; height:300px; display:flex; align-items:center; justify-content:center; flex-direction:column;" class="skeleton">
            <div class="spinner"></div>
            <span style="font-size:12px; color:gray;">Fetching high-quality photos...</span>
        </div>
    `;

    if(counter) counter.innerText = "Loading...";
    currentGalleryImages = [];

    // 1. DYNAMIC PHOTO LOADING (Checking up to 15 images)
    let imagesToCheck = 15;
    let checkedCount = 0;

    for (let i = 1; i <= imagesToCheck; i++) {
        let imgSrc = `${p.Folder_Path}/${i}.png`;
        let img = new Image();
        img.src = imgSrc;

        img.onload = function() {
            currentGalleryImages.push(imgSrc);
            checkedCount++;
            if (checkedCount === imagesToCheck) finalizeGallery(gallery, counter);
        };
        img.onerror = function() {
            checkedCount++;
            if (checkedCount === imagesToCheck) finalizeGallery(gallery, counter);
        };
    }

    // 2. LOAD TEXT DETAILS
    document.getElementById('viewName').innerText = p.Name;
    document.getElementById('viewDesc').innerText = p.Description;

    // --- COLOR VARIATION LOGIC ---
    const colorContainer = document.getElementById('viewColors');
    if (colorContainer) {
        const colors = p.Colors ? p.Colors.split(',').map(c => c.trim()) : [];
        colorContainer.innerHTML = colors.length > 0 ? '<p style="font-size:12px; font-weight:bold; color:#888; margin-bottom:5px;">Select Color:</p>' : '';
        colors.forEach(color => {
            const btn = document.createElement('button');
            btn.innerText = color;
            btn.className = "variation-btn color-btn";
            btn.onclick = () => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            colorContainer.appendChild(btn);
        });
        if(colors.length > 0) colorContainer.querySelector('button').click();
    }

    // --- CAPACITY & PRICE VARIATION LOGIC ---
    const capacityContainer = document.getElementById('viewCapacity');
    if (capacityContainer) {
        const capacities = p.Capacity ? p.Capacity.toString().split(',').map(s => s.trim()) : [];
        const prices = p.Installment_Price ? p.Installment_Price.toString().split(',').map(s => s.trim()) : [];
        const months = parseInt(p.Plan) || 12;
        const interestRate = parseFloat(p.Interest_Rate) || 0;

        capacityContainer.innerHTML = capacities.length > 0 ? '<p style="font-size:12px; font-weight:bold; color:#888; margin-bottom:5px;">Select Storage:</p>' : '';
        capacities.forEach((cap, i) => {
            const btn = document.createElement('button');
            btn.innerText = cap;
            btn.className = "variation-btn capacity-btn";
            btn.onclick = () => {
                document.querySelectorAll('.capacity-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update Price Display
                const selectedPrice = parseFloat(prices[i]) || parseFloat(prices[0]) || 0;
                const monthly = (selectedPrice / months) + (selectedPrice * interestRate);
                const priceElement = document.getElementById('viewPrice');
                if(priceElement) {
                    priceElement.innerHTML = `
                        <div style="color:var(--forest-green); font-size:22px; font-weight:bold;">₱${selectedPrice.toLocaleString()}</div>
                        <div style="font-size:13px; color:#666;">Monthly: <b>₱${Math.round(monthly).toLocaleString()} / ${months}mo</b></div>
                    `;
                }
            };
            capacityContainer.appendChild(btn);
        });
        if(capacities.length > 0) capacityContainer.querySelector('button').click();
    }

    // 3. ACTION BUTTONS (ADD TO CART / BUY NOW)
    const actionContainer = document.querySelector('.action-buttons');
    if (actionContainer) {
        if (p.Stock_Count <= 0) {
            actionContainer.innerHTML = `
                <div style="background:#fdeaea; color:#e74c3c; padding:15px; border-radius:10px; text-align:center; font-weight:bold; border: 1px solid #fad7d7; width:100%;">
                    ● SOLD OUT
                </div>`;
        } else {
            actionContainer.innerHTML = `
                <button id="addToCartBtn" class="btn-regular">Add to Cart</button>
                <button id="buyNowBtn" class="btn-easy">Buy Now</button>
            `;

            document.getElementById('addToCartBtn').onclick = () => {
                const col = document.querySelector('.color-btn.active')?.innerText || "N/A";
                const cap = document.querySelector('.capacity-btn.active')?.innerText || "N/A";
                alert(`Added to Cart: ${p.Name}\nColor: ${col}\nStorage: ${cap}`);
            };

            document.getElementById('buyNowBtn').onclick = () => {
                const col = document.querySelector('.color-btn.active')?.innerText || "N/A";
                const cap = document.querySelector('.capacity-btn.active')?.innerText || "N/A";
                alert(`Proceeding to Buy: ${p.Name}\nColor: ${col}\nStorage: ${cap}`);
            };
        }
    }
} // <--- Siguraduhing may ganitong bracket bago mag-finalizeGallery

// Function para ayusin ang gallery pagkatapos ma-check lahat ng images
function finalizeGallery(gallery, counter) {
    // I-sort para hindi maghalo-halo ang sequence (1, 2, 3...)
    currentGalleryImages.sort((a, b) => {
        return parseInt(a.split('/').pop()) - parseInt(b.split('/').pop());
    });

    gallery.innerHTML = currentGalleryImages.map((src, idx) => 
        `<img src="${src}" class="gallery-img" onclick="openFullscreenSwipe(${idx})">`
    ).join('');

    const total = currentGalleryImages.length;
    if(counter) counter.innerText = `1 / ${total}`;

    gallery.onscroll = () => {
        let page = Math.round(gallery.scrollLeft / gallery.clientWidth) + 1;
        if(counter) counter.innerText = `${page} / ${total}`;
    };
}

// FULLSCREEN SWIPE LOGIC
function openFullscreenSwipe(startIndex) {
    const fs = document.getElementById('fullscreenView');
    const fsGallery = document.getElementById('fullscreenGallery');
    const fsCounter = document.getElementById('fs-counter');
    
    fs.style.display = "flex";
    
    // I-render ang lahat ng images sa loob ng fullscreen container para swipeable
    fsGallery.innerHTML = currentGalleryImages.map(src => 
        `<img src="${src}" class="fs-slide">`
    ).join('');
    
    const total = currentGalleryImages.length;
    
    // I-scroll sa saktong image na ni-click
    setTimeout(() => {
        fsGallery.scrollLeft = fsGallery.clientWidth * startIndex;
        if(fsCounter) fsCounter.innerText = `${startIndex + 1} / ${total}`;
    }, 50);

    fsGallery.onscroll = () => {
        let page = Math.round(fsGallery.scrollLeft / fsGallery.clientWidth) + 1;
        if(fsCounter) fsCounter.innerText = `${page} / ${total}`;
    };
}

function closeFullImage() {
    document.getElementById('fullscreenView').style.display = "none";
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

// Keyboard Support para sa Fullscreen Gallery
document.addEventListener('keydown', (e) => {
    const fs = document.getElementById('fullscreenView');
    const gallery = document.getElementById('fullscreenGallery');
    
    if (fs && fs.style.display === "flex") {
        if (e.key === "ArrowRight") {
            gallery.scrollBy({ left: gallery.clientWidth, behavior: 'smooth' });
        } else if (e.key === "ArrowLeft") {
            gallery.scrollBy({ left: -gallery.clientWidth, behavior: 'smooth' });
        } else if (e.key === "Escape") {
            closeFullImage();
        }
    }
});
