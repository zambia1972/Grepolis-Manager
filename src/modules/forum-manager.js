/**
 * Forum Manager - Handles forum-related functionality
 */

export default class ForumManager {
    constructor(mainManager) {
        this.main = mainManager;
        this.initialized = false;
        this.forumData = {
            threads: {},
            bookmarks: [],
            lastUpdated: null,
            lastRead: {}
        };
        this.updateInterval = 5 * 60 * 1000; // 5 minutes
    }

    async init() {
        if (this.initialized) return true;
        
        try {
            this.logger.log('Initializing Forum Manager...');
            
            // Load cached data
            await this.loadCachedData();
            
            // Initialize UI if enabled
            if (this.main.getSetting('modules.forumManager', true)) {
                this.initUI();
                
                // Schedule periodic updates if on forum page
                if (this.isForumPage()) {
                    this.scheduleUpdates();
                    this.injectForumEnhancements();
                }
            }
            
            this.initialized = true;
            this.logger.log('Forum Manager initialized');
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize Forum Manager:', error);
            return false;
        }
    }

    async loadCachedData() {
        try {
            const cachedData = this.main.getStorage('gm_forum_data', null);
            if (cachedData) {
                this.forumData = { ...this.forumData, ...cachedData };
                this.logger.log('Loaded forum data from cache');
            }
            return true;
        } catch (error) {
            this.logger.error('Failed to load cached forum data:', error);
            return false;
        }
    }

    saveData() {
        try {
            this.main.setStorage('gm_forum_data', this.forumData);
            return true;
        } catch (error) {
            this.logger.error('Failed to save forum data:', error);
            return false;
        }
    }

    isForumPage() {
        return window.location.href.includes('/forum/');
    }

    scheduleUpdates() {
        // Update forum data periodically
        this.updateIntervalId = setInterval(() => {
            this.updateForumData();
        }, this.updateInterval);
        
        // Also update now
        this.updateForumData();
    }

    async updateForumData() {
        if (!this.isForumPage()) return;
        
        try {
            this.logger.log('Updating forum data...');
            
            // Get current forum data
            const forumData = await this.scrapeForumData();
            
            // Update stored data
            this.forumData = {
                ...this.forumData,
                ...forumData,
                lastUpdated: new Date().toISOString()
            };
            
            // Save to storage
            this.saveData();
            
            // Update UI
            this.updateForumUI();
            
            this.logger.log('Forum data updated');
            return true;
        } catch (error) {
            this.logger.error('Failed to update forum data:', error);
            return false;
        }
    }

    async scrapeForumData() {
        // This would contain the logic to scrape forum data from the page
        // For now, return a mock implementation
        return {
            threads: {},
            lastRead: {}
        };
    }

    initUI() {
        // Add forum manager button to the main toolbar
        this.createToolbarButton();
        
        // Initialize forum enhancements if on a forum page
        if (this.isForumPage()) {
            this.injectForumEnhancements();
        }
    }

    createToolbarButton() {
        // Create button
        this.toolbarButton = this.main.ui.createButton('Forum', {
            className: 'gm-forum-button',
            icon: 'forum',
            tooltip: 'Open Forum Manager',
            onClick: () => this.toggleForumPanel()
        });
        
        // Add notification badge
        const badge = document.createElement('span');
        badge.className = 'gm-badge';
        badge.style.display = 'none';
        this.toolbarButton.appendChild(badge);
        this.notificationBadge = badge;
        
        // Add button to the main UI container
        const container = document.querySelector('#gm-toolbar') || document.body;
        container.appendChild(this.toolbarButton);
    }

    injectForumEnhancements() {
        if (this.enhancementsInjected) return;
        
        try {
            // Add custom styles for forum enhancements
            this.injectForumStyles();
            
            // Add thread filters
            this.addThreadFilters();
            
            // Add quick reply
            this.addQuickReply();
            
            // Add mark as read functionality
            this.addMarkAsRead();
            
            // Add thread preview on hover
            this.addThreadPreviews();
            
            this.enhancementsInjected = true;
            this.logger.log('Forum enhancements injected');
        } catch (error) {
            this.logger.error('Failed to inject forum enhancements:', error);
        }
    }

    injectForumStyles() {
        const styleId = 'gm-forum-styles';
        
        // Don't inject if already exists
        if (document.getElementById(styleId)) return;
        
        const css = `
            /* Forum enhancements */
            .gm-forum-enhanced .thread {
                position: relative;
                padding: 10px;
                margin-bottom: 5px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                background-color: #fff;
                transition: background-color 0.2s;
            }
            
            .gm-forum-enhanced .thread:hover {
                background-color: #f5f5f5;
            }
            
            .gm-forum-enhanced .thread.unread {
                border-left: 3px solid #4CAF50;
                padding-left: 8px;
            }
            
            .gm-forum-enhanced .thread.bookmarked {
                background-color: #fff8e1;
            }
            
            .gm-forum-enhanced .thread-actions {
                display: none;
                position: absolute;
                right: 10px;
                top: 10px;
            }
            
            .gm-forum-enhanced .thread:hover .thread-actions {
                display: flex;
                gap: 5px;
            }
            
            .gm-forum-enhanced .thread-actions button {
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid #ddd;
                border-radius: 3px;
                padding: 2px 6px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .gm-forum-enhanced .thread-actions button:hover {
                background: #f0f0f0;
            }
            
            .gm-forum-filters {
                margin-bottom: 15px;
                padding: 10px;
                background: #f5f5f5;
                border-radius: 4px;
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .gm-quick-reply {
                margin-top: 15px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .gm-quick-reply-toolbar {
                background: #f5f5f5;
                padding: 5px 10px;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .gm-quick-reply-editor {
                min-height: 100px;
                padding: 10px;
            }
            
            .gm-quick-reply-actions {
                text-align: right;
                padding: 5px 10px;
                background: #f9f9f9;
                border-top: 1px solid #e0e0e0;
            }
        `;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    addThreadFilters() {
        const forumContainer = document.querySelector('.forum-container') || document.querySelector('.forum');
        if (!forumContainer) return;
        
        // Add enhanced class to forum container
        forumContainer.classList.add('gm-forum-enhanced');
        
        // Create filters container
        const filtersHtml = `
            <div class="gm-forum-filters">
                <div class="gm-form-group">
                    <label>
                        <input type="checkbox" id="gm-filter-unread" checked> Unread only
                    </label>
                </div>
                <div class="gm-form-group">
                    <label>
                        <input type="checkbox" id="gm-filter-bookmarked"> Bookmarked
                    </label>
                </div>
                <div class="gm-form-group">
                    <input type="text" id="gm-search-threads" placeholder="Search threads..." class="gm-form-control">
                </div>
                <button id="gm-apply-filters" class="gm-button gm-small">Apply</button>
                <button id="gm-reset-filters" class="gm-button gm-small">Reset</button>
            </div>
        `;
        
        // Insert filters at the top of the forum
        forumContainer.insertAdjacentHTML('afterbegin', filtersHtml);
        
        // Add event listeners
        const unreadFilter = document.getElementById('gm-filter-unread');
        const bookmarkedFilter = document.getElementById('gm-filter-bookmarked');
        const searchInput = document.getElementById('gm-search-threads');
        const applyButton = document.getElementById('gm-apply-filters');
        const resetButton = document.getElementById('gm-reset-filters');
        
        const applyFilters = () => {
            const showUnread = unreadFilter.checked;
            const showBookmarked = bookmarkedFilter.checked;
            const searchTerm = searchInput.value.toLowerCase();
            
            document.querySelectorAll('.thread').forEach(thread => {
                const isUnread = thread.classList.contains('unread');
                const isBookmarked = thread.classList.contains('bookmarked');
                const title = thread.querySelector('.thread-title')?.textContent?.toLowerCase() || '';
                const matchesSearch = searchTerm === '' || title.includes(searchTerm);
                
                const shouldShow = 
                    (!showUnread || isUnread) &&
                    (!showBookmarked || isBookmarked) &&
                    matchesSearch;
                
                thread.style.display = shouldShow ? '' : 'none';
            });
        };
        
        applyButton.addEventListener('click', applyFilters);
        
        resetButton.addEventListener('click', () => {
            unreadFilter.checked = true;
            bookmarkedFilter.checked = false;
            searchInput.value = '';
            
            // Show all threads
            document.querySelectorAll('.thread').forEach(thread => {
                thread.style.display = '';
            });
        });
        
        // Apply filters when pressing Enter in search
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }

    addQuickReply() {
        const replyForms = document.querySelectorAll('.reply-form');
        
        replyForms.forEach(form => {
            // Check if already enhanced
            if (form.classList.contains('gm-enhanced')) return;
            
            // Add quick reply toolbar
            const toolbar = document.createElement('div');
            toolbar.className = 'gm-quick-reply-toolbar';
            toolbar.innerHTML = `
                <button type="button" class="gm-button gm-small" data-command="bold"><b>B</b></button>
                <button type="button" class="gm-button gm-small" data-command="italic"><i>I</i></button>
                <button type="button" class="gm-button gm-small" data-command="underline"><u>U</u></button>
                <button type="button" class="gm-button gm-small" data-command="insertLink">Link</button>
                <button type="button" class="gm-button gm-small" data-command="insertImage">Image</button>
            `;
            
            // Get the textarea
            const textarea = form.querySelector('textarea');
            if (!textarea) return;
            
            // Wrap textarea in a container
            const container = document.createElement('div');
            container.className = 'gm-quick-reply';
            textarea.parentNode.insertBefore(container, textarea);
            container.appendChild(textarea);
            
            // Insert toolbar before textarea
            container.insertBefore(toolbar, textarea);
            
            // Add event listeners to format buttons
            toolbar.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', () => {
                    const command = button.dataset.command;
                    this.handleFormatCommand(textarea, command);
                });
            });
            
            // Mark as enhanced
            form.classList.add('gm-enhanced');
        });
    }

    handleFormatCommand(textarea, command) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        let newText = '';
        let newCursorPos = start;
        
        switch (command) {
            case 'bold':
                newText = `[b]${selectedText}[/b]`;
                break;
            case 'italic':
                newText = `[i]${selectedText}[/i]`;
                break;
            case 'underline':
                newText = `[u]${selectedText}[/u]`;
                break;
            case 'insertLink':
                const url = prompt('Enter URL:', 'https://');
                if (url) {
                    const text = selectedText || 'link';
                    newText = `[url=${url}]${text}[/url]`;
                } else {
                    return; // User cancelled
                }
                break;
            case 'insertImage':
                const imageUrl = prompt('Enter image URL:', 'https://');
                if (imageUrl) {
                    newText = `[img]${imageUrl}[/img]`;
                } else {
                    return; // User cancelled
                }
                break;
        }
        
        // Update textarea value
        textarea.value = 
            textarea.value.substring(0, start) + 
            newText + 
            textarea.value.substring(end);
        
        // Set cursor position after the inserted text
        newCursorPos = start + newText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
    }

    addMarkAsRead() {
        // Add mark as read buttons to threads
        const threads = document.querySelectorAll('.thread');
        
        threads.forEach(thread => {
            // Skip if already enhanced
            if (thread.querySelector('.gm-mark-read')) return;
            
            const threadId = this.getThreadId(thread);
            if (!threadId) return;
            
            // Check if thread is unread
            const isUnread = this.isThreadUnread(threadId);
            if (isUnread) {
                thread.classList.add('unread');
            }
            
            // Check if thread is bookmarked
            if (this.forumData.bookmarks.includes(threadId)) {
                thread.classList.add('bookmarked');
            }
            
            // Create actions container
            let actions = thread.querySelector('.thread-actions');
            if (!actions) {
                actions = document.createElement('div');
                actions.className = 'thread-actions';
                thread.appendChild(actions);
            }
            
            // Add mark as read button
            const markReadBtn = document.createElement('button');
            markReadBtn.className = 'gm-mark-read';
            markReadBtn.title = isUnread ? 'Mark as read' : 'Mark as unread';
            markReadBtn.textContent = isUnread ? '✓' : '↻';
            markReadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleThreadRead(threadId, thread);
            });
            
            // Add bookmark button
            const bookmarkBtn = document.createElement('button');
            bookmarkBtn.className = 'gm-bookmark';
            bookmarkBtn.title = 'Bookmark thread';
            bookmarkBtn.textContent = '★';
            bookmarkBtn.style.color = this.forumData.bookmarks.includes(threadId) ? '#ffc107' : '';
            bookmarkBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleBookmark(threadId, thread, bookmarkBtn);
            });
            
            actions.appendChild(markReadBtn);
            actions.appendChild(bookmarkBtn);
        });
    }

    addThreadPreviews() {
        // Add hover preview for thread links
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a.thread-title');
            if (!link) return;
            
            const threadId = this.getThreadId(link.closest('.thread'));
            if (!threadId) return;
            
            // Show preview after a short delay
            this.previewTimer = setTimeout(() => {
                this.showThreadPreview(link, threadId);
            }, 500);
        }, true);
        
        // Clear preview timer when mouse leaves
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('a.thread-title')) {
                clearTimeout(this.previewTimer);
                this.hideThreadPreview();
            }
        }, true);
    }

    showThreadPreview(link, threadId) {
        // Check if preview already exists
        if (this.previewElement) {
            this.hideThreadPreview();
        }
        
        // Create preview element
        const preview = document.createElement('div');
        preview.className = 'gm-thread-preview';
        
        // Position near the link
        const rect = link.getBoundingClientRect();
        preview.style.position = 'fixed';
        preview.style.left = `${rect.right + 10}px`;
        preview.style.top = `${rect.top}px`;
        preview.style.zIndex = '9999';
        
        // Add loading message
        preview.innerHTML = '<div class="gm-loading">Loading preview...</div>';
        
        // Add to document
        document.body.appendChild(preview);
        this.previewElement = preview;
        
        // Load preview content (simulated)
        setTimeout(() => {
            if (this.previewElement === preview) {
                preview.innerHTML = `
                    <div class="gm-preview-header">
                        <h4>Thread Preview</h4>
                        <button class="gm-close-preview">&times;</button>
                    </div>
                    <div class="gm-preview-content">
                        <p>This is a preview of the thread content. In a real implementation, this would load the first few posts.</p>
                    </div>
                `;
                
                // Add close button handler
                const closeBtn = preview.querySelector('.gm-close-preview');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        this.hideThreadPreview();
                    });
                }
            }
        }, 500);
    }

    hideThreadPreview() {
        if (this.previewElement) {
            this.previewElement.remove();
            this.previewElement = null;
        }
    }

    getThreadId(threadElement) {
        // Extract thread ID from the element
        if (!threadElement) return null;
        
        // Try to get ID from data attribute or class
        const idFromData = threadElement.dataset.threadId || 
                          threadElement.id?.replace('thread-', '');
        
        if (idFromData) return idFromData;
        
        // Try to extract from link
        const link = threadElement.querySelector('a[href*="thread_id="]');
        if (link) {
            const match = link.href.match(/thread_id=(\d+)/);
            if (match) return match[1];
        }
        
        return null;
    }

    isThreadUnread(threadId) {
        if (!threadId) return false;
        
        // Check if thread has been marked as read
        return !this.forumData.lastRead[threadId];
    }

    toggleThreadRead(threadId, threadElement) {
        if (!threadId) return;
        
        const isUnread = this.isThreadUnread(threadId);
        
        if (isUnread) {
            // Mark as read
            this.forumData.lastRead[threadId] = new Date().toISOString();
            threadElement?.classList.remove('unread');
            
            // Update button
            const btn = threadElement?.querySelector('.gm-mark-read');
            if (btn) {
                btn.textContent = '↻';
                btn.title = 'Mark as unread';
            }
        } else {
            // Mark as unread
            delete this.forumData.lastRead[threadId];
            threadElement?.classList.add('unread');
            
            // Update button
            const btn = threadElement?.querySelector('.gm-mark-read');
            if (btn) {
                btn.textContent = '✓';
                btn.title = 'Mark as read';
            }
        }
        
        // Save changes
        this.saveData();
    }

    toggleBookmark(threadId, threadElement, buttonElement) {
        if (!threadId) return;
        
        const index = this.forumData.bookmarks.indexOf(threadId);
        const isBookmarked = index !== -1;
        
        if (isBookmarked) {
            // Remove bookmark
            this.forumData.bookmarks.splice(index, 1);
            threadElement?.classList.remove('bookmarked');
            buttonElement?.style?.setProperty('color', '');
        } else {
            // Add bookmark
            this.forumData.bookmarks.push(threadId);
            threadElement?.classList.add('bookmarked');
            buttonElement?.style?.setProperty('color', '#ffc107');
        }
        
        // Save changes
        this.saveData();
    }

    toggleForumPanel() {
        // Toggle the forum panel visibility
        // This would show a panel with bookmarked threads, unread counts, etc.
        this.main.ui.showNotification('Forum Manager panel would open here', 'info');
    }

    updateForumUI() {
        // Update the UI based on the latest forum data
        if (this.isForumPage()) {
            this.addMarkAsRead();
            this.updateUnreadCount();
        }
    }

    updateUnreadCount() {
        if (!this.notificationBadge) return;
        
        // Count unread threads
        const unreadCount = Object.keys(this.forumData.threads).filter(
            threadId => this.isThreadUnread(threadId)
        ).length;
        
        // Update badge
        if (unreadCount > 0) {
            this.notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            this.notificationBadge.style.display = '';
        } else {
            this.notificationBadge.style.display = 'none';
        }
    }

    // Add logger methods
    get logger() {
        return {
            log: (...args) => console.log(`[ForumManager]`, ...args),
            warn: (...args) => console.warn(`[ForumManager]`, ...args),
            error: (...args) => console.error(`[ForumManager]`, ...args),
            debug: (...args) => this.main?.debug && console.debug(`[ForumManager]`, ...args)
        };
    }

    // Cleanup
    destroy() {
        // Clear intervals
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
        }
        
        // Remove UI elements
        if (this.toolbarButton && this.toolbarButton.parentNode) {
            this.toolbarButton.parentNode.removeChild(this.toolbarButton);
        }
        
        // Remove any injected styles
        const style = document.getElementById('gm-forum-styles');
        if (style && style.parentNode) {
            style.parentNode.removeChild(style);
        }
        
        // Remove any injected elements with class starting with 'gm-'
        document.querySelectorAll('[class^="gm-"], [class*=" gm-"]').forEach(el => {
            if (el.id !== 'gm-toolbar' && !el.closest('#gm-toolbar')) {
                el.remove();
            }
        });
        
        this.initialized = false;
    }
}

// Add initialization method
ForumManager.init = async function(mainManager) {
    const instance = new this(mainManager);
    await instance.init();
    return instance;
};
