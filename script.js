// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('notesUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Set user name
    document.getElementById('user-name').textContent = `Welcome, ${user.name}!`;

    // Logout functionality
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('notesUser');
        window.location.href = 'login.html';
    });

    // Load notes
    loadNotes();

    // New note button
    document.getElementById('new-note-btn').addEventListener('click', openNoteModal);

    // Modal functionality
    document.getElementById('close-modal').addEventListener('click', closeNoteModal);
    document.getElementById('cancel-btn').addEventListener('click', closeNoteModal);

    // Note form submission
    document.getElementById('note-form').addEventListener('submit', saveNote);

    // Search functionality
    document.getElementById('search-input').addEventListener('input', filterNotes);

    // Category filter functionality
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterNotes();
        });
    });

    // Sort functionality
    document.getElementById('sort-select').addEventListener('change', filterNotes);

    // Rich text editor functionality
    setupRichTextEditor();

    // Tags functionality
    setupTagsInput();
});

function loadNotes() {
    const user = JSON.parse(localStorage.getItem('notesUser'));
    const notes = JSON.parse(localStorage.getItem(`notes_${user.id}`) || '[]');
    
    // Update stats
    document.getElementById('total-notes').textContent = notes.length;
    document.getElementById('total-categories').textContent = new Set(notes.map(n => n.category)).size;
    
    // Apply current filters
    filterNotes();
}

function openNoteModal() {
    document.getElementById('modal-title').textContent = 'New Note';
    document.getElementById('note-form').removeAttribute('data-edit-id');
    document.getElementById('note-modal').style.display = 'flex';
}

function closeNoteModal() {
    document.getElementById('note-modal').style.display = 'none';
    document.getElementById('note-form').reset();
    document.getElementById('note-content').innerHTML = '';
    document.getElementById('note-form').removeAttribute('data-edit-id');
    window.setTags([]);
}

function saveNote(e) {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('notesUser'));
    const notes = JSON.parse(localStorage.getItem(`notes_${user.id}`) || '[]');
    const editId = document.getElementById('note-form').dataset.editId;
    
    const noteData = {
        title: document.getElementById('note-title').value,
        category: document.getElementById('note-category').value,
        content: document.getElementById('note-content').innerHTML,
        tags: window.getTags(),
        date: new Date().toISOString()
    };
    
    if (editId) {
        // Edit existing note
        const noteIndex = notes.findIndex(n => n.id == editId);
        if (noteIndex !== -1) {
            notes[noteIndex] = { ...notes[noteIndex], ...noteData };
        }
    } else {
        // Create new note
        const note = {
            id: Date.now(),
            ...noteData
        };
        notes.push(note);
    }
    
    localStorage.setItem(`notes_${user.id}`, JSON.stringify(notes));
    
    closeNoteModal();
    loadNotes();
}

function filterNotes() {
    const user = JSON.parse(localStorage.getItem('notesUser'));
    let notes = JSON.parse(localStorage.getItem(`notes_${user.id}`) || '[]');
    
    // Get filter values
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const activeCategory = document.querySelector('.filter-btn.active').dataset.category;
    const sortBy = document.getElementById('sort-select').value;
    
    // Filter by search term
    if (searchTerm) {
        notes = notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm) ||
            note.content.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by category
    if (activeCategory !== 'all') {
        notes = notes.filter(note => note.category === activeCategory);
    }
    
    // Sort notes
    notes.sort((a, b) => {
        switch(sortBy) {
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'title-asc':
                return a.title.localeCompare(b.title);
            case 'title-desc':
                return b.title.localeCompare(a.title);
            case 'category':
                return a.category.localeCompare(b.category);
            default:
                return new Date(b.date) - new Date(a.date);
        }
    });
    
    // Update section title
    const sectionTitle = activeCategory === 'all' ? 'All Notes' : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
    document.getElementById('section-title').textContent = sectionTitle;
    
    // Display filtered notes
    displayNotes(notes);
}

function displayNotes(notes) {
    const container = document.getElementById('notes-container');
    
    if (notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No notes found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notes.map(note => `
        <div class="note-card" data-id="${note.id}" onclick="openNote(${note.id})">
            <div class="note-header">
                <h3>${note.title}</h3>
                <span class="category-badge ${note.category}">${note.category}</span>
            </div>
            <div class="note-content">${stripHtml(note.content).substring(0, 100)}...</div>
            <div class="note-footer">
                <span class="note-date">${new Date(note.date).toLocaleDateString()}</span>
                ${note.tags ? `<div class="note-tags-preview">${note.tags.slice(0, 2).map(tag => `<span class="tag-mini">${tag}</span>`).join('')}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function setupRichTextEditor() {
    const formatBtns = document.querySelectorAll('.format-btn');
    const editor = document.getElementById('note-content');
    
    formatBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const command = this.dataset.command;
            
            if (command === 'createLink') {
                const url = prompt('Enter URL:');
                if (url) {
                    document.execCommand(command, false, url);
                }
            } else {
                document.execCommand(command, false, null);
            }
            
            editor.focus();
            updateToolbarState();
        });
    });
    
    // Update toolbar state on selection change
    editor.addEventListener('mouseup', updateToolbarState);
    editor.addEventListener('keyup', updateToolbarState);
    
    function updateToolbarState() {
        formatBtns.forEach(btn => {
            const command = btn.dataset.command;
            if (document.queryCommandState(command)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

function setupTagsInput() {
    const tagInput = document.getElementById('tag-input');
    const tagsContainer = document.getElementById('tags-container');
    let tags = [];
    
    tagInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = this.value.trim();
            if (tag && !tags.includes(tag)) {
                tags.push(tag);
                renderTags();
                this.value = '';
            }
        }
    });
    
    function renderTags() {
        tagsContainer.innerHTML = tags.map(tag => `
            <span class="tag">
                ${tag}
                <span class="remove-tag" onclick="removeTag('${tag}')">&times;</span>
            </span>
        `).join('');
    }
    
    window.removeTag = function(tagToRemove) {
        tags = tags.filter(tag => tag !== tagToRemove);
        renderTags();
    };
    
    window.getTags = () => tags;
    window.setTags = (newTags) => {
        tags = newTags || [];
        renderTags();
    };
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function openNote(noteId) {
    const user = JSON.parse(localStorage.getItem('notesUser'));
    const notes = JSON.parse(localStorage.getItem(`notes_${user.id}`) || '[]');
    const note = notes.find(n => n.id === noteId);
    
    if (note) {
        document.getElementById('modal-title').textContent = 'Edit Note';
        document.getElementById('note-title').value = note.title;
        document.getElementById('note-category').value = note.category;
        document.getElementById('note-content').innerHTML = note.content;
        window.setTags(note.tags || []);
        
        // Store current note ID for editing
        document.getElementById('note-form').dataset.editId = noteId;
        
        openNoteModal();
    }
}