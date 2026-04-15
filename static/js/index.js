// -------------------- APPLICATION STATE -------------------- //

let portalType = 'student';


// -------------------- UI FUNCTIONS -------------------- //

function showLogin(t) {

portalType = t;

document.getElementById('selection').classList.add('hidden');
document.getElementById('loginForm').classList.remove('hidden');
document.getElementById('backBtn').classList.remove('hidden');

document.getElementById('portalTitle').innerText =
t === 'student' ? "Student Portal" : "Company Portal";

const regLink = document.getElementById('regLink');
const forgotLink = document.getElementById('forgotPasswordLink');

if (t === 'company') {

regLink.classList.add('hidden');
forgotLink.classList.add('hidden');

} else {

regLink.classList.remove('hidden');
forgotLink.classList.remove('hidden');

regLink.innerHTML = "📝 Register New Student";

}

}


function showSelection() {

document.getElementById('selection').classList.remove('hidden');
document.getElementById('loginForm').classList.add('hidden');
document.getElementById('registerForm').classList.add('hidden');
document.getElementById('backBtn').classList.add('hidden');

document.getElementById('portalTitle').innerText = "PGI Job Portal";

}


function showRegister() {

portalType = 'student';

document.getElementById('loginForm').classList.add('hidden');
document.getElementById('registerForm').classList.remove('hidden');

document.getElementById('regTitle').innerText = "Student Registration";

}


// -------------------- PASSWORD TOGGLE -------------------- //

function togglePassword(){

const passField=document.getElementById("pass");

passField.type=passField.type==="password"?"text":"password";

}

function toggleRegisterPassword(){

const passField=document.getElementById("regPass");

passField.type=passField.type==="password"?"text":"password";

}


// -------------------- FORGOT PASSWORD -------------------- //

async function forgotPassword(){

const email=prompt("Enter your registered email:");

if(!email) return;

try{

const response=await fetch("/api/forgot_password",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
email:email
})

});

const data=await response.json();

if(data.status==="success"){

alert("Password reset link sent to your email.");

}else{

alert(data.message || "Email not found.");

}

}catch(error){

console.error(error);
alert("Server error while sending reset email.");

}

}


// -------------------- STUDENT REGISTRATION -------------------- //

async function handleRegistration(){

let name=document.getElementById('regName').value.trim();
let email=document.getElementById('regEmail').value.trim();
let pass=document.getElementById('regPass').value.trim();

if(!name || !email || !pass){

alert("Fill all fields");

return;

}

try{

const response=await fetch("/api/student/register",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

name:name,
email:email,
password:pass

})

});

const data=await response.json();

if(data.status==="success"){

alert("Student Registration Successful!");

showSelection();

}else{

alert(data.message || "Registration failed");

}

}catch(error){

console.error(error);

alert("Server error during registration");

}

}


// -------------------- LOGIN -------------------- //

async function handleLogin(){

let email=document.getElementById('email').value.trim();
let pass=document.getElementById('pass').value.trim();

if(!email || !pass){

alert("Enter email and password");

return;

}

try{

if(portalType==="student"){

const response=await fetch("/api/student/login",{

method:"POST",
credentials:"include",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
email:email,
password:pass
})

});

const data=await response.json();

if(data.status === "success"){

    // Save logged-in user
    localStorage.setItem(
        "active_student",
        JSON.stringify({ email: email })
    );

    window.location.href = "student_dashboard.html";
}else{

alert("Invalid Student Credentials");

}

}

else{

const response=await fetch("/api/company/login",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
email:email,
password:pass
})

});

const data=await response.json();

if(data.status==="success"){

window.location.href="/company_dashboard.html";

}else{

alert("Invalid Company Credentials");

}

}

}catch(error){

console.error(error);

alert("Server error during login");

}

}


// -------------------- ENTER KEY SUPPORT -------------------- //

document.addEventListener("keypress",function(event){

if(event.key==="Enter"){

const loginVisible=!document.getElementById("loginForm").classList.contains("hidden");
const registerVisible=!document.getElementById("registerForm").classList.contains("hidden");

if(loginVisible){
handleLogin();
}

if(registerVisible){
handleRegistration();
}

}

});