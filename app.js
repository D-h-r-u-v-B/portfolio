let appData = {};

document.addEventListener('DOMContentLoaded', () => {
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
    navigateTo('about');
    setupModalListeners();
}

function buildSidebar() {
    const sidebar = document.getElementById('sidebar');
    const profile = appData.profile;
    
    const avatarHtml = profile.avatar 
        ? `<img src="${profile.avatar}" alt="${profile.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` 
        : '';

    sidebar.innerHTML = `
        <div class="profile-section">
            <div class="profile-img-placeholder">${avatarHtml}</div>
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
    `;

    // Event delegation for navigation routing
    document.getElementById('nav-list').addEventListener('click', (e) => {
        if(e.target.tagName === 'A') {
            e.preventDefault();
            const route = e.target.getAttribute('data-route');
            
            // Update active state
            document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
            e.target.classList.add('active');
            
            navigateTo(route);
        }
    });
}

function navigateTo(route, param = null) {
    const contentArea = document.getElementById('app-content');
    
    // Trigger fade out
    if (contentArea.firstElementChild) {
        contentArea.firstElementChild.classList.add('fade-out');
    }

    // Wait for fade out to complete (400ms matches CSS transition)
    setTimeout(() => {
        let newHtml = '';
        switch(route) {
            case 'about': newHtml = generateAbout(); break;
            case 'projects': newHtml = generateProjects(); break;
            case 'projectDetail': newHtml = generateProjectDetail(param); break;
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
            
            // Ensure sidebar Projects link is active (if navigating back from details)
            document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
            document.querySelector('.sidebar-nav a[data-route="projects"]').classList.add('active');
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
            <h2>Technical Skills</h2>
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
                <a href="mailto:${profile.email}" class="btn contact-btn">EMAIL DIRECT</a>
                <a href="${profile.linkedin}" target="_blank" class="btn contact-btn">LINKEDIN PROFILE</a>
                <a href="tel:${profile.phone}" class="btn contact-btn">CALL DIRECTLY</a>
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
            <div class="filters">
                ${filters}
            </div>
            <div id="project-grid" class="grid-container"></div>
        </section>
    `;
}

function generateProjectDetail(projectId) {
    const project = appData.projects.find(p => p.id === projectId);
    if (!project) return `<p>Project not found.</p>`;

    let mediaContent = '';
    if (project.images && project.images.length > 0) {
        mediaContent = `
            <div class="carousel-track">
                ${project.images.map(img => `<img src="${img}" alt="${project.title}" class="carousel-img">`).join('')}
            </div>
        `;
    } else {
        mediaContent = `<div style="display:flex;align-items:center;justify-content:center;height:100%;" class="mono-text">No Visuals</div>`;
    }

    const tagsHtml = project.tags ? project.tags.map(t => `<span class="tag">${t}</span>`).join('') : '';
    const specsHtml = project.specs ? project.specs.join('<br>') : 'No specs available.';

    return `
        <section class="content-section" style="max-width: 1000px;">
            <button class="btn back-btn mono-text" onclick="navigateTo('projects')" style="width:auto; margin-bottom: 2rem; padding: 10px 20px;">&larr; Back to Projects</button>
            
            <div class="detail-header" style="margin-bottom: 2.5rem;">
                <h2 style="border:none; margin-bottom:10px; padding:0; text-transform:none;">${project.title}</h2>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <span class="tag" style="background:var(--bg-strong-secondary); box-shadow:none;">${project.category}</span>
                    <span class="tag" style="opacity: 0.8; box-shadow:none;">${project.status || 'Ongoing'}</span>
                    ${project.time ? `<span class="tag" style="opacity: 0.8; box-shadow:none;">${project.time}</span>` : ''}
                </div>
            </div>

            <div class="detail-media-container" style="height: 400px; margin-bottom: 3rem; border: 1px solid var(--border-glass); background: var(--bg-card-media); position: relative; overflow: hidden;">
                ${mediaContent}
            </div>

            <div class="detail-body">
                <p class="mono-text" style="font-size: 1.1rem; line-height: 1.8; margin-bottom: ${project.description ? '1.5rem' : '3rem'}; color: var(--text-primary);">
                    ${project.summary}
                </p>
                ${project.description ? `
                <p class="mono-text" style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 3rem; color: var(--text-primary);">
                    ${project.description}
                </p>
                ` : ''}
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 3rem; margin-bottom: 3rem;">
                    <div class="card-specs mono-text" style="margin-bottom: 0;">
                        <span style="color:var(--accent-primary); display:inline-block; margin-bottom:10px;">Technical Specifications:</span><br>
                        ${specsHtml}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 2.5rem;">
                        <div>
                            <span class="mono-text" style="color:var(--accent-primary); display:inline-block; margin-bottom:15px; font-size:0.85rem; text-transform:uppercase;">Applied Technologies:</span>
                            <div class="tags-container">
                                ${tagsHtml}
                            </div>
                        </div>
                        ${project.learning && project.learning.length > 0 ? `
                        <div>
                            <span class="mono-text" style="color:var(--accent-primary); display:inline-block; margin-bottom:15px; font-size:0.85rem; text-transform:uppercase;">Key Learnings:</span>
                            <div class="tags-container">
                                ${project.learning.map(l => `<span class="tag">${l}</span>`).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                ${project.glbModel ? `
                <div style="margin-top: 3rem; border: 1px solid var(--border-glass); background: var(--bg-card-media); border-radius: 8px; overflow: hidden;">
                    <model-viewer src="${project.glbModel}" auto-rotate camera-controls style="width: 100%; height: 500px; background-color: transparent;"></model-viewer>
                </div>
                ` : ''}
            </div>
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
    if (filter !== appData.projectCategories[0]) { 
        filteredProjects = appData.projects.filter(p => p.category === filter);
    }
    
    grid.innerHTML = '';
    
    if (filteredProjects.length === 0) {
        grid.innerHTML = '<p class="mono-text" style="grid-column: 1 / -1; margin-top:2rem;">No projects found for this category.</p>';
        return;
    }

    filteredProjects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cursor = 'pointer';
        
        // Master view: ONLY load the first image (no carousel)
        const coverImg = (project.images && project.images.length > 0) ? project.images[0] : '';
        const mediaContent = coverImg 
            ? `<img src="${coverImg}" alt="${project.title}" style="width:100%;height:100%;object-fit:cover;opacity:0.85;transition:opacity 0.4s ease;" class="card-cover-img">`
            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;" class="mono-text">No Visuals</div>`;

        const statusBadgeText = project.status || 'Ongoing';
        const timeBadgeText = project.time || '';

        card.innerHTML = `
            <div class="card-media">
                <span class="badge category-badge">${project.category}</span>
                <span class="badge status-badge">${statusBadgeText}</span>
                ${timeBadgeText ? `<span class="badge time-badge">${timeBadgeText}</span>` : ''}
                ${mediaContent}
            </div>
            <div class="card-content">
                <h3 class="card-title">${project.title}</h3>
                <p class="card-summary">${project.summary}</p>
                <div style="margin-top:auto;">
                    ${project.glbModel ? `<button class="btn view-3d-btn mono-text" data-id="${project.id}">VIEW 3D MODEL</button>` : ''}
                </div>
            </div>
        `;
        
        // Card click handler for Master-Detail routing
        card.addEventListener('click', (e) => {
            // Prevent routing if user specifically clicks the 3D button inside the card
            if (e.target.closest('.view-3d-btn')) {
                return; // Handled below
            }
            navigateTo('projectDetail', project.id);
        });

        grid.appendChild(card);
    });

    // Attach modal listener to outer card buttons
    document.querySelectorAll('.view-3d-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Double safety
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
    
    const tagsHtml = project.tags ? project.tags.map(t => `<span class="tag">${t}</span>`).join('') : '';
    info.innerHTML = `
        <p>${project.summary}</p>
        <div class="tags-container" style="margin-top:20px">${tagsHtml}</div>
    `;

    if (project.glbModel) {
        viewerContainer.innerHTML = `
            <model-viewer src="${project.glbModel}" auto-rotate camera-controls style="width: 100%; height: 500px; background-color: transparent;"></model-viewer>
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
