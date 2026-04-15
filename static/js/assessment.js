// Verify user is logged in
const activeUser = JSON.parse(localStorage.getItem("active_student"));

if (!activeUser || !activeUser.email) {
    alert("User not logged in. Please login again.");
    window.location.href = "index.html";
}
const userEmail = activeUser.email;
const userLockKey = `pgi_completed_tests_${activeUser.email}`;


// Dynamic Variables from domain.html
const selectedPath = localStorage.getItem('pgi_selected_path') || 'tech';
const selectedDomain = localStorage.getItem('pgi_specific_subdomain');

if (!selectedDomain) { 
    window.location.href = "/domain.html"; 
}


// QUESTIONS DATABASE (loaded from questions.js)
let domainData = {};
let customTestNames = [];

if (typeof questionsDB !== "undefined" && questionsDB[selectedDomain]) {
    domainData = questionsDB[selectedDomain];
    customTestNames = Object.keys(domainData);
}


// PAGE LOAD
document.addEventListener("DOMContentLoaded", async () => {

    // Check if profile completed
    try {

        const response = await fetch('/api/check_profile_status', {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();

        if(!data.profile_completed){
            alert("⚠️ Please complete your student profile before taking the assessment.");
            window.location.href = "student_dashboard.html";
            return;
        }

    } catch(error){
        console.log("Profile check failed");
    }

    document.getElementById('bannerTitle').innerText =
        selectedDomain + " Assessment";

    const dynamicCard = document.getElementById('dynamicCard');
    const dynamicSectionTitle = document.getElementById('dynamicSectionTitle');

    if (selectedPath === 'tech') {
        dynamicCard.classList.remove('non-tech');
        dynamicSectionTitle.innerHTML = `💻 ${selectedDomain} Section`;
    } else {
        dynamicCard.classList.add('non-tech');
        dynamicSectionTitle.innerHTML = `🧠 ${selectedDomain} Section`;
    }

    renderTestCards();
    checkStatus();

});


// TEST CARD RENDER
function renderTestCards() {

    let testsHtml = "";

    customTestNames.forEach((testName, index) => {

        let displayQCount = index === 0 ? 25 : 15;
        let displayTime = index === 0 ? 30 : 45;

        testsHtml += `
        <div class="test-box">

            <div class="test-header">
                <h3 class="test-name">
                    ${testName}
                    <span class="start-here-badge" id="hint-${testName}">
                        ${index===0 ? '⚡ Start Here' : ''}
                    </span>
                </h3>

                <span class="status-badge" id="badge-${testName}">
                    Not Started
                </span>
            </div>

            <div class="test-meta">
                <span class="meta-pill">⏱️ ${displayTime} Mins</span>
                <span class="meta-pill">📝 ${displayQCount} MCQs</span>
            </div>

            <button class="start-test-btn"
                id="btn-${testName}"
                onclick="openRulesModal('${testName}')">

                Begin ${testName} →
            </button>

        </div>`;
    });

    document.getElementById('testCardsContainer').innerHTML = testsHtml;
}



// CHECK TEST STATUS
async function checkStatus() {

    try {

        const response = await fetch('/api/check_assessment_status', {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
                email: userEmail,
                domain: selectedDomain
            })
        });

        const data = await response.json();
        const completedTests = data.completed_tests || [];

        customTestNames.forEach(testName => {

            const badge = document.getElementById('badge-' + testName);
            const btn = document.getElementById('btn-' + testName);
            const hint = document.getElementById('hint-' + testName);

            if(completedTests.includes(testName)) {

                badge.innerText = "Completed";
                badge.style.background = "#dcfce7";
                badge.style.color = "#166534";

                btn.innerText = "✓ Completed";
                btn.disabled = true;
                btn.onclick = null;

                if(hint) hint.style.display = "none";
            }

        });

    } catch(error) {

        console.log("Status check failed");

    }

}


let currentTestName = "";
let currentQuestions = [];
let testTimerInterval;


// RULES MODAL
function openRulesModal(testName) {

    currentTestName = testName;

    document.getElementById('rulesModal').classList.add('active');
    document.getElementById('agreeCheck').checked = false;

    toggleProceedBtn();
}


function toggleProceedBtn() {

    const agree =
        document.getElementById('agreeCheck').checked;

    document.getElementById('proceedBtn')
        .classList.toggle('active', agree);
}



// ANTI-CHEAT
let hasBeenWarned = false;
let isTestActive = false;
let isAlertActive = false;


function enableAntiCheat(){

    isTestActive = true;
    hasBeenWarned = false;
    isAlertActive = false;

    const elem = document.documentElement;

    if (elem.requestFullscreen)
        elem.requestFullscreen().catch(()=>{});

    document.addEventListener("visibilitychange",
        handleSecurityViolation);

    window.addEventListener("blur",
        handleSecurityViolation);

    document.addEventListener("fullscreenchange",
        handleFullscreenViolation);
}


function disableAntiCheat(){

    isTestActive = false;

    document.removeEventListener("visibilitychange",
        handleSecurityViolation);

    window.removeEventListener("blur",
        handleSecurityViolation);

    document.removeEventListener("fullscreenchange",
        handleFullscreenViolation);

    if (document.fullscreenElement)
        document.exitFullscreen().catch(()=>{});
}



function handleSecurityViolation(){

    if(isTestActive &&
       !isAlertActive &&
       (document.hidden || !document.hasFocus()))
        triggerViolation();
}


function handleFullscreenViolation(){

    if(isTestActive &&
       !isAlertActive &&
       !document.fullscreenElement)
        triggerViolation();
}



function triggerViolation(){

    if(!isTestActive || isAlertActive) return;

    isAlertActive = true;

    if(!hasBeenWarned){

        hasBeenWarned = true;

        document.getElementById('securityAlert')
            .classList.add('active');

    } else {

        submitExam(true);

    }
}


function dismissWarning(){

    document.getElementById('securityAlert')
        .classList.remove('active');

    if(document.documentElement.requestFullscreen &&
       !document.fullscreenElement)
        document.documentElement.requestFullscreen();

    setTimeout(()=>{ isAlertActive=false },2000);
}



// START TEST
function startTest(){

    // Block mobile devices
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        alert("This assessment can only be taken on Laptop or Desktop.");
        return;
    }

    document.getElementById('rulesModal').classList.remove('active');

    document.getElementById('dashboardContent')
        .style.display = 'none';

    currentQuestions = domainData[currentTestName] || [];

    document.getElementById('examTitle')
        .innerText = currentTestName;

    buildExamUI();

    document.getElementById('examInterface')
        .style.display = 'block';

    enableAntiCheat();

    let time =
        (currentTestName === customTestNames[0])
        ? 30*60 : 45*60;

    testTimerInterval = setInterval(()=>{

        let min = Math.floor(time/60);
        let sec = time % 60;

        document.getElementById('examTimer')
        .innerText = `${min}:${sec<10?'0':''}${sec}`;

        if(time<=0){
            clearInterval(testTimerInterval);
            submitExam();
        }

        time--;

    },1000);

}



// BUILD QUESTIONS
function buildExamUI(){

    const wrapper =
        document.getElementById('questionsWrapper');

    wrapper.innerHTML="";

    currentQuestions.forEach((qObj,qIndex)=>{

        let html=
        `<div class="question-block">
        <div class="question-text">
        ${qIndex+1}. ${qObj.q}
        </div>
        <div class="options-list">`;

        qObj.options.forEach((opt,optIndex)=>{

            html+=`
            <label class="option-label">
            <input type="radio"
            name="q${qIndex}"
            value="${optIndex}"
            onchange="checkCompletion()">
            <span>${opt}</span>
            </label>`;

        });

        wrapper.innerHTML+=html+`</div></div>`;
    });

}



// CHECK ANSWERS FILLED
function checkCompletion(){

    let totalAnswered=0;

    currentQuestions.forEach((q,index)=>{

        if(document.querySelector(`input[name="q${index}"]:checked`))
            totalAnswered++;

    });

    document.getElementById('submitExamBtn')
        .disabled = (totalAnswered !== currentQuestions.length);

}



// SUBMIT EXAM
// SUBMIT EXAM
async function submitExam(isDisqualified=false){

    clearInterval(testTimerInterval);
    disableAntiCheat();

    document.getElementById('examInterface')
        .style.display='none';

    let score=0;

    currentQuestions.forEach((qObj,qIndex)=>{

        const selectedRadio=
        document.querySelector(`input[name="q${qIndex}"]:checked`);

        const selectedVal=
        selectedRadio?selectedRadio.value:-1;

        const isCorrect=
        parseInt(selectedVal)===qObj.answer;

        if(isCorrect && !isDisqualified) score++;

    });


    const totalQ=currentQuestions.length||1;

    const percentage=
        isDisqualified ? 0 :
        Math.round((score/totalQ)*100);
    let status = "failed";

    if (isDisqualified) {
        status = "disqualified";
    }
    else if (percentage >= 60) {
        status = "passed";
    }


    // SAVE SCORE LOCAL
    let students =
    JSON.parse(localStorage.getItem("pgi_students")) || [];

    students = students.map(s=>{
        if(s.email===activeUser.email)
            s.score = percentage;
        return s;
    });

    localStorage.setItem("pgi_students",JSON.stringify(students));


    // SEND TO BACKEND
    try {

        const response = await fetch('/api/submit_assessment', {
        method: 'POST',
        credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                domain: selectedDomain,
                test_name: currentTestName,
                score: percentage,
                completed: true,
                status: status
            })
        });

        const result = await response.json();

        if(result.status !== "success"){
            console.log("Server response:", result.message);
        }

    } catch(error) {

        console.log("❌ Backend connection failed.");

    }

    // SHOW RESULT PAGE
    document.getElementById('resultInterface')
        .style.display='block';


    // DISPLAY SCORE
    document.getElementById("finalScoreDisplay")
        .innerText = `${score}/${totalQ}`;

    document.getElementById("finalPercentageDisplay")
        .innerText = `${percentage}%`;


    // RESULT MESSAGE
if(isDisqualified){

    document.getElementById("resultHeaderTitle")
        .innerText = "Test Disqualified";

    document.getElementById("resultHeaderTitle")
        .style.color = "red";

    document.getElementById("resultHeaderSub")
        .innerText =
        "You violated the exam rules by leaving the secure environment.";

}
else if(percentage >= 60){

    document.getElementById("resultHeaderTitle")
        .innerText = "You have Passed";

    document.getElementById("resultHeaderTitle")
        .style.color = "#14532d";   // dark tree green

}
else{

    document.getElementById("resultHeaderTitle")
        .innerText = "You have Failed";

    document.getElementById("resultHeaderTitle")
        .style.color = "red";

}



    // BUILD ANSWER REVIEW
    let reviewHTML="";

    currentQuestions.forEach((qObj,index)=>{

        const selectedRadio=
        document.querySelector(`input[name="q${index}"]:checked`);

        const selectedVal=
        selectedRadio?parseInt(selectedRadio.value):-1;

        const correctIndex=qObj.answer;

        const userAnswer=
        selectedVal>=0?qObj.options[selectedVal]:"Not Answered";

        const correctAnswer=
        qObj.options[correctIndex];

        const isCorrect=
        selectedVal===correctIndex;

        reviewHTML+=`
        <div class="review-card">

            <h4>Q${index+1}. ${qObj.q}</h4>

            <p>
            <strong>Your Answer:</strong>
            <span style="color:${isCorrect ? 'green':'red'}">
            ${userAnswer}
            </span>
            </p>

            <p>
            <strong>Correct Answer:</strong>
            ${correctAnswer}
            </p>

        </div>
        `;
    });


    document.getElementById("reviewWrapper")
        .innerHTML=reviewHTML;



    // BUTTON REDIRECTION LOGIC
    const actionBtn = document.getElementById("finalActionBtn");

    if(isDisqualified || percentage < 60){

        actionBtn.innerText = "Go to Portal";

        actionBtn.onclick = function(){
            window.location.href = "https://e0407613.lmsportel.pages.dev/";
        };

    }else{

        actionBtn.innerText = "Go to Dashboard";

        actionBtn.onclick = function(){
            window.location.href = "student_dashboard.html";
        };

    }

}


// CLOSE RULES MODAL
const rulesModal =
document.getElementById('rulesModal');

if(rulesModal){

    rulesModal.addEventListener('click',function(e){

        if(e.target===this)
            this.classList.remove('active');

    });

}