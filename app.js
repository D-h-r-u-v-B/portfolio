let appData = {};

document.addEventListener('DOMContentLoaded', () => {
    // Fetch unified JSON data controlling the SPA
    fetch('data/content.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            appData = data;
            initSPA();
        })
        .catch(err => {
            console.error('Error loading content:', err);
            document.getElementById('sidebar').innerHTML = '<p class="mono-text" style="padding: 2rem; color: var(--accent-hover);">System Initialization Failed. Check local server.</p>';
        });
});

function initSPA() {
    buildSidebar();
    // Default route
    navigateTo('about');
    setupModalListeners();
}

function buildSidebar() {
    const sidebar = document.getElementById('sidebar');
    const profile = appData.profile;
    
    sidebar.innerHTML = `
        <div class="profile-section">
            <div class="profile-img-placeholder"></div>
            <h1>${profile.name}</h1>
            <p class="subtitle">${profile.title}</p>
        </div>
        <nav class="sidebar-nav">
            <ul id="nav-list">
                <li><a href="#" data-route="about" class="active">About</a></li>
                <li><a href="#" data-route="projects">Projects</a></li>
                <li><a href="#" data-route="skills">Skills</a></li>
                <li><a href="#" data-route="contact">Contact</a></li>
            </ul>
        </nav>
        <div class="social-links">
            <a href="${profile.github}" target="_blank">GitHub</a>
            <a href="${profile.linkedin}" target="_blank">LinkedIn</a>
        </div>
    `;

    // Event delegation for navigation routing
    document.getElementById('nav-list').addEventListener('click', (e) => {
        if(e.target.tagName === 'A') {
            e.preventDefault();
            const route = e.target.getAttribute('data-route');
            
            // Update active styling
            document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
            e.target.classList.add('active');
            
            navigateTo(route);
        }
    });
}

function navigateTo(route) {
    const contentArea = document.getElementById('app-content');
    
    // Add fade-out transition
    if (contentArea.firstElementChild) {
        contentArea.firstElementChild.classList.add('fade-out');
    }

    // Wait for fade out to complete (400ms matches CSS transition)
    setTimeout(() => {
        let newHtml = '';
        switch(route) {
            case 'about': newHtml = generateAbout(); break;
            case 'projects': newHtml = generateProjects(); break;
            case 'skills': newHtml = generateSkills(); break;
            case 'contact': newHtml = generateContact(); break;
        }
        
        // Inject new content wrapped in the transition wrapper
        contentArea.innerHTML = `<div class="page-wrapper fade-out">${newHtml}</div>`;
        const wrapper = contentArea.querySelector('.page-wrapper');
        
        // Post-injection logic for specific routes
        if (route === 'projects') {
            attachProjectListeners();
            renderProjectCards(appData.projectCategories[0]); // Render 'All' initially
        }
        
        // Trigger reflow to ensure the fade-in animation applies
        void wrapper.offsetWidth;
        
        // Fade in
        wrapper.classList.remove('fade-out');
        
        // Ensure scroll resets to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400); 
}

/* ================== HTML GENERATORS ================== */

function generateAbout() {
    const paragraphs = appData.profile.aboutMe.map(p => `<p class="mono-text" style="margin-bottom:1.5rem; font-size:1rem; line-height:1.8;">${p}</p>`).join('');
    return `
        <section class="content-section">
            <h2>About</h2>
            <div style="max-width: 800px;">
                ${paragraphs}
            </div>
        </section>
    `;
}

function generateSkills() {
    const cols = appData.skills.map(skillGroup => `
        <div class="skill-category">
            <h3 class="mono-text">${skillGroup.category}</h3>
            <ul class="skill-list">
                ${skillGroup.items.map(item => `<li class="mono-text">${item}</li>`).join('')}
            </ul>
        </div>
    `).join('');
    
    return `
        <section class="content-section">
            <h2>Technical Stack</h2>
            <div class="skills-grid">
                ${cols}
            </div>
        </section>
    `;
}

function generateContact() {
    const profile = appData.profile;
    return `
        <section class="content-section">
            <h2>Connect</h2>
            <p class="mono-text" style="margin-bottom: 2rem;">Seeking new opportunities or collaborations? My inbox is always open.</p>
            <div class="contact-links" style="display:flex; gap: 20px; flex-wrap: wrap;">
                <a href="mailto:${profile.email}" class="btn contact-btn">Email Direct</a>
                <a href="${profile.linkedin}" target="_blank" class="btn contact-btn">LinkedIn Profile</a>
                <a href="${profile.github}" target="_blank" class="btn contact-btn">GitHub Repos</a>
            </div>
        </section>
    `;
}

function generateProjects() {
    const filters = appData.projectCategories.map((cat, idx) => `
        <button class="filter-btn ${idx === 0 ? 'active' : ''}" data-filter="${cat}">${cat}</button>
    `).join('');

    return `
        <section class="content-section">
            <h2>Systems & R&D</h2>
            <div class="filters">
                ${filters}
            </div>
            <div id="project-grid" class="grid-container"></div>
        </section>
    `;
}

/* ================== DYNAMIC COMPONENT LOGIC ================== */

function attachProjectListeners() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const filter = e.target.getAttribute('data-filter');
            renderProjectCards(filter);
        });
    });
}

function renderProjectCards(filter) {
    const grid = document.getElementById('project-grid');
    if (!grid) return;
    
    let filteredProjects = appData.projects;
    if (filter !== appData.projectCategories[0]) { // 0 is "All"
        filteredProjects = appData.projects.filter(p => p.category === filter);
    }
    
    grid.innerHTML = '';
    
    if (filteredProjects.length === 0) {
        grid.innerHTML = '<p class="mono-text" style="grid-column: 1 / -1; margin-top:2rem;">No data available for this sector.</p>';
        return;
    }

    filteredProjects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const mediaContent = project.thumbnail 
            ? `<img src="${project.thumbnail}" alt="${project.title}">`
            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;" class="mono-text">No Visuals</div>`;

        card.innerHTML = `
            <div class="card-media">
                <span class="badge">${project.category}</span>
                ${mediaContent}
            </div>
            <div class="card-content">
                <h3 class="card-title">${project.title}</h3>
                <p class="card-summary">${project.summary}</p>
                <div class="card-specs mono-text">
                    <span style="color:var(--accent-primary)">Specs:</span><br>
                    ${project.specs.join('<br>')}
                </div>
                <button class="btn view-3d-btn mono-text" data-id="${project.id}">
                    ${project.glbModel ? 'View 3D Model' : 'View Documentation'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    // Attach modal listener to new buttons
    document.querySelectorAll('.view-3d-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projId = e.target.getAttribute('data-id');
            const proj = appData.projects.find(p => p.id === projId);
            openModal(proj);
        });
    });
}

/* ================== MODAL LOGIC ================== */

function setupModalListeners() {
    const modal = document.getElementById('model-modal');
    const closeBtn = document.getElementById('close-modal');

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
    });
}

function openModal(project) {
    const modal = document.getElementById('model-modal');
    const title = document.getElementById('modal-title');
    const info = document.getElementById('modal-info');
    const viewerContainer = document.getElementById('viewer-container');

    title.textContent = project.title;
    
    const tagsHtml = project.tags.map(t => `<span class="tag">${t}</span>`).join('');
    info.innerHTML = `
        <p>${project.summary}</p>
        <div class="tags-container" style="margin-top:20px">${tagsHtml}</div>
    `;

    if (project.glbModel) {
        viewerContainer.innerHTML = `
            <model-viewer
                src="${project.glbModel}"
                alt="3D model of ${project.title}"
                camera-controls
                orbit-controls
                shadow-intensity="1"
                touch-action="pan-y">
            </model-viewer>
        `;
    } else {
        viewerContainer.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted)" class="mono-text">
                Simulation mesh data unavailable.
            </div>
        `;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
}

function closeModal() {
    const modal = document.getElementById('model-modal');
    const viewerContainer = document.getElementById('viewer-container');
    
    modal.classList.add('hidden');
    viewerContainer.innerHTML = ''; // memory conservation
    document.body.style.overflow = 'auto'; 
}
