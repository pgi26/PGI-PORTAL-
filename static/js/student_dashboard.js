/**
 * ✨ Tie-up Companies List ✨
 */
const companies = [
"Vikram Solar Pvt Ltd",
"Mahle Engine Components India Pvt Ltd",
"Dae Seung Autoparts india Pvt Ltd",
"Prabha Engineering Pvt Ltd",
"Wittur Elevator Components India Pvt. Ltd",
"Wipro Enterprises Private Limited",
"Bonfiglioli Transmissions Pvt Ltd",
"Tata Electronics",
"Foxconn",
"Infac India Pvt Ltd",
"Hangchang India Pvt Ltd",
"NIPPON STEEL",
"Abrains Technologies",
"Synergyrevo Global Business Service Ltd",
"Ienergizer IT Services Pvt ltd.,",
"GJOBS India Pvt Ltd",
"Crown inspection engineering service pvt Ltd",
"Makjuz technologies",
"MAATROM HR SOLUTIONS PRIVATE LIMITED",
"Sankar sealing system pvt Ltd",
"K2 cranes& components Pvt Ltd",
"American Eye Care Centre",
"ADORY creatives",
"THE SOUTHERN ASSOCIATES",
"Trujet Printing Inks",
"NIIT IFBI - HDFC Bank",
"Westside - Trent Limited - TATA ENTERPRISE",
"Guna Manpower services",
"Emblaze Staffing Solutions",
"Mastermind",
"Quesscorp",
"iFive Technology Private Limited",
"TRAC FUJICO AIRSYSTEMS LLP",
"Deejos Engineers and Contractors",
"Dhvani Research",
"Swiggy",
"TVS Training & Services",
"Digital Inertia Private Limited"
];

const rolesData = {

    "Vikram Solar Pvt Ltd": [
        "Solar Engineer", "Production Trainee", "Maintenance Engineer"
    ],

    "Mahle Engine Components India Pvt Ltd": [
        "Mechanical Engineer", "Quality Analyst", "Production Engineer"
    ],

    "Dae Seung Autoparts india Pvt Ltd": [
        "Assembly Operator", "Machine Operator", "Quality Inspector"
    ],

    "Prabha Engineering Pvt Ltd": [
        "Design Engineer", "CNC Operator", "Production Supervisor"
    ],

    "Wittur Elevator Components India Pvt. Ltd": [
        "Lift Technician", "Mechanical Engineer", "Quality Inspector"
    ],

    "Wipro Enterprises Private Limited": [
        "Software Developer", "Test Engineer", "IT Support"
    ],

    "Bonfiglioli Transmissions Pvt Ltd": [
        "Mechanical Engineer", "Production Engineer", "Maintenance Technician"
    ],

    "Tata Electronics": [
        "Electronics Engineer", "Process Engineer", "Technician"
    ],

    "Foxconn": [
        "Production Associate", "Assembly Technician", "Line Supervisor"
    ],

    "Infac India Pvt Ltd": [
        "Manufacturing Engineer", "Quality Engineer", "Machine Operator"
    ],

    "Hangchang India Pvt Ltd": [
        "Forklift Technician", "Service Engineer", "Maintenance Staff"
    ],

    "NIPPON STEEL": [
        "Metallurgical Engineer", "Production Engineer", "Safety Officer"
    ],

    // ✅ Updated from your file (24 companies mapping)

    "Abrains Technologies": [
        "Service engg"
    ],

    "Synergyrevo Global Business Service Ltd": [
        "Customer Support Executive - Voice Process"
    ],

    "Ienergizer IT Services Pvt ltd.,": [
        "Technical support role", "Customer support executive"
    ],

    "GJOBS India Pvt Ltd": [
        "HR", "Finance", "Quality Assurance", "Coordinator"
    ],

    "Crown inspection engineering service pvt Ltd": [
        "Quality inspector"
    ],

    "Makjuz technologies": [
        "Assembly operator", "supervisor"
    ],

    "MAATROM HR SOLUTIONS PRIVATE LIMITED": [
        "HR"
    ],

    "Sankar sealing system pvt Ltd": [
        "Trainee"
    ],

    "K2 cranes& components Pvt Ltd": [
        "Technical Diploma&ITI"
    ],

    "American Eye Care Centre": [
        "Marketing Executive for Eye Care", "Tele caller", "Receptionist", "Digital Marketing"
    ],

    "ADORY creatives": [
        "Videographer", "video editor", "graphics designer", "social media manager", "directors"
    ],

    "THE SOUTHERN ASSOCIATES": [
        "CNC/VMC Operator and Setter"
    ],

    "Trujet Printing Inks": [
        "Service engineer"
    ],

    "NIIT IFBI - HDFC Bank": [
        "Assistant Manager", "Teller", "Welcome Desk"
    ],

    "Westside - Trent Limited - TATA ENTERPRISE": [
        "Apprenticeship", "Customer service Associate", "HR executive"
    ],

    "Guna Manpower services": [
        "CNC operator", "Mechanical Maintenance", "Electrical maintenance", "Quality"
    ],

    "Emblaze Staffing Solutions": [
        "ON Role and OFF ROLE"
    ],

    "Mastermind": [
        "BPO", "Tele calling"
    ],

    "Quesscorp": [
        "Banking Sectors"
    ],

    "iFive Technology Private Limited": [
        "Sales"
    ],

    "TRAC FUJICO AIRSYSTEMS LLP": [
        "Relationship Executive", "Ekyc verification specialist", "Telecalling"
    ],

    "Deejos Engineers and Contractors": [
        "HVAC - Project Multiple job Opening"
    ],

    "Dhvani Research": [
        "Site Supervisor"
    ],

    "Swiggy": [
        "Electrical technician", "Mechanical technician", "Office Assistant"
    ],

    // existing untouched
    "TVS Training & Services": [
        "Trainer", "Skill Development Executive", "Field Coordinator"
    ],

    "Digital Inertia Private Limited": [
        "Software Developer", "Digital Marketing Executive", "QA Tester"
    ],

    // fallback
    "default": [
        "HR Executive", "Operations Trainee", "Sales Associate", "Admin Executive"
    ]
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
