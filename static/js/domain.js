document.addEventListener("DOMContentLoaded", function() {

    // 1. Check which path student selected
    const selectedPath = localStorage.getItem('pgi_selected_path');

    // If student somehow came here without selecting path
    if (!selectedPath) {
        window.location.href = '/student_dashboard.html';
        return;
    }

    // 2. Show correct specialization grid
    const techGrid = document.getElementById('tech-domains');
    const nonTechGrid = document.getElementById('non-tech-domains');
    const pageTitle = document.getElementById('page-title');

    if (selectedPath === 'tech') {
        pageTitle.innerText = "Technical Specializations 💻";
        techGrid.style.display = 'grid';
    } 
    
    else if (selectedPath === 'non-tech') {
        pageTitle.innerText = "Non-Technical Specializations 💼";
        nonTechGrid.style.display = 'grid';
    }
});


// When student selects a specific specialization
function goToAssessment(subDomainName) {

    // Save specialization temporarily
    localStorage.setItem('pgi_specific_subdomain', subDomainName);

    // Go to assessment page
    window.location.href = '/assessment.html';
}