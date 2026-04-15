/**
 * ✨ Tie-up Companies List ✨
 */
const companies = [
    "Vikram Solar Pvt Ltd", "Mahle Engine Components India Pvt Ltd", 
    "Dae Seung Autoparts india Pvt Ltd", "Prabha Engineering Pvt Ltd", 
    "Wittur Elevator Components India Pvt. Ltd", "Wipro Enterprises Private Limited", 
    "Bonfiglioli Transmissions Pvt Ltd", "Tata Electronics", "Foxconn", 
    "Infac India Pvt Ltd", "Hangchang India Pvt Ltd", "NIPPON STEEL", 
    "Synergyrevo Global Business Service Ltd", "GJOBS India Pvt Ltd", 
    "Crown inspection engineering service pvt Ltd", "Makjuz technologies", 
    "MAATROM HR SOLUTIONS PRIVATE LIMITED", "Sankar sealing system pvt Ltd", 
    "K2 cranes& components Pvt Ltd", "American Eye Care Centre", 
    "ADORY creatives", "Trujet Printing Inks", "TVS Training & Services", 
    "Digital Inertia Private Limited"
];

/**
 * ✨ Role Data Configuration ✨
 */
const rolesData = {
    "default": ["HR Executive", "Operations Trainee", "Sales Associate", "Admin Executive"]
};

/**
 * Initialize Dashboard
 */
function init() {

    // Set student name (simple placeholder now)
    const nameDisplay = document.getElementById("userName");
    if (nameDisplay) {
        nameDisplay.innerText = `Hello, Student`;
    }

    // Load company grid
    const grid = document.getElementById('companyGrid');
    if (grid) {
        grid.innerHTML = '';

        companies.forEach(name => {

            const div = document.createElement('div');

            div.className = 'company-item';
            div.innerText = name;

            div.onclick = () => showRoles(name);

            grid.appendChild(div);
        });
    }

    // Reset career path
    localStorage.removeItem('pgi_selected_path');

    // Show welcome modal
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) welcomeModal.style.display = 'flex';
}


/**
 * Welcome Modal
 */
function closeWelcomeModal() {
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) welcomeModal.style.display = 'none';
}


/**
 * Career Path Selection
 */
function selectPath(element, path) {

    document.querySelectorAll('.path-btn').forEach(b => b.classList.remove('selected'));

    element.classList.add('selected');

    localStorage.setItem('pgi_selected_path', path);
}


/**
 * Assessment Button
 */
function checkAndProceed() {

    const selectedPath = localStorage.getItem('pgi_selected_path');

    if (!selectedPath) {
        alert("⚠️ Please select a Career Path before taking the assessment.");
        return;
    }

    window.location.href = '/domain.html';
}


/**
 * Show Company Roles
 */
function showRoles(company) {

    const overlay = document.getElementById('modalOverlay');
    const title = document.getElementById('modalTitle');
    const container = document.getElementById('rolesContainer');

    title.innerText = company;
    container.innerHTML = '';

    const roles = rolesData[company] || rolesData["default"];

    roles.forEach(role => {

        const roleDiv = document.createElement('div');

        roleDiv.className = 'role-tag';
        roleDiv.innerText = role;

        container.appendChild(roleDiv);
    });

    overlay.style.display = 'flex';
}


function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}


/**
 * Profile Update
 */
function saveDetails(e) {

    e.preventDefault();

    const form = document.getElementById("profileForm");
    const formData = new FormData(form);

    fetch("/api/update_profile", {
        method: "POST",
        credentials: "include",
        body: formData
    })
    .then(res => res.json())
    .then(data => {

        if (data.status === "success") {
            alert("✅ Profile updated successfully!");
            form.reset();
        } else {
            alert("❌ Profile update failed.");
        }

    })
    .catch(err => {
        console.error("Error:", err);
        alert("Server error occurred.");
    });
}



/**
 * Logout
 */
function logout() {

    fetch("/logout")
        .then(() => {
            window.location.href = "/";
        });
}


/**
 * Start Dashboard
 */
document.addEventListener('DOMContentLoaded', init);