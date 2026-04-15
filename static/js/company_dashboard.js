/**
 * Dashboard Initialization
 */
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("companyNameDisplay").innerText = "Recruiter";
    document.getElementById("headerCompanyName").innerText = "Hello, Recruiter";

    document.getElementById('welcomeModal').style.display = 'flex';

    // Enable search when pressing Enter
    const searchInput = document.querySelector(".search-bar input");

    if (searchInput) {

        searchInput.addEventListener("keypress", function(e) {

            if (e.key === "Enter") {
                e.preventDefault();
            searchStudents();
        }

    });

}

});


function closeWelcomeModal() {
    document.getElementById('welcomeModal').style.display = 'none';
}


/**
 * UI Toggles
 */
function toggleNotifications(){

    let box = document.getElementById("notifications");

    box.style.display =
        box.style.display === "block" ? "none" : "block";
}


function toggleProfileMenu(){

    let menu = document.getElementById("profileMenu");

    menu.style.display =
        menu.style.display === "block" ? "none" : "block";
}


/**
 * Notification System
 */
function showNotification(message){

    let popup = document.getElementById("popup");

    popup.innerText = message;
    popup.style.display = "block";

    let sound = document.getElementById("notifySound");

    if(sound) sound.play();

    let count = document.getElementById("count");

    count.innerText = parseInt(count.innerText) + 1;

    let list = document.getElementById("notificationList");

    let item = document.createElement("div");

    item.className = "notification";
    item.innerText = message;

    list.prepend(item);

    setTimeout(() => {
        popup.style.display = "none";
    }, 3000);
}


/**
 * Show Student List (temporary demo)
 */
async function openDataModal(filterType) {

    let header = document.getElementById("tableHeader");

    header.innerHTML = `
    <tr>
        <th>Student Name</th>
        <th>Email</th>
        <th>Assessment Score</th>
        <th>Eligibility Status</th>
    </tr>
    `;

    let url = "";

    if (filterType === "all") {
        url = "/api/company/all_students";
        document.getElementById("modalTitle").innerText = "All Registered Students";
    }

    if (filterType === "eligible") {
        url = "/api/company/eligible_students";
        document.getElementById("modalTitle").innerText = "Eligible Students (Score ≥ 60%)";
    }

    let response = await fetch(url);
    let data = await response.json();

    let students = data.students || [];

    let tbody = document.getElementById("studentTableBody");

    tbody.innerHTML = "";

    students.forEach(s => {

        let statusHTML = "";

        if (s.score >= 60) {
            statusHTML = "<span class='status-eligible'>Eligible</span>";
        } else {
            statusHTML = "<span class='status-rejected'>Not Eligible</span>";
        }

        let row = document.createElement("tr");

        row.innerHTML = `
            <td style="font-weight:600;">${s.name}</td>
            <td>${s.email}</td>
            <td>${s.score}%</td>
            <td>${statusHTML}</td>
        `;

        tbody.appendChild(row);
    });

    document.getElementById("dataModal").style.display = "flex";
}

async function openProfilesModal() {

    let header = document.getElementById("tableHeader");

    header.innerHTML = `
    <tr>
        <th>Student Name</th>
        <th>Email</th>
        <th>Mobile</th>
        <th>College</th>
        <th>Degree</th>
        <th>Age</th>
        <th>Resume</th>
    </tr>
    `;

    let response = await fetch("/api/company/student_profiles");

    let data = await response.json();

    let profiles = data.profiles || [];

    let tbody = document.getElementById("studentTableBody");

    tbody.innerHTML = "";

    document.getElementById("modalTitle").innerText = "Student Profiles";

    profiles.forEach(p => {

        let row = document.createElement("tr");

        row.innerHTML = `
            <td style="font-weight:600;">${p.name}</td>
            <td>${p.email}</td>
            <td>${p.mobile}</td>
            <td>${p.college}</td>
            <td>${p.degree}</td>
            <td>${p.age}</td>
            <td>
                <a href="${p.resume_url}" target="_blank" class="download-btn">
                    Download Resume
                </a>
            </td>
        `;

        tbody.appendChild(row);
    });

    document.getElementById("dataModal").style.display = "flex";
}

function closeDataModal() {
    document.getElementById("dataModal").style.display = "none";
}

/**
 * Search Students
 */
async function searchStudents() {

    const query = document.querySelector(".search-bar input").value;

    if (!query) {
        alert("Please enter something to search.");
        return;
    }

    const response = await fetch(`/api/company/search_students?q=${query}`);
    const data = await response.json();

    let tbody = document.getElementById("studentTableBody");
    tbody.innerHTML = "";

    document.getElementById("modalTitle").innerText = "Search Results";

    data.students.forEach(s => {

        let row = document.createElement("tr");

        row.innerHTML = `
            <td style="font-weight:600;">${s.name}</td>
            <td>${s.email}</td>
            <td>${s.college}</td>
            <td>${s.degree}</td>
        `;

        tbody.appendChild(row);
    });

    document.getElementById("dataModal").style.display = "flex";
}

/**
 * Open Interview Scheduling
 */
async function openInterviewModal(){

    document.getElementById("modalTitle").innerText = "Interview Scheduling";

    // Load already scheduled interviews
    let interviewResponse = await fetch("/api/company/interviews");

    let interviewData = await interviewResponse.json();

    let scheduled = interviewData.interviews || [];

    let response = await fetch("/api/company/interview_candidates");

    let data = await response.json();

    let students = data.students || [];

    let header = document.getElementById("tableHeader");

    header.innerHTML = `
    <tr>
    <th>Student Name</th>
    <th>Email</th>
    <th>Score</th>
    <th>Date</th>
    <th>Time</th>
    <th>Status</th>
    <th>Action</th>
    </tr>
    `;

    let tbody = document.getElementById("studentTableBody");

    tbody.innerHTML = "";

    students.forEach(s => {

        let row = document.createElement("tr");

        let interview = scheduled.find(i => i.student_email === s.email);

    let statusText = interview ? "Scheduled" : "Not Scheduled";

    row.innerHTML = `
    <td>${s.name}</td>
    <td>${s.email}</td>
    <td>${s.score}%</td>

    <td>
    <input type="date" id="date_${s.id}">
    </td>

    <td>
    <input type="time" id="time_${s.id}">
    </td>

    <td>${statusText}</td>

    <td>
    <button onclick="scheduleInterview('${s.email}', ${s.id})">
    Schedule
    </button>
    </td>
    `;
        tbody.appendChild(row);

    });

    document.getElementById("dataModal").style.display = "flex";
}

function scheduleInterview(email, id){

    const date = document.getElementById(`date_${id}`).value;
    const time = document.getElementById(`time_${id}`).value;

    if(!date || !time){

        alert("Please select date and time");

        return;
    }

    fetch("/api/company/schedule_interview",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            student_email: email,
            date: date,
            time: time

        })

    })
    .then(res => res.json())
    .then(data => {

        if(data.status === "success"){

            alert("Interview Scheduled Successfully");

        }else{

            alert("Scheduling Failed");

        }

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
 * Close modal when clicking outside
 */
window.onclick = function(event) {

    let dataModal = document.getElementById('dataModal');
    let welcomeModal = document.getElementById('welcomeModal');
    let notifications = document.getElementById("notifications");
    let profileMenu = document.getElementById("profileMenu");

    let bell = document.querySelector(".bell");
    let profile = document.querySelector(".profile");

    // Close data modal
    if (event.target == dataModal) {
        closeDataModal();
    }

    // Close welcome modal
    if (event.target == welcomeModal) {
        closeWelcomeModal();
    }

    // Close notifications if clicked outside
    if (notifications && !notifications.contains(event.target) && !bell.contains(event.target)) {
        notifications.style.display = "none";
    }

    // Close profile menu if clicked outside
    if (profileMenu && !profileMenu.contains(event.target) && !profile.contains(event.target)) {
        profileMenu.style.display = "none";
    }
}