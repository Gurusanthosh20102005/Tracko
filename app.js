/**
 * Tracko - Main Application Logic
 */

const App = {
    state: {
        user: null,
        currentRoute: '/',
        routes: {},
        busData: [],     // Mock data for buses
        livePassengers: 0,
        tickets: [],     // Ticket History
        selectedBus: null // Context for Bus Tracking
    },

    init() {
        this.router();
        window.addEventListener('hashchange', () => this.router());
        this.loadStaticData(); // Load notifications, language, etc.
        this.fetchBusData(); // Fetch buses from API

        // Load tickets from localStorage
        const savedTickets = localStorage.getItem('tickets');
        if (savedTickets) {
            this.state.tickets = JSON.parse(savedTickets);
        }

        // Polling for Live Data
        setInterval(() => {
            this.fetchLiveData();
            this.fetchBusData(); // Refresh bus list
        }, 5000); // Every 5 seconds
    },

    fetchLiveData() {
        fetch('http://localhost:3000/api/crowd/status?id=12A')
            .then(res => res.json())
            .then(data => {
                if (data && data.passengers !== undefined) {
                    this.state.livePassengers = data.passengers;
                    this.updateLiveUI();
                }
            })
            .catch(err => console.log('Backend not connected (using mock):', err));
    },

    viewBus(id) {
        // Find bus data
        const bus = this.state.busData.find(b => b.id === id);
        this.state.selectedBus = bus || { id: id, route: 'Unknown Route', status: 'Unknown', crowd: 0 };
        window.location.hash = '#/bus-tracking';
    },

    updateLiveUI() {
        // Update Tracking Screen Count
        const trackCount = document.getElementById('live-count-display');
        if (trackCount) trackCount.innerText = this.state.livePassengers;

        // Update Conductor Screen Count
        const condCount = document.getElementById('conductor-live-count');
        if (condCount) condCount.innerText = this.state.livePassengers;

        // Update Crowd Indicator
        const crowdLabel = document.getElementById('crowd-label-text');
        const crowdBar = document.getElementById('crowd-bar-fill');

        if (crowdLabel && crowdBar) {
            const status = this.getCrowdStatus(this.state.livePassengers);
            crowdLabel.innerText = `${status.label} (${status.percent}%)`;
            crowdLabel.style.color = status.color;
            crowdBar.style.width = `${status.percent}%`;
            crowdBar.style.background = status.color;
        }
    },

    getCrowdStatus(count) {
        const capacity = 50; // Mock capacity
        let percent = Math.min(100, Math.round((count / capacity) * 100));

        let label = 'Empty';
        let color = 'var(--success)';

        if (percent > 10) label = 'Low';
        if (percent > 40) { label = 'Moderate'; color = 'var(--warning)'; }
        if (percent > 80) { label = 'Crowded'; color = 'var(--danger)'; }
        if (percent >= 100) { label = 'Full'; color = 'var(--danger)'; }

        return { percent, label, color };
    },

    async fetchBusData() {
        try {
            const response = await fetch('http://localhost:3000/api/buses');
            const buses = await response.json();
            this.state.busData = buses;

            // Update UI if on home screen
            if (window.location.hash === '#/home') {
                this.updateBusList();
            }
        } catch (error) {
            console.error('Failed to fetch bus data:', error);
            // Keep existing data if fetch fails
        }
    },

    generateTimelineHTML(busId) {
        const stops = this.state.routesData[busId] || this.state.routesData['12A']; // Fallback to 12A
        const currentStopIndex = 2; // Simulate current progress at 3rd stop

        return stops.map((stop, index) => {
            const isPassed = index < currentStopIndex;
            const isActive = index === currentStopIndex;
            const status = isPassed ? 'passed' : isActive ? 'active' : '';

            const timeText = isPassed
                ? `Departed ${stop.time} min ago`
                : isActive
                    ? `Arriving in ${Math.max(0, stop.time - 18)} min`
                    : `ETA ${stop.time} min`;

            const sourceIcon = stop.isSource ? ' 🚏' : '';
            const destIcon = stop.isDestination ? ' 🎯' : '';

            return `
                <div class="timeline-item ${status}">
                    <strong ${isActive ? 'style="color: var(--primary-blue);"' : ''}>
                        ${stop.name}${isActive ? ' (Next)' : ''}${sourceIcon}${destIcon}
                    </strong>
                    <p class="caption">${timeText} • ${stop.distance.toFixed(1)} km</p>
                </div>
            `;
        }).join('');
    },

    loadStaticData() {
        // Keep static route data for fallback (will be replaced by API)
        this.state.routesData = {
            '12A': [
                { name: 'Central Station', distance: 0, time: 0, isSource: true },
                { name: 'Broadway', distance: 3.2, time: 8 },
                { name: 'Anna Nagar', distance: 7.5, time: 18 },
                { name: 'Koyambedu', distance: 12.0, time: 28 },
                { name: 'Guindy', distance: 15.5, time: 38 },
                { name: 'Tech Park', distance: 18.5, time: 45, isDestination: true }
            ]
        };

        // Mock Notifications
        this.state.notifications = [
            { id: 1, title: 'Bus Delayed', msg: 'Route 45C is delayed by 10 mins due to traffic.', type: 'warning', time: '2 min ago' },
            { id: 2, title: 'Arrival Alert', msg: '12A is arriving at your stop.', type: 'info', time: '10 min ago' },
            { id: 3, title: 'Wallet Updated', msg: '₹100 added to your wallet successfully.', type: 'success', time: '1 hr ago' }
        ];

        // Mock Chat
        this.state.chatMessages = [
            { id: 1, user: 'Commuter 1', text: 'Heavy traffic near T.Nagar flyover.', type: 'received' },
            { id: 2, user: 'Commuter 2', text: 'Is 12A AC bus operational?', type: 'received' },
            { id: 3, user: 'Admin', text: 'Yes, running on schedule.', type: 'received' }
        ];

        // Language Dictionary
        this.i18n = {
            'en': {
                'greeting': 'Good Morning,',
                'search_ph': 'Where to?',
                'nearby': 'Nearby Buses',
                'safety': 'Safety',
                'ticket': 'Ticket',
                'wallet': 'My Wallet',
                'settings': 'Settings'
            },
            'ta': { // Tamil Mock
                'greeting': 'காலை வணக்கம்,',
                'search_ph': 'எங்கே செல்ல வேண்டும்?',
                'nearby': 'அருகிலுள்ள பேருந்துகள்',
                'safety': 'பாதுகாப்பு',
                'ticket': 'டிக்கெட்',
                'wallet': 'என் பணப்பை',
                'settings': 'அமைப்புகள்'
            },
            'hi': { // Hindi Mock
                'greeting': 'க் सुप्रभात,', // Simplified for demo
                'search_ph': 'कहाँ जाना है?',
                'nearby': 'पास की बसें',
                'safety': 'सुरक्षा',
                'ticket': 'टिकट',
                'wallet': 'मेरा बटुआ',
                'settings': 'सेटिंग्स'
            }
        };
        this.state.lang = localStorage.getItem('lang') || 'en';
    },

    // --- I18N Helper ---
    t(key) {
        return this.i18n[this.state.lang][key] || key;
    },

    setLang(lang) {
        this.state.lang = lang;
        localStorage.setItem('lang', lang);
        this.renderSettings(); // Re-render to show selection
        // In a real app we might reload or re-bind everything. 
        // For prototype, we just rely on next navigation or reload.
        this.showToast('Language updated. Some texts will update on reload.');
    },

    // Generic Toast Notification
    showToast(message) {
        let toast = document.getElementById('app-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'app-toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.innerText = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    // Simple Hash Router
    router() {
        const hash = window.location.hash || '#/';
        const appDiv = document.getElementById('app');

        // Remove dashboard class if navigating away
        if (!hash.includes('dashboard')) {
            appDiv.classList.remove('dashboard-mode');
        }

        // Routing Logic
        switch (hash) {
            case '#/':
                this.renderSplashScreen();
                // Simulate splash delay
                setTimeout(() => window.location.hash = '#/onboarding', 2500);
                break;
            case '#/onboarding':
                this.renderOnboarding();
                break;
            case '#/login':
                this.renderLogin();
                break;
            case '#/home':
                this.renderHome();
                break;
            case '#/bus-tracking':
                this.renderBusTracking();
                break;
            case '#/admin-dashboard':
                appDiv.classList.add('dashboard-mode');
                this.renderDashboard();
                break;
            case '#/safety':
                this.renderSafety();
                break;
            case '#/social':
                this.renderSocial();
                break;
            case '#/settings':
                this.renderSettings();
                break;
            case '#/conductor':
                this.renderConductor();
                break;
            case '#/conductor':
                this.renderConductor();
                break;
            case '#/wallet':
                this.renderWallet();
                break;
            case '#/ticket-history':
                this.renderTicketHistory();
                break;
            default:
                this.renderHome(); // Fallback
        }
    },

    toggleTheme() {
        const body = document.body;
        const isDark = body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
        // Re-render settings to show correct toggle state if we are there
        if (window.location.hash === '#/settings') this.renderSettings();
    },

    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        }
    },

    openAIAssistant() {
        const overlay = document.getElementById('voice-overlay');
        overlay.classList.add('active');

        // AI Chat UI
        overlay.innerHTML = `
            <div style="width: 100%; max-width: 400px; height: 500px; background: white; border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <!-- Header -->
                <div style="background: var(--primary-blue); padding: 16px; color: white; display: flex; justify-content: space-between; align-items: center;">
                    <div class="flex-row gap-md">
                        <div style="width: 32px; height: 32px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary-blue);">
                            <i class="fa-solid fa-robot"></i>
                        </div>
                        <strong>Tracko AI</strong>
                    </div>
                    <button onclick="document.getElementById('voice-overlay').classList.remove('active')" style="background:none; border:none; color:white; font-size:18px; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <!-- Chat Area -->
                <div id="ai-chat-box" style="flex: 1; padding: 16px; overflow-y: auto; background: var(--bg-light); color: var(--text-primary);">
                    <div style="display: flex; margin-bottom: 12px;">
                        <div style="background: white; padding: 12px 16px; border-radius: 4px 16px 16px 16px; max-width: 80%; box-shadow: 0 1px 2px rgba(0,0,0,0.1); font-size: 14px;">
                            Hello! I'm your AI assistant. Ask me about bus timings, crowd levels, or ticket availability.
                        </div>
                    </div>
                </div>

                <!-- Input -->
                <div style="padding: 16px; background: white; border-top: 1px solid #eee;">
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button id="mic-btn" class="mic-btn" onclick="App.toggleVoiceRecognition()">
                            <i class="fa-solid fa-microphone"></i>
                        </button>
                        <input id="ai-input" type="text" placeholder="Ask anything..." style="flex: 1; padding: 10px 16px; border: 1px solid #ddd; border-radius: 24px; outline: none;">
                        <button onclick="App.sendAIMessage()" style="width: 40px; height: 40px; background: var(--primary-blue); color: white; border: none; border-radius: 50%; cursor: pointer;"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
        `;

        // Focus Input
        setTimeout(() => document.getElementById('ai-input').focus(), 100);

        // Bind Enter Key
        document.getElementById('ai-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') App.sendAIMessage();
        });
    },

    toggleVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        const micBtn = document.getElementById('mic-btn');

        if (this.recognition && this.isListening) {
            console.log('Voice: Stopping manually...');
            this.recognition.stop();
            return;
        }

        console.log('Voice: Initializing recognition...');
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            console.log('Voice: Recording started');
            this.isListening = true;
            micBtn.classList.add('listening');

            // Visual Feedback
            const input = document.getElementById('ai-input');
            if (input) {
                input.placeholder = "Listening...";
                input.parentElement.style.borderColor = "var(--primary-blue)";
                input.parentElement.style.boxShadow = "0 0 0 4px rgba(33, 150, 243, 0.1)";
            }
        };

        recognition.onspeechend = () => {
            console.log('Voice: Speech ended, processing...');
            recognition.stop();
        };

        recognition.onresult = (event) => {
            console.log('Voice: Result received', event);
            const transcript = event.results[0][0].transcript;
            console.log('Voice: Transcript:', transcript);

            const input = document.getElementById('ai-input');
            if (input) {
                input.value = transcript;
                input.focus();
            }

            // Auto-send after a brief pause
            setTimeout(() => {
                this.sendAIMessage();
            }, 1000);
        };

        recognition.onerror = (event) => {
            console.error('Voice: Error occurred', event.error);
            this.isListening = false;
            micBtn.classList.remove('listening');

            // Reset Visuals
            const input = document.getElementById('ai-input');
            if (input) {
                input.placeholder = "Ask anything...";
                input.parentElement.style.borderColor = "#ddd";
                input.parentElement.style.boxShadow = "none";
            }

            if (event.error === 'no-speech') {
                this.showToast('No speech detected. Please try again.');
            } else if (event.error === 'not-allowed') {
                this.showToast('Microphone access blocked. Please check permissions.');
            } else {
                this.showToast('Voice error: ' + event.error);
            }
        };

        recognition.onend = () => {
            console.log('Voice: Recording ended');
            this.isListening = false;
            micBtn.classList.remove('listening');

            // Reset Visuals
            const input = document.getElementById('ai-input');
            if (input) {
                input.placeholder = "Ask anything...";
                input.parentElement.style.borderColor = "#ddd";
                input.parentElement.style.boxShadow = "none";
            }
        };

        this.recognition = recognition;
        try {
            recognition.start();
        } catch (e) {
            console.error('Voice: Failed to start', e);
        }
    },

    sendAIMessage() {
        const input = document.getElementById('ai-input');
        const message = input.value.trim();
        if (!message) return;

        // User Message UI
        const chatBox = document.getElementById('ai-chat-box');
        chatBox.innerHTML += `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
                <div style="background: var(--primary-blue); color: white; padding: 12px 16px; border-radius: 16px 4px 16px 16px; max-width: 80%; font-size: 14px;">
                    ${message}
                </div>
            </div>
        `;
        input.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;

        // Loading State
        const loadingId = 'loading-' + Date.now();
        chatBox.innerHTML += `
            <div id="${loadingId}" style="display: flex; margin-bottom: 12px;">
                <div style="background: white; padding: 12px 16px; border-radius: 4px 16px 16px 16px; max-width: 80%; box-shadow: 0 1px 2px rgba(0,0,0,0.1); font-size: 14px; color: #666;">
                    <i class="fa-solid fa-circle-notch fa-spin"></i> Thinking...
                </div>
            </div>
        `;
        chatBox.scrollTop = chatBox.scrollHeight;

        // API Call
        fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                context: this.state.busData // Send Bus Data Context
            })
        })
            .then(res => res.json())
            .then(data => {
                // Remove Loader
                const loader = document.getElementById(loadingId);
                if (loader) loader.remove();

                // AI Response UI
                chatBox.innerHTML += `
                <div style="display: flex; margin-bottom: 12px;">
                    <div style="background: white; padding: 12px 16px; border-radius: 4px 16px 16px 16px; max-width: 80%; box-shadow: 0 1px 2px rgba(0,0,0,0.1); font-size: 14px;">
                        ${data.reply || "Sorry, I couldn't reach the server."}
                    </div>
                </div>
            `;
                chatBox.scrollTop = chatBox.scrollHeight;
            })
            .catch(err => {
                console.error(err);
                const loader = document.getElementById(loadingId);
                if (loader) loader.remove();

                chatBox.innerHTML += `
                <div style="display: flex; margin-bottom: 12px;">
                    <div style="background: #ffebee; color: #c62828; padding: 12px 16px; border-radius: 4px 16px 16px 16px; max-width: 80%; font-size: 14px;">
                        Error connecting to AI. Please try again.
                    </div>
                </div>
            `;
            });
    },

    // --- RENDER FUNCTIONS ---
    // These will eventually be moved to separate files/modules if it gets too large

    renderSplashScreen() {
        document.getElementById('app').innerHTML = `
            <div class="view-animate" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: var(--primary-blue);">
                <div style="font-size: 64px; color: white; margin-bottom: 16px;">
                    <i class="fa-solid fa-location-dot fa-bounce"></i>
                </div>
                <h1 style="color: white; font-size: 32px;">Tracko</h1>
                <p style="color: rgba(255,255,255,0.8); font-size: 16px;">Smarter Mobility. Real-Time Reliability.</p>
            </div>
        `;
    },

    renderOnboarding() {
        document.getElementById('app').innerHTML = `
            <div class="view-animate" style="height: 100%; padding: 32px; display: flex; flex-direction: column; justify-content: space-between; text-align: center;">
                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                    <img src="tracko logo.jpg" style="width: 250px; border-radius: 20px; margin-bottom: 32px; box-shadow: var(--shadow-float);">
                    <h2 style="color: var(--primary-blue);">Real-Time Bus Tracking</h2>
                    <p>Track your bus on a live map and never wait at the stop for long hours again.</p>
                </div>
                <button class="btn btn-primary" onclick="window.location.hash='#/login'">Get Started</button>
            </div>
        `;
    },

    renderLogin() {
        document.getElementById('app').innerHTML = `
            <div class="view-animate" style="height: 100%; padding: 32px; display: flex; flex-direction: column; justify-content: center;">
                <h1 style="margin-bottom: 8px;">Welcome Back</h1>
                <p style="margin-bottom: 32px;">Login to continue smart travelling.</p>
                
                <div class="input-container">
                    <input type="email" class="input-field" placeholder="Email Address">
                </div>
                <div class="input-container">
                    <input type="password" class="input-field" placeholder="Password">
                </div>
                
                <button class="btn btn-primary" style="margin-bottom: 16px;" onclick="window.location.hash='#/home'">Login</button>
                <button class="btn btn-outline" onclick="window.location.hash='#/home'">Continue as Guest</button>
                
                <div style="margin-top: 32px; text-align: center;">
                    <p class="caption">New to Tracko? <strong style="color: var(--primary-blue cursor: pointer;">Sign Up</strong></p>
                </div>
            </div>
        `;
    },

    renderHome() {
        // We'll init the map after the DOM is updated
        document.getElementById('app').innerHTML = `
            <div style="height: 100%; position: relative; display: flex; flex-direction: column;">
                <!-- Map Layer -->
                <div id="map" style="flex: 1; width: 100%;"></div>

                <!-- Overlay UI -->
                <div style="position: absolute; top: 16px; left: 16px; right: 16px; z-index: 1000;">
                    <div class="card flex-row gap-sm" style="padding: 12px; border-radius: 50px; box-shadow: var(--shadow-float);">
                        <i class="fa-solid fa-bars" style="color: var(--text-secondary); margin-left: 8px;"></i>
                        <input id="home-search" type="text" placeholder="${this.t('search_ph')}" style="border:none; outline:none; flex:1; font-size:16px; background: transparent; color: inherit;">
                        <div class="icon-box blue" style="width:32px; height:32px; border-radius:50%; cursor:pointer;" onclick="window.location.hash='#/route-planner'"><i class="fa-solid fa-directions" style="font-size:14px;"></i></div>
                    </div>
                </div>
                 <!-- Nav Floating Buttons -->
                <div style="position: absolute; top: 80px; right: 16px; display:flex; flex-direction:column; gap:8px; z-index: 1000;">
                     <button onclick="window.location.hash='#/safety'" style="background: var(--bg-white); border:none; width:40px; height:40px; border-radius:50%; box-shadow: var(--shadow-sm); cursor: pointer; color: var(--danger);"><i class="fa-solid fa-shield-halved"></i></button>
                     <button onclick="window.location.hash='#/conductor'" style="background: var(--bg-white); border:none; width:40px; height:40px; border-radius:50%; box-shadow: var(--shadow-sm); cursor: pointer; color: var(--text-secondary);"><i class="fa-solid fa-ticket"></i></button>
                     <!-- AI moved to Bottom Nav -->
                     <button onclick="window.location.hash='#/notifications'" style="background: var(--bg-white); border:none; width:40px; height:40px; border-radius:50%; box-shadow: var(--shadow-sm); cursor: pointer; color: var(--text-secondary); position:relative;">
                        <i class="fa-solid fa-bell"></i>
                        <span style="position:absolute; top:0; right:0; width:10px; height:10px; background:red; border-radius:50%;"></span>
                    </button>
                </div>

                <!-- Voice Overlay (Empty container for AI) -->
                <div id="voice-overlay" class="voice-overlay"></div>

                <!-- Bottom Sheet -->
                <div style="background: var(--bg-white); padding: 20px 20px 80px; border-radius: 24px 24px 0 0; box-shadow: 0 -4px 20px rgba(0,0,0,0.1); z-index: 1000; transition: background 0.3s; max-height: 40vh; overflow-y: auto;">
                    <div style="width: 40px; height: 4px; background: #e0e0e0; border-radius: 2px; margin: 0 auto 16px;"></div>
                    <h3 style="margin-bottom: 16px;">${this.t('nearby')}</h3>
                    <div id="bus-list">
                        <!-- Populated via JS -->
                    </div>
                </div>

                <!-- Bottom Nav -->
                <div style="position:absolute; bottom:0; left:0; right:0; background:var(--bg-white); padding:12px 24px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #eee; z-index:1001;">
                    <i class="fa-solid fa-house" style="color:var(--primary-blue); font-size:20px;"></i>
                    <i class="fa-solid fa-wallet" style="color:var(--text-secondary); font-size:20px; cursor:pointer;" onclick="window.location.hash='#/wallet'"></i>
                    <i class="fa-solid fa-robot" style="color:var(--text-secondary); font-size:20px; cursor:pointer;" onclick="App.openAIAssistant()"></i>
                    <i class="fa-regular fa-comments" style="color:var(--text-secondary); font-size:20px; cursor:pointer;" onclick="window.location.hash='#/social'"></i>
                    <i class="fa-regular fa-user" style="color:var(--text-secondary); font-size:20px; cursor:pointer;" onclick="window.location.hash='#/settings'"></i>
                </div>
        `;

        // Render List Logic
        const renderList = (filter = '') => {
            const list = document.getElementById('bus-list');
            const filtered = this.state.busData.filter(b =>
                b.id.toLowerCase().includes(filter.toLowerCase()) ||
                b.route.toLowerCase().includes(filter.toLowerCase())
            );

            if (filtered.length === 0) {
                list.innerHTML = `<p class="text-center" style="padding:20px;">No buses found.</p>`;
                return;
            }

            list.innerHTML = filtered.map(bus => {
                let crowdText = `${bus.crowd}% Full`;
                let crowdColor = this.crowdColor(bus.crowd);



                return `
                <div class="card flex-row justify-between" onclick="App.viewBus('${bus.id}')" style="margin-bottom: 12px; cursor: pointer;">
                    <div class="flex-row gap-md">
                        <div class="icon-box blue"><i class="fa-solid fa-bus"></i></div>
                        <div>
                            <div style="font-weight: 700;">${bus.id} <span style="font-weight:400; font-size:12px; color:var(--text-secondary);">• ${bus.route}</span></div>
                            <div style="font-size: 12px; color: ${crowdColor};">
                                <i class="fa-solid fa-users"></i> ${crowdText}
                            </div>
                        </div>
                    </div>
                    <div class="text-center">
                        <div style="font-weight: 700; color: var(--primary-blue);">${bus.eta}</div>
                        <div class="caption">${bus.status}</div>
                    </div>
                </div>
            `}).join('');
        };

        // Initial Render
        renderList();

        // Search Listener
        document.getElementById('home-search').addEventListener('input', (e) => {
            renderList(e.target.value);
        });

        // Init Map
        setTimeout(() => this.initMap(), 100);
        setTimeout(() => this.loadRouteTimeline(), 500);
    },

    updateBusList() {
        const list = document.getElementById('bus-list');
        if (!list) return; // Not on home screen

        const searchInput = document.getElementById('home-search');
        const filter = searchInput ? searchInput.value : '';

        const filtered = this.state.busData.filter(b =>
            b.id.toLowerCase().includes(filter.toLowerCase()) ||
            b.route.toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            list.innerHTML = `<p class="text-center" style="padding:20px;">No buses found.</p>`;
            return;
        }

        list.innerHTML = filtered.map(bus => {
            let crowdText = `${bus.crowd}% Full`;
            let crowdColor = this.crowdColor(bus.crowd);



            return `
            <div class="card flex-row justify-between" onclick="App.viewBus('${bus.id}')" style="margin-bottom: 12px; cursor: pointer;">
                <div class="flex-row gap-md">
                    <div class="icon-box blue"><i class="fa-solid fa-bus"></i></div>
                    <div>
                        <div style="font-weight: 700;">${bus.id} <span style="font-weight:400; font-size:12px; color:var(--text-secondary);">• ${bus.route}</span></div>
                        <div style="font-size: 12px; color: ${crowdColor};">
                            <i class="fa-solid fa-users"></i> ${crowdText}
                        </div>
                    </div>
                </div>
                <div class="text-center">
                    <div style="font-weight: 700; color: var(--primary-blue);">${bus.eta}</div>
                    <div class="caption">${bus.status}</div>
                </div>
            </div>
        `}).join('');
    },

    async loadRouteTimeline() {
        const busId = this.state.selectedBus?.id || '12A';
        const timelineContainer = document.getElementById('route-timeline');

        if (!timelineContainer) return;

        try {
            const response = await fetch(`http://localhost:3000/api/routes/${busId}/stops`);
            const routeData = await response.json();

            if (routeData && routeData.stops) {
                this.renderTimeline(routeData.stops, timelineContainer);
            }
        } catch (error) {
            console.error('Failed to load route timeline:', error);
            timelineContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                    <i class="fa-solid fa-exclamation-triangle"></i> Could not load stops
                </div>
            `;
        }
    },

    renderTimeline(stops, container) {
        // Simulate current progress (3rd stop for demo)
        const currentStopIndex = 2;

        container.innerHTML = stops.map((stop, index) => {
            const isPassed = index < currentStopIndex;
            const isActive = index === currentStopIndex;
            const status = isPassed ? 'passed' : isActive ? 'active' : '';

            const timeText = isPassed
                ? `Departed ${stop.time} min ago`
                : isActive
                    ? `Arriving in ${Math.max(0, stop.time - 18)} min`
                    : `ETA ${stop.time} min`;

            return `
                <div class="timeline-item ${status}">
                    <strong ${isActive ? 'style="color: var(--primary-blue);"' : ''}>
                        ${stop.name}${isActive ? ' (Next)' : ''}
                        ${stop.isSource ? ' 🚏' : ''}${stop.isDestination ? ' 🎯' : ''}
                    </strong>
                    <p class="caption">${timeText} • ${stop.distance.toFixed(1)} km</p>
                </div>
            `;
        }).join('');
    },

    renderBusTracking() {
        this.state.passengerCount = 1;

        // Use selected bus or fallback to 12A mock
        const bus = this.state.selectedBus || { id: '12A', route: 'Central - Tech Park', status: 'On Time' };

        const crowdStatus = this.getCrowdStatus(this.state.livePassengers || 0);

        // Dynamic Elements
        const busId = bus.id;
        const busRoute = bus.route;

        return document.getElementById('app').innerHTML = `
            <div style="height: 100%; position: relative; display: flex; flex-direction: column;">
                 <div style="position: absolute; top: 16px; left: 16px; z-index: 1000;">
                    <button onclick="history.back()" style="background: white; border:none; padding: 12px; border-radius: 50%; box-shadow: var(--shadow-sm); cursor: pointer;">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                </div>
                
                <div id="map-track" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>

                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: var(--bg-white); padding: 24px; border-radius: 24px 24px 0 0; box-shadow: 0 -4px 20px rgba(0,0,0,0.1); z-index: 1000; max-height: 60vh; overflow-y: auto;">
                    <div class="flex-row justify-between" style="margin-bottom: 16px;">
                        <div>
                            <h2>${busId} <span style="font-size: 16px; color: var(--text-secondary); font-weight: 400;">(AC Metro)</span></h2>
                            <p>${busRoute}</p>
                        </div>
                        <div class="text-center">
                            <h2 style="color: var(--primary-blue);">5 min</h2>
                            <p class="caption">Arrival</p>
                        </div>
                    </div>

                    <!-- Driver & Speed -->
                    <div class="flex-row gap-md" style="margin-bottom: 16px; padding: 12px; background: rgba(30, 136, 229, 0.1); border-radius: 12px;">
                        <div class="flex-row gap-sm" style="flex:1;">
                             <img src="https://ui-avatars.com/api/?name=Raja&background=random" style="width:32px; height:32px; border-radius:50%;">
                             <div>
                                <strong style="font-size:12px;">Raja M.</strong>
                                <div class="caption">Driver (4.8 ★)</div>
                             </div>
                        </div>
                         <div class="text-center" style="border-left: 1px solid rgba(0,0,0,0.1); padding-left: 16px;">
                            <strong>42 km/h</strong>
                            <div class="caption">Speed</div>
                        </div>
                    </div>

                    <!-- Live Count -->
                    <div class="card flex-row justify-between items-center" style="margin-bottom: 24px; background: #E8F5E9; border: 1px solid var(--success);">
                        <div class="flex-row gap-md">
                            <div style="width:10px; height:10px; background:red; border-radius:50%; animation: pulse 2s infinite;"></div>
                            <div>
                                <strong style="color: var(--success);">Live Passenger Count</strong>
                                <p class="caption">Real-time from CCTV</p>
                            </div>
                        </div>
                        <h2 id="live-count-display" style="color: var(--success);">${this.state.livePassengers || 0}</h2>
                    </div>

                    <!-- Crowd Indicator -->
                    <div style="margin-bottom: 24px; cursor: pointer;" onclick="window.location.hash='#/crowd-level'">
                        <div class="flex-row justify-between" style="margin-bottom: 4px;">
                            <span class="caption">Crowd Level <i class="fa-solid fa-circle-info" style="color: var(--primary-blue);"></i></span>
                            <span id="crowd-label-text" class="caption" style="color: ${crowdStatus.color}; font-weight: 600;">${crowdStatus.label} (${crowdStatus.percent}%)</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: #eee; border-radius: 4px; overflow: hidden;">
                            <div id="crowd-bar-fill" style="width: ${crowdStatus.percent}%; height: 100%; background: ${crowdStatus.color}; transition: width 0.3s ease, background 0.3s;"></div>
                        </div>
                    </div>

                    <div class="flex-row gap-md" style="margin-bottom: 24px;">
                        <button class="btn btn-primary" style="flex: 1;" onclick="document.getElementById('pass-modal').classList.add('active')"><i class="fa-solid fa-ticket"></i> Buy Ticket</button>
                        <button class="btn btn-secondary" style="flex: 1;" onclick="App.openAIAssistant()"><i class="fa-solid fa-robot"></i> Ask AI</button>
                    </div>

                    <h3 style="margin-bottom: 8px;">Route Timeline</h3>
                    <div class="timeline">
                        ${this.generateTimelineHTML(busId)}
                    </div>
                </div>

                <!-- Buy Pass Modal (Context Aware - Simplified) -->
                <div id="pass-modal" class="modal-backdrop">
                    <div class="modal-content" style="padding: 24px; max-width: 300px;">
                        <div class="flex-row justify-between items-center" style="margin-bottom: 20px;">
                            <h3 style="margin:0;">Buy Ticket: ${busId}</h3>
                            <button style="background:none; border:none; font-size:20px; cursor:pointer; color: #666;" onclick="document.getElementById('pass-modal').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        
                        <!-- Hidden Input for Logic -->
                        <input id="booking-route-val" type="hidden" value="${busId} - ${busRoute}">

                        <div style="margin-bottom: 20px;">
                            <label class="caption" style="display:block; margin-bottom:8px;">Passengers</label>
                            <div class="flex-row justify-between items-center" style="background:var(--bg-light); padding: 8px 12px; border-radius:12px;">
                                <button onclick="App.updatePassengerCount(-1)" style="width:32px; height:32px; border-radius:50%; border:none; background:white; font-weight:bold; font-size:16px; color:var(--primary-blue); cursor:pointer;">-</button>
                                <strong id="passenger-count" style="font-size:18px;">${this.state.passengerCount || 1}</strong>
                                <button onclick="App.updatePassengerCount(1)" style="width:32px; height:32px; border-radius:50%; border:none; background:var(--primary-blue); font-weight:bold; font-size:16px; color:white; cursor:pointer;">+</button>
                            </div>
                        </div>

                        <div class="flex-row justify-between items-center" style="margin-bottom: 24px;">
                             <span class="caption">Total Amount</span>
                             <h2 id="total-price" style="color: var(--primary-blue); margin:0;">₹ ${50 * (this.state.passengerCount || 1)}.00</h2>
                        </div>

                        <button class="btn btn-primary" style="width:100%;" onclick="App.processPayment()">Pay Now</button>
                    </div>
                </div>
            </div>
         `;
        setTimeout(() => this.initTrackingMap(), 100);
    },

    renderDashboard() {
        document.getElementById('app').innerHTML = `
            <div style="display: flex; height: 100vh;">
                <!-- Sidebar -->
                <div style="width: 250px; background: white; padding: 24px; display: flex; flex-direction: column; border-right: 1px solid #eee;">
                    <div style="font-size: 24px; font-weight: 700; color: var(--primary-blue); margin-bottom: 40px; display: flex; align-items: center; gap: 12px;">
                        <i class="fa-solid fa-location-dot"></i> Tracko <span style="font-size: 12px; background: #eee; padding: 4px 8px; border-radius: 4px; color: #666;">ADMIN</span>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <a href="#" class="btn btn-secondary" style="text-align: left;"><i class="fa-solid fa-chart-pie" style="margin-right: 12px; width: 20px;"></i> Dashboard</a>
                        <a href="#" class="btn btn-outline" style="border:none; text-align: left; color: var(--text-secondary);"><i class="fa-solid fa-bus" style="margin-right: 12px; width: 20px;"></i> Fleet Status</a>
                        <a href="#" class="btn btn-outline" style="border:none; text-align: left; color: var(--text-secondary);"><i class="fa-solid fa-users" style="margin-right: 12px; width: 20px;"></i> Crowd Analytics</a>
                        <a href="#" class="btn btn-outline" style="border:none; text-align: left; color: var(--text-secondary);"><i class="fa-solid fa-triangle-exclamation" style="margin-right: 12px; width: 20px;"></i> Alerts</a>
                    </div>
                </div>

                <!-- Main Content -->
                <div style="flex: 1; padding: 32px; overflow-y: auto;">
                    <div class="flex-row justify-between" style="margin-bottom: 32px;">
                        <h2>City Overview</h2>
                        <div class="flex-row gap-md">
                            <span style="font-size: 14px; background: white; padding: 8px 16px; border-radius: 20px; box-shadow: var(--shadow-sm);"><i class="fa-solid fa-circle" style="color: var(--success); font-size: 10px;"></i> System Optimal</span>
                            <div style="width: 40px; height: 40px; background: #ddd; border-radius: 50%;"></div>
                        </div>
                    </div>

                    <!-- Stats Cards -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px;">
                        <div class="card">
                            <p class="caption">Active Buses</p>
                            <h2>142</h2>
                            <p style="color: var(--success); font-size: 12px;">+12 from yesterday</p>
                        </div>
                        <div class="card">
                            <p class="caption">Total Passengers</p>
                            <h2>8,420</h2>
                            <p style="color: var(--success); font-size: 12px;">Peak hour active</p>
                        </div>
                         <div class="card">
                            <p class="caption">Avg. Delay</p>
                            <h2>-2.5m</h2>
                            <p style="color: var(--success); font-size: 12px;">Improved by 10%</p>
                        </div>
                         <div class="card">
                            <p class="caption">Alerts</p>
                            <h2 style="color: var(--warning);">3</h2>
                            <p style="color: var(--text-secondary); font-size: 12px;">Minor breakdowns</p>
                        </div>
                    </div>

                    <!-- Large Map Area -->
                    <div class="card" style="height: 500px; padding: 0; overflow: hidden; position: relative;">
                         <div id="dash-map" style="width: 100%; height: 100%;"></div>
                    </div>
                </div>
            </div>
        `;
        setTimeout(() => this.initDashboardMap(), 100);
    },

    renderSafety() {
        document.getElementById('app').innerHTML = `
            <div class="view-animate" style="height: 100%; padding: 24px; display: flex; flex-direction: column; background: #FFEBEE;">
                <div class="flex-row items-center gap-md" style="margin-bottom: 24px;">
                    <button onclick="history.back()" style="background: none; border:none; font-size: 18px; cursor: pointer;"><i class="fa-solid fa-arrow-left"></i></button>
                    <h2>Safety Center</h2>
                </div>

                <div style="text-align: center; margin-bottom: 40px;">
                    <div style="width: 120px; height: 120px; background: var(--danger); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 4px 20px rgba(211, 47, 47, 0.4); animation: pulse 2s infinite;">
                        <i class="fa-solid fa-bell" style="color: white; font-size: 48px;"></i>
                    </div>
                    <h2 style="color: var(--danger);">SOS</h2>
                    <p>Press for Emergency</p>
                </div>
                
                <style>
                    @keyframes pulse {
                        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7); }
                        70% { transform: scale(1.1); box-shadow: 0 0 0 20px rgba(211, 47, 47, 0); }
                        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
                    }
                </style>

                <div class="card">
                    <div class="flex-row justify-between items-center" style="margin-bottom: 16px;">
                        <div class="flex-row gap-sm">
                            <i class="fa-solid fa-person-dress" style="color: #E91E63; font-size: 20px;"></i>
                            <strong>Women Safety Mode</strong>
                        </div>
                         <div style="width: 40px; height: 20px; background: var(--success); border-radius: 10px; position:relative;">
                            <div style="width: 16px; height: 16px; background: white; border-radius: 50%; position: absolute; top: 2px; right: 2px;"></div>
                        </div>
                    </div>
                    <p class="caption">Prioritizes well-lit stops and buses with conductors.</p>
                </div>

                <div class="card" onclick="alert('Shared via WhatsApp!')" style="cursor:pointer;">
                    <div class="flex-row gap-md">
                         <div class="icon-box blue"><i class="fa-solid fa-location-crosshairs"></i></div>
                         <div>
                            <strong>Share Live Journey</strong>
                            <p class="caption">Send tracking link to trusted contacts</p>
                         </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderSocial() {
        document.getElementById('app').innerHTML = `
            <div class="view-animate" style="height: 100%; display: flex; flex-direction: column; background: var(--bg-light);">
                <!-- Header -->
                <div style="background: var(--bg-white); padding: 16px 24px; box-shadow: var(--shadow-sm); z-index: 10;">
                    <div class="flex-row items-center gap-md">
                        <button onclick="window.location.hash='#/home'" style="background: none; border:none; font-size: 20px; cursor: pointer; color: var(--text-primary);"><i class="fa-solid fa-arrow-left"></i></button>
                        <div>
                            <h2 style="margin:0; font-size: 18px;">Community Chat</h2>
                            <div class="flex-row items-center gap-sm" style="font-size: 12px; color: var(--success);">
                                <div style="width: 8px; height: 8px; background: var(--success); border-radius: 50%;"></div>
                                124 Online
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chat Area -->
                <div id="chat-box" style="flex: 1; overflow-y: auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="background: rgba(0,0,0,0.05); padding: 4px 12px; border-radius: 12px; font-size: 11px; color: var(--text-secondary);">Today</span>
                    </div>

                    <div class="message-group">
                        <img src="https://ui-avatars.com/api/?name=System&background=eee&color=333" class="chat-avatar">
                        <div class="chat-bubble start">
                            Welcome to Tracko Community! Share updates about traffic and crowd.
                            <div class="chat-meta">10:00 AM</div>
                        </div>
                    </div>

                    ${this.state.chatMessages.map(msg => `
                        <div class="message-group ${msg.type === 'sent' ? 'mine' : ''}">
                            ${msg.type !== 'sent' ? `<img src="https://ui-avatars.com/api/?name=${msg.user}&background=random" class="chat-avatar">` : ''}
                            <div>
                                <div class="caption" style="margin-left: 4px; margin-bottom: 2px; ${msg.type === 'sent' ? 'text-align:right;' : ''}">${msg.type !== 'sent' ? msg.user : 'You'}</div>
                                <div class="chat-bubble ${msg.type === 'sent' ? 'end' : 'start'}">
                                    ${msg.text}
                                    <div class="chat-meta">${new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Input Area -->
                <div style="background: var(--bg-white); padding: 16px 24px; box-shadow: 0 -2px 10px rgba(0,0,0,0.05);">
                    <div class="flex-row gap-md" style="background: var(--bg-light); padding: 8px 16px; border-radius: 24px; border: 1px solid rgba(0,0,0,0.05);">
                        <input id="chat-input" type="text" placeholder="Type a message..." style="flex:1; border:none; outline:none; background: transparent; font-size: 15px;">
                        <button onclick="App.sendChat()" style="background: var(--primary-blue); color:white; border:none; width:36px; height:36px; border-radius:50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);"><i class="fa-solid fa-paper-plane" style="font-size: 14px;"></i></button>
                    </div>
                </div>
            </div>
        `;
        // Scroll to bottom
        const chatBox = document.getElementById('chat-box');
        setTimeout(() => chatBox.scrollTop = chatBox.scrollHeight, 100);
    },

    sendChat() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (text) {
            this.state.chatMessages.push({ id: Date.now(), user: 'You', text: text, type: 'sent' });
            this.renderSocial();
            setTimeout(() => {
                // Mock reply
                this.state.chatMessages.push({ id: Date.now() + 1, user: 'Bot', text: 'Thanks for the update!', type: 'received' });
                this.renderSocial();
            }, 1000);
        }
    },

    renderNotifications() {
        document.getElementById('app').innerHTML = `
            <div class="view-animate" style="height: 100%; padding: 24px;">
                <div class="flex-row items-center gap-md" style="margin-bottom: 24px;">
                    <button onclick="history.back()" style="background: none; border:none; font-size: 18px; cursor: pointer; color: inherit;"><i class="fa-solid fa-arrow-left"></i></button>
                    <h2>Notifications</h2>
                </div>

                ${this.state.notifications.map(n => `
                    <div class="notif-item ${n.id === 1 ? 'unread' : ''}">
                        <div class="icon-box blue" style="width:40px; height:40px; flex-shrink:0;">
                            <i class="fa-solid ${n.type === 'warning' ? 'fa-triangle-exclamation' : n.type === 'success' ? 'fa-wallet' : 'fa-bell'}"></i>
                        </div>
                        <div>
                            <div class="flex-row justify-between" style="width: 100%;">
                                <strong>${n.title}</strong>
                                <span class="caption">${n.time}</span>
                            </div>
                            <p style="font-size:13px; color:var(--text-secondary); margin-top:4px;">${n.msg}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderSettings() {
        document.getElementById('app').innerHTML = `
            <div class="view-animate" style="height: 100%; padding: 24px; display: flex; flex-direction: column;">
                <div class="flex-row items-center gap-md" style="margin-bottom: 24px;">
                    <button onclick="history.back()" style="background: none; border:none; font-size: 18px; cursor: pointer;"><i class="fa-solid fa-arrow-left"></i></button>
                    <h2>Settings</h2>
                </div>

                <div class="flex-row items-center gap-md" style="margin-bottom: 32px;">
                     <div style="width: 64px; height: 64px; background: #eee; border-radius: 50%; overflow: hidden;">
                        <img src="https://placehold.co/100x100/1E88E5/ffffff?text=U" style="width:100%; height:100%;">
                     </div>
                     <div>
                        <h3>User Name</h3>
                        <p class="caption">+91 98765 43210</p>
                     </div>
                </div>

                <div class="card flex-row justify-between items-center" style="margin-bottom: 12px;">
                    <div class="flex-row gap-md">
                        <i class="fa-regular fa-moon"></i> Dark Mode
                    </div>
                    <label class="switch">
                        <input type="checkbox" onchange="App.toggleTheme()" ${document.body.getAttribute('data-theme') === 'dark' ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
                
                 <div class="card flex-row justify-between items-center" style="margin-bottom: 12px;">
                    <div class="flex-row gap-md">
                        <i class="fa-solid fa-bell"></i> Notifications
                    </div>
                    <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                </div>

                    </div>
                    <div style="display:flex; justify-content:space-between; width:100%; margin-top:2px;">
                        <span class="caption">English</span>    
                        <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                    </div>
                 </div>
            </div>
        `;
    },

    renderConductor() {
        document.getElementById('app').innerHTML = `
            <div class="view-animate" style="height: 100%; display: flex; flex-direction: column;">
                <div style="background: var(--primary-dark-blue); color: white; padding: 16px;">
                    <div class="flex-row justify-between">
                         <h3>Conductor POS</h3>
                         <span>Bus 12A • TN 01 N 2548</span>
                    </div>
                </div>
                
                <div class="flex-row justify-between" style="padding: 16px; background: #E3F2FD; border-bottom: 1px solid #BBDEFB;">
                    <div class="text-center">
                        <h2 id="conductor-live-count" style="color: var(--primary-dark-blue);">${this.state.livePassengers || 0}</h2>
                        <div class="caption">Live Count</div>
                    </div>
                    <div class="text-center">
                         <h2 style="color: var(--success);">₹ 2,450</h2>
                         <div class="caption">Today's Collection</div>
                    </div>
                </div>

                
                <div style="padding: 16px; flex: 1; overflow-y: auto;">
                    <div class="card flex-row justify-between items-center">
                        <div>
                            <span class="caption">Current Stop</span>
                            <h2>Adyar Depot</h2>
                        </div>
                        <button class="btn btn-outline" style="width: auto; padding: 8px 16px;">Next Stop</button>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                        <div class="card text-center" style="margin-bottom:0;">
                            <h1 id="conductor-live-count" style="color: var(--success);">${this.state.livePassengers || 0}</h1>
                            <p class="caption">Live Passengers</p>
                        </div>
                        <div class="card text-center" style="margin-bottom:0;">
                             <h1 style="color: var(--warning);">65%</h1>
                            <p class="caption">Occupancy</p>
                        </div>
                    </div>

                    <h3>Quick Ticket</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
                         <button class="btn btn-secondary" style="background:white; border:1px solid #ddd;">Guindy</button>
                         <button class="btn btn-secondary" style="background:white; border:1px solid #ddd;">Saidapet</button>
                         <button class="btn btn-secondary" style="background:white; border:1px solid #ddd;">T.Nagar</button>
                         <button class="btn btn-secondary" style="background:white; border:1px solid #ddd;">Central</button>
                         <button class="btn btn-secondary" style="background:white; border:1px solid #ddd;">Beach</button>
                         <button class="btn btn-secondary" style="background:white; border:1px solid #ddd;">Airport</button>
                    </div>

                    <div class="card" style="background: #E0F2F1;">
                         <div class="flex-row justify-between items-center">
                            <strong>Issue Digital Ticket (QR)</strong>
                            <i class="fa-solid fa-qrcode" style="font-size: 24px;"></i>
                        </div>
                    </div>
                </div>
                
                <div style="padding: 16px; background: white; border-top: 1px solid #eee;">
                    <button class="btn btn-primary" onclick="window.location.hash='#/home'">Back to User App</button>
                </div>
            </div>
        `;
    },

    renderWallet() {
        this.state.passengerCount = 1; // Reset count
        document.getElementById('app').innerHTML = `
            <div class="view-animate" style="height: 100%; display: flex; flex-direction: column; background: var(--bg-white);">
                <div class="flex-row items-center gap-md" style="padding: 24px 24px 0 24px;">
                    <button onclick="window.location.hash='#/home'" style="background: none; border:none; font-size: 18px; cursor: pointer; color: inherit;"><i class="fa-solid fa-arrow-left"></i></button>
                    <h2>My Wallet</h2>
                </div>

                <div style="flex: 1; overflow-y: auto; padding: 24px;">
                    <!-- Wallet Card -->
                <div class="wallet-card" style="margin-bottom: 24px;">
                    <div class="flex-row justify-between">
                        <span style="opacity:0.8;">Total Balance</span>
                        <i class="fa-solid fa-wallet" style="opacity:0.6;"></i>
                    </div>
                    <div>
                        <h1 style="font-size: 42px;">₹ 450.00</h1>
                    </div>
                    <div class="flex-row gap-md">
                        <button style="background: rgba(0,0,0,0.2); color: white; border:none; padding: 8px 16px; border-radius: 20px; cursor: pointer;">+ Add Money</button>
                        <button onclick="window.location.hash='#/ticket-history'" style="background: white; color: var(--primary-blue); border:none; padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer;">History</button>
                    </div>
                </div>

                <div class="h3" style="margin-bottom: 16px;">Quick Actions</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
                     <div class="card text-center" style="cursor: pointer;" onclick="document.getElementById('qr-modal').style.display='flex'">
                        <div class="icon-box blue" style="margin: 0 auto 8px; width: 48px; height: 48px;"><i class="fa-solid fa-qrcode" style="font-size: 24px;"></i></div>
                        <strong>Show QR</strong>
                     </div>
                     <div class="card text-center" style="cursor: pointer;" onclick="document.getElementById('pass-modal').classList.add('active')">
                        <div class="icon-box green" style="margin: 0 auto 8px; width: 48px; height: 48px;"><i class="fa-solid fa-ticket" style="font-size: 24px;"></i></div>
                        <strong>Buy Pass</strong>
                     </div>
                </div>
            </div>

                <!-- QR Modal -->
                <div id="qr-modal" style="display: none; position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.8); z-index: 2000; flex-direction: column; align-items: center; justify-content: center;" onclick="this.style.display='none'">
                    <div style="background: white; padding: 32px; border-radius: 24px; text-align: center; width: 80%; max-width: 320px; animation: fadeIn 0.3s ease;">
                        <h2 style="color: var(--text-primary); margin-bottom: 16px;">Scan to Pay</h2>
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TrackoPayment" style="width: 200px; height: 200px; margin-bottom: 16px;">
                        <p class="caption">Show this to the conductor</p>
                    </div>
                </div>

                <!-- Buy Pass Modal -->
                <div id="pass-modal" class="modal-backdrop">
                    <div class="modal-content">
                        <div class="flex-row justify-between items-center" style="margin-bottom: 24px;">
                            <h3>Buy Daily Pass</h3>
                            <button style="background:none; border:none; font-size:20px; cursor:pointer;" onclick="document.getElementById('pass-modal').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label class="caption">Select Route / Zone</label>
                            <select class="input-field" style="width:100%; margin-top:8px;">
                                <option>All City Buses (Non-AC)</option>
                                <option>All City Buses (AC)</option>
                                <option>Express Routes only</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 24px;">
                            <label class="caption">Passengers</label>
                            <div class="flex-row justify-between items-center" style="margin-top:12px; background:var(--bg-light); padding:8px; border-radius:12px;">
                                <button onclick="App.updatePassengerCount(-1)" style="width:40px; height:40px; border-radius:50%; border:none; background:white; font-weight:bold; font-size:18px; color:var(--primary-blue); cursor:pointer; box-shadow:var(--shadow-sm);">-</button>
                                <strong id="passenger-count" style="font-size:18px;">1</strong>
                                <button onclick="App.updatePassengerCount(1)" style="width:40px; height:40px; border-radius:50%; border:none; background:var(--primary-blue); font-weight:bold; font-size:18px; color:white; cursor:pointer; box-shadow:var(--shadow-sm);">+</button>
                            </div>
                        </div>

                        <div class="flex-row justify-between items-center" style="margin-bottom: 24px;">
                             <h3>Total</h3>
                             <h2 id="total-price" style="color: var(--primary-blue);">₹ 50.00</h2>
                        </div>

                        <button class="btn btn-primary" onclick="App.processPayment()">Pay & Generate Pass</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderTicketHistory() {
        document.getElementById('app').innerHTML = `
            <div class="view-animate" style="height: 100%; display: flex; flex-direction: column; background: var(--bg-white);">
                <div class="flex-row items-center gap-md" style="padding: 24px;">
                    <button onclick="window.location.hash='#/wallet'" style="background: none; border:none; font-size: 18px; cursor: pointer; color: inherit;"><i class="fa-solid fa-arrow-left"></i></button>
                    <h2>My Tickets</h2>
                </div>

                <div style="flex: 1; overflow-y: auto; padding: 0 24px 24px;">
                    ${this.state.tickets.length === 0 ?
                `<div style="text-align: center; margin-top: 40px; color: var(--text-secondary);">
                            <i class="fa-solid fa-ticket" style="font-size: 48px; opacity: 0.2; margin-bottom: 16px;"></i>
                            <p>No tickets purchased yet.</p>
                        </div>` :
                this.state.tickets.map(t => `
                        <div class="card" onclick="App.openTicketModal('${t.id}')" style="margin-bottom: 16px; cursor: pointer; border-left: 4px solid var(--primary-blue);">
                            <div class="flex-row justify-between" style="margin-bottom: 8px;">
                                <strong style="color: var(--primary-blue);">${t.id}</strong>
                                <span class="caption" style="background: #E3F2FD; color: #1565C0; padding: 2px 8px; border-radius: 4px;">${t.status}</span>
                            </div>
                            <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">${t.route}</div>
                            <div class="flex-row justify-between text-secondary" style="font-size: 13px;">
                                <span><i class="fa-solid fa-users"></i> ${t.passengers} Passenger(s)</span>
                                <span>${t.date.split(',')[0]}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Ticket Modal (Conductor View) -->
            <div id="ticket-modal" class="modal-backdrop" onclick="if(event.target === this) this.classList.remove('active')">
                <div class="modal-content" style="text-align: center;">
                    <div style="margin-bottom: 24px;">
                        <span style="background: #E8F5E9; color: #2E7D32; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">Valid Ticket</span>
                    </div>
                    <h2 id="modal-ticket-route" style="margin-bottom: 8px;">Route A</h2>
                    <p id="modal-ticket-id" class="caption" style="margin-bottom: 24px;">ID: TKT12345</p>
                    
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ValidTicket" style="width: 180px; height: 180px; margin-bottom: 24px; border: 1px solid #eee; padding: 8px; border-radius: 12px;">
                    
                    <div class="flex-row justify-between" style="background: var(--bg-light); padding: 16px; border-radius: 12px; margin-bottom: 24px;">
                        <div class="text-center">
                            <div class="caption">Passengers</div>
                            <strong id="modal-ticket-passengers" style="font-size: 18px;">2</strong>
                        </div>
                        <div class="text-center" style="border-left: 1px solid #ddd; border-right: 1px solid #ddd; padding: 0 16px;">
                            <div class="caption">Amount</div>
                            <strong id="modal-ticket-amount" style="font-size: 18px;">₹ 100</strong>
                        </div>
                         <div class="text-center">
                            <div class="caption">Date</div>
                            <strong id="modal-ticket-date" style="font-size: 14px;">Today</strong>
                        </div>
                    </div>
                    
                    <button class="btn btn-primary" onclick="document.getElementById('ticket-modal').classList.remove('active')">Close</button>
                </div>
            </div>
        `;
    },

    openTicketModal(id) {
        const ticket = this.state.tickets.find(t => t.id === id);
        if (ticket) {
            document.getElementById('modal-ticket-route').innerText = ticket.route;
            document.getElementById('modal-ticket-id').innerText = `ID: ${ticket.id}`;
            document.getElementById('modal-ticket-passengers').innerText = ticket.passengers;
            document.getElementById('modal-ticket-amount').innerText = `₹ ${ticket.amount}`;
            document.getElementById('modal-ticket-date').innerText = ticket.date.split(',')[0];
            document.getElementById('ticket-modal').classList.add('active');
        }
    },

    updatePassengerCount(change) {
        let newCount = this.state.passengerCount + change;
        if (newCount < 1) newCount = 1;
        if (newCount > 5) {
            this.showToast('Max 5 passengers allowed');
            return;
        }

        this.state.passengerCount = newCount;
        document.getElementById('passenger-count').innerText = newCount;
        document.getElementById('total-price').innerText = `₹ ${50 * newCount}.00`;
    },

    processPayment() {
        // Show Loader Simulation
        const btn = document.querySelector('#pass-modal .btn-primary');
        const originalText = btn.innerText;
        btn.innerText = 'Processing...';
        btn.style.opacity = 0.7;

        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.opacity = 1;
            document.getElementById('pass-modal').classList.remove('active');

            // Create Ticket
            // Create Ticket
            const amount = 50 * this.state.passengerCount;

            // Get Route Value (from Select in Wallet or Input in Tracking)
            let routeValue = 'Unknown Route';
            const routeSelect = document.querySelector('#pass-modal select');
            const routeInput = document.getElementById('booking-route-val');

            if (routeSelect) routeValue = routeSelect.value;
            else if (routeInput) routeValue = routeInput.value;

            const ticket = {
                id: 'TKT' + Math.floor(Math.random() * 10000),
                date: new Date().toLocaleString(),
                passengers: this.state.passengerCount,
                amount: amount,
                route: routeValue,
                status: 'Active'
            };
            this.state.tickets.unshift(ticket); // Add to top

            this.showToast(`Pass Generated! ID: ${ticket.id}`);

            // Update balance mock
            const balanceEl = document.querySelector('.wallet-card h1');
            if (balanceEl) {
                const currentBalance = parseInt(balanceEl.innerText.replace('₹ ', ''));
                balanceEl.innerText = `₹ ${currentBalance - amount}.00`;
            }
        }, 1500);
    },

    // --- UTILS ---
    crowdColor(percent) {
        if (percent < 50) return 'var(--success)';
        if (percent < 80) return 'var(--warning)';
        return 'var(--danger)';
    },

    initMap() {
        if (this.map) this.map.remove();
        // Chennai Coords
        this.map = L.map('map', { zoomControl: false }).setView([13.0827, 80.2707], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO'
        }).addTo(this.map);

        // User Marker
        L.marker([13.0827, 80.2707]).addTo(this.map)
            .bindPopup("You are here").openPopup();

        // Mock Bus Markers
        this.addBusMarker(13.0850, 80.2750, '12A');
        this.addBusMarker(13.0700, 80.2600, '45C');
    },

    async initTrackingMap() {
        const bus = this.state.selectedBus || { id: '12A' };
        const map = L.map('map-track', { zoomControl: false }).setView([13.0827, 80.2707], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

        // Fetch Route Points
        let latlngs = [];
        try {
            const response = await fetch(`http://localhost:3000/api/routes/${bus.id}/stops`);
            const data = await response.json();

            if (data && data.stops && data.stops.length > 0) {
                latlngs = data.stops
                    .filter(s => s.latitude && s.longitude)
                    .map(s => [s.latitude, s.longitude]);
            }
        } catch (e) {
            console.error('Failed to load route path', e);
        }

        // Fallback if no points (e.g. server error)
        if (latlngs.length === 0) {
            latlngs = [[13.0827, 80.2707], [13.0850, 80.2750]]; // Default short line
        }

        // Bus Icon
        const busIcon = L.divIcon({
            className: 'custom-bus-icon',
            html: '<div style="background:var(--primary-blue); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; border:2px solid white; box-shadow:0 4px 8px rgba(0,0,0,0.2);"><i class="fa-solid fa-bus"></i></div>',
            iconSize: [32, 32]
        });

        const startPos = latlngs[0];
        const busMarker = L.marker(startPos, { icon: busIcon }).addTo(map);

        // Draw Path Line
        const polyline = L.polyline(latlngs, { color: 'var(--primary-blue)', weight: 4 }).addTo(map);

        // Fit map to route
        map.fitBounds(polyline.getBounds(), { padding: [20, 20] });

        // Simulate Movement (interpolating between stops for smoothness)
        let currentIndex = 0;
        const totalSteps = 100; // Steps between stops
        let step = 0;

        if (this.trackingInterval) clearInterval(this.trackingInterval);

        this.trackingInterval = setInterval(() => {
            if (currentIndex < latlngs.length - 1) {
                const p1 = latlngs[currentIndex];
                const p2 = latlngs[currentIndex + 1];

                const lat = p1[0] + (p2[0] - p1[0]) * (step / totalSteps);
                const lng = p1[1] + (p2[1] - p1[1]) * (step / totalSteps);

                busMarker.setLatLng([lat, lng]);

                // Pan map if needed (optional, effectively handled by fitBounds usually, but good for tracking)
                // map.panTo([lat, lng]); 

                step++;
                if (step > totalSteps) {
                    step = 0;
                    currentIndex++;
                }
            } else {
                // Loop or stop? Loop for demo
                currentIndex = 0;
                busMarker.setLatLng(latlngs[0]);
            }
        }, 50); // Fast update for smooth animation
    },

    initDashboardMap() {
        const map = L.map('dash-map').setView([13.0827, 80.2707], 12);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

        // Heatmap Simulation (just circles for now)
        const heatPoints = [
            [13.0827, 80.2707, 0.5],
            [13.0600, 80.2400, 0.8], // Busy
            [13.1000, 80.2900, 0.2]
        ];

        heatPoints.forEach(p => {
            L.circle([p[0], p[1]], {
                color: 'transparent',
                fillColor: p[2] > 0.6 ? 'red' : 'green',
                fillOpacity: 0.4,
                radius: 1500
            }).addTo(map);
        });
    },

    addBusMarker(lat, lng, label) {
        const icon = L.divIcon({
            className: 'map-bus-icon',
            html: `<div style="background:white; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:12px; box-shadow:0 2px 4px rgba(0,0,0,0.2); display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-bus" style="color:var(--primary-blue)"></i> ${label}</div>`
        });
        L.marker([lat, lng], { icon: icon })
            .addTo(this.map)
            .on('click', () => {
                window.location.hash = '#/bus-tracking';
                this.showToast(`Tracking Bus ${label}...`);
            });
    },

    // Update Passenger Count
    updatePassengerCount(delta) {
        this.state.passengerCount = Math.max(1, Math.min(5, (this.state.passengerCount || 1) + delta));
        document.getElementById('passenger-count').innerText = this.state.passengerCount;
        document.getElementById('total-price').innerText = `₹ ${50 * this.state.passengerCount}.00`;
    },

    // Process Payment with Razorpay
    async processPayment() {
        const amount = 50 * (this.state.passengerCount || 1);
        const busId = this.state.selectedBus?.id || '12A';
        const route = this.state.selectedBus?.route || 'Unknown Route';

        try {
            // Step 1: Create order on backend
            const orderResponse = await fetch('http://localhost:3000/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amount,
                    currency: 'INR',
                    receipt: `ticket_${Date.now()}`
                })
            });

            const orderData = await orderResponse.json();

            if (!orderData.success) {
                throw new Error('Failed to create order');
            }

            // Step 2: Open Razorpay Checkout
            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                order_id: orderData.orderId,
                name: 'Tracko Bus Ticket',
                description: `${busId} - ${route}`,
                image: 'https://api.dicebear.com/7.x/shapes/svg?seed=tracko&backgroundColor=1e88e5',
                prefill: {
                    name: 'User',
                    email: 'user@tracko.com',
                    contact: '9999999999'
                },
                theme: {
                    color: '#1e88e5'
                },
                handler: async (response) => {
                    // Step 3: Verify payment on backend
                    const verifyResponse = await fetch('http://localhost:3000/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            ticketData: {
                                busId,
                                route,
                                passengers: this.state.passengerCount,
                                amount
                            }
                        })
                    });

                    const verifyData = await verifyResponse.json();

                    if (verifyData.success) {
                        // Save ticket to state
                        const newTicket = {
                            id: verifyData.ticketId,
                            busId: busId,
                            route: route,
                            passengers: this.state.passengerCount,
                            amount: amount,
                            date: new Date().toLocaleDateString(),
                            time: new Date().toLocaleTimeString(),
                            status: 'Valid',
                            paymentId: verifyData.paymentId
                        };

                        this.state.tickets = this.state.tickets || [];
                        this.state.tickets.unshift(newTicket);
                        localStorage.setItem('tickets', JSON.stringify(this.state.tickets));

                        // Close modal
                        document.getElementById('pass-modal').classList.remove('active');

                        // Show success
                        this.showToast(`✅ Ticket Saved! ID: ${verifyData.ticketId}`);

                        console.log('Ticket saved:', newTicket);
                    } else {
                        this.showToast('❌ Payment verification failed');
                    }
                },
                modal: {
                    ondismiss: () => {
                        this.showToast('Payment cancelled');
                    }
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Payment error:', error);
            this.showToast('❌ Payment failed. Please try again.');
        }
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => {
    App.initTheme();
    App.init();
});

