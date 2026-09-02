// ==========================================
// BLUSH & BRUSH - FULL-STACK CLIENT ENGINE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // Global State
    let currentUser = null;
    let userToken = localStorage.getItem("blush_token") || null;
    let allAppointments = [];
    let allServices = [];
    let allProducts = [];
    let allUsers = [];

    // Calendar state
    let calCurrentDate = new Date();

    // ==========================================
    // 1. STARTUP LOADER & ANNOUNCEMENT BANNER
    // ==========================================
    const loader = document.getElementById("loader");
    if (loader) {
        setTimeout(() => {
            loader.classList.add("hidden");
        }, 2200);
    }

    fetchAnnouncements();
    fetchPublicServices();

    async function fetchAnnouncements() {
        try {
            const res = await fetch("/api/announcements");
            const data = await res.json();
            if (res.ok && data.announcements && data.announcements.length > 0) {
                const banner = document.getElementById("announcementBanner");
                const text = document.getElementById("announcementText");
                const latest = data.announcements[0];
                if (banner && text) {
                    text.innerHTML = `<i class="fa-solid fa-bullhorn mr-1.5"></i> <strong>${escapeHTML(latest.title)}:</strong> ${escapeHTML(latest.content)}`;
                    banner.classList.remove("hidden");
                }
            }
        } catch (err) {
            console.error("Announcement fetch error:", err);
        }
    }

    const closeAnnBanner = document.getElementById("closeAnnouncementBanner");
    if (closeAnnBanner) {
        closeAnnBanner.addEventListener("click", () => {
            document.getElementById("announcementBanner").classList.add("hidden");
        });
    }

    async function fetchPublicServices() {
        try {
            const res = await fetch("/api/services");
            const data = await res.json();
            if (res.ok) {
                allServices = data.services;
                renderLandingServices(allServices);
                populateBookingServicesDropdown(allServices);
            }
        } catch (err) {
            console.error("Services fetch error:", err);
        }
    }

    function renderLandingServices(services) {
        const container = document.getElementById("landingServicesContainer");
        if (!container) return;

        if (!services || services.length === 0) {
            container.innerHTML = `<p class="text-xs text-gray-500 text-center col-span-3">No services catalog available.</p>`;
            return;
        }

        container.innerHTML = services.map(s => `
            <div class="bg-white p-7 rounded-2xl border border-pink-100 shadow-xs text-center flex flex-col items-center hover:shadow-xl hover:border-[#D86B81]/40 transition-all group">
                <div class="w-14 h-14 rounded-2xl bg-[#FFF0F3] text-[#D86B81] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    <i class="fa-solid ${getCategoryIcon(s.category)}"></i>
                </div>
                <h3 class="text-base font-serif font-bold text-gray-900 mb-1">${escapeHTML(s.name)}</h3>
                <span class="text-xs font-bold text-[#D86B81] mb-2">Rs. ${s.price.toLocaleString()} (${escapeHTML(s.duration)})</span>
                <p class="text-xs text-gray-500 leading-relaxed mb-4">${escapeHTML(s.description || "Premium beauty service.")}</p>
                <button class="bookServiceBtn mt-auto text-xs font-bold text-[#D86B81] uppercase tracking-wider hover:underline" data-service="${escapeHTML(s.name)}">Book This Service &rarr;</button>
            </div>
        `).join("");

        bindBookingButtons();
    }

    function populateBookingServicesDropdown(services) {
        const select = document.getElementById("bookService");
        if (!select) return;
        select.innerHTML = `<option value="">-- Choose a Service --</option>` + services.map(s => `
            <option value="${escapeHTML(s.name)}">${escapeHTML(s.name)} - Rs. ${s.price} (${escapeHTML(s.duration)})</option>
        `).join("");
    }


    // ==========================================
    // 2. INITIALIZE SESSION & AUTHENTICATION
    // ==========================================
    if (userToken) {
        fetchCurrentUser();
    } else {
        updateNavbar();
    }

    async function fetchCurrentUser() {
        try {
            const res = await fetch("/api/auth/me", {
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                currentUser = data.user;
                updateNavbar();
            } else {
                logout();
            }
        } catch (err) {
            console.error("Session check error:", err);
            updateNavbar();
        }
    }

    function logout() {
        currentUser = null;
        userToken = null;
        localStorage.removeItem("blush_token");
        localStorage.removeItem("blush_user");
        updateNavbar();
        closeAllModals();
        alert("You have logged out.");
    }

    function updateNavbar() {
        const navAuthContainer = document.getElementById("navAuthContainer");
        const mobileAuthContainer = document.getElementById("mobileAuthContainer");

        if (!currentUser) {
            if (navAuthContainer) {
                navAuthContainer.innerHTML = `
                    <button id="openAuthBtn" class="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#D86B81] bg-[#FFF0F3] hover:bg-[#D86B81] hover:text-white rounded-xl transition-all">
                        <i class="fa-regular fa-user mr-1"></i> Login / Signup
                    </button>
                    <button class="openBookingModalBtn hidden sm:inline-block bg-[#D86B81] hover:bg-[#c4576d] text-white text-xs font-semibold tracking-wider uppercase px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
                        Book Appointment
                    </button>
                `;
            }
            if (mobileAuthContainer) {
                mobileAuthContainer.innerHTML = `
                    <button id="mobileOpenAuthBtn" class="w-full py-2 bg-[#D86B81] text-white text-xs font-semibold uppercase rounded-lg">Login / Signup</button>
                `;
            }
        } else if (currentUser.role === "superadmin") {
            if (navAuthContainer) {
                navAuthContainer.innerHTML = `
                    <button id="openSuperAdminNavBtn" class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-sm transition-all">
                        <i class="fa-solid fa-shield-halved mr-1"></i> Super Admin Suite
                    </button>
                    <button id="logoutNavBtn" class="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-red-600 bg-gray-100 rounded-xl">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </button>
                `;
            }
        } else if (currentUser.role === "admin") {
            if (navAuthContainer) {
                navAuthContainer.innerHTML = `
                    <button id="openAdminDashboardNavBtn" class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#D86B81] hover:bg-[#c4576d] rounded-xl shadow-sm transition-all">
                        <i class="fa-solid fa-chart-pie mr-1"></i> Admin Dashboard
                    </button>
                    <button id="logoutNavBtn" class="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-red-600 bg-gray-100 rounded-xl">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </button>
                `;
            }
        } else {
            if (navAuthContainer) {
                navAuthContainer.innerHTML = `
                    <button id="openUserDashboardNavBtn" class="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#D86B81] bg-[#FFF0F3] hover:bg-[#D86B81] hover:text-white rounded-xl transition-all">
                        <i class="fa-regular fa-calendar-check mr-1"></i> My Dashboard
                    </button>
                    <button class="openBookingModalBtn hidden sm:inline-block bg-[#D86B81] hover:bg-[#c4576d] text-white text-xs font-semibold tracking-wider uppercase px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
                        Book Appointment
                    </button>
                    <button id="logoutNavBtn" class="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-red-600 bg-gray-100 rounded-xl">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </button>
                `;
            }
        }

        bindDynamicNavEvents();
    }

    function bindDynamicNavEvents() {
        const openAuthBtn = document.getElementById("openAuthBtn");
        const mobileOpenAuthBtn = document.getElementById("mobileOpenAuthBtn");
        const logoutNavBtn = document.getElementById("logoutNavBtn");
        const openSuperAdminNavBtn = document.getElementById("openSuperAdminNavBtn");
        const openAdminDashboardNavBtn = document.getElementById("openAdminDashboardNavBtn");
        const openUserDashboardNavBtn = document.getElementById("openUserDashboardNavBtn");

        if (openAuthBtn) openAuthBtn.addEventListener("click", openAuthModal);
        if (mobileOpenAuthBtn) mobileOpenAuthBtn.addEventListener("click", openAuthModal);
        if (logoutNavBtn) logoutNavBtn.addEventListener("click", logout);
        if (openSuperAdminNavBtn) openSuperAdminNavBtn.addEventListener("click", openSuperAdminDashboard);
        if (openAdminDashboardNavBtn) openAdminDashboardNavBtn.addEventListener("click", openAdminDashboard);
        if (openUserDashboardNavBtn) openUserDashboardNavBtn.addEventListener("click", openUserDashboard);

        bindBookingButtons();
    }

    function bindBookingButtons() {
        document.querySelectorAll(".openBookingModalBtn, .bookServiceBtn").forEach(btn => {
            btn.addEventListener("click", function () {
                const serviceName = this.getAttribute("data-service");
                if (!currentUser) {
                    alert("Please login or signup to schedule an appointment.");
                    openAuthModal();
                } else if (currentUser.role === "superadmin") {
                    openSuperAdminDashboard();
                } else if (currentUser.role === "admin") {
                    openAdminDashboard();
                } else {
                    openUserDashboard();
                    switchUserSubView("userViewNewAppt");
                    if (serviceName) {
                        const select = document.getElementById("bookService");
                        if (select) select.value = serviceName;
                    }
                }
            });
        });
    }


    // ==========================================
    // 3. AUTH MODAL & QUICK DEMO FILLERS
    // ==========================================
    const authModal = document.getElementById("authModal");
    const closeAuthModal = document.getElementById("closeAuthModal");
    const tabLoginBtn = document.getElementById("tabLoginBtn");
    const tabSignupBtn = document.getElementById("tabSignupBtn");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    function openAuthModal() {
        authModal.classList.remove("hidden");
    }

    if (closeAuthModal) closeAuthModal.addEventListener("click", () => authModal.classList.add("hidden"));

    if (tabLoginBtn && tabSignupBtn) {
        tabLoginBtn.addEventListener("click", () => {
            tabLoginBtn.className = "flex-1 py-2.5 text-center text-[#D86B81] border-b-2 border-[#D86B81] transition-all";
            tabSignupBtn.className = "flex-1 py-2.5 text-center text-gray-400 border-b-2 border-transparent hover:text-gray-600 transition-all";
            loginForm.classList.remove("hidden");
            signupForm.classList.add("hidden");
        });

        tabSignupBtn.addEventListener("click", () => {
            tabSignupBtn.className = "flex-1 py-2.5 text-center text-[#D86B81] border-b-2 border-[#D86B81] transition-all";
            tabLoginBtn.className = "flex-1 py-2.5 text-center text-gray-400 border-b-2 border-transparent hover:text-gray-600 transition-all";
            signupForm.classList.remove("hidden");
            loginForm.classList.add("hidden");
        });
    }

    // Quick Demo Credentials Fill Buttons
    const fillSuperAdminBtn = document.getElementById("fillSuperAdminBtn");
    const fillAdminBtn = document.getElementById("fillAdminBtn");
    const fillClientBtn = document.getElementById("fillClientBtn");

    if (fillSuperAdminBtn) {
        fillSuperAdminBtn.addEventListener("click", () => {
            document.getElementById("loginEmail").value = "superadmin@blushandbrush.com";
            document.getElementById("loginPassword").value = "super123";
        });
    }
    if (fillAdminBtn) {
        fillAdminBtn.addEventListener("click", () => {
            document.getElementById("loginEmail").value = "admin@blushandbrush.com";
            document.getElementById("loginPassword").value = "admin123";
        });
    }
    if (fillClientBtn) {
        fillClientBtn.addEventListener("click", () => {
            document.getElementById("loginEmail").value = "sarah@gmail.com";
            document.getElementById("loginPassword").value = "user123";
        });
    }

    // LOGIN SUBMIT
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;
            const errorMsg = document.getElementById("loginErrorMsg");
            errorMsg.classList.add("hidden");

            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();

                if (res.ok) {
                    userToken = data.token;
                    currentUser = data.user;
                    localStorage.setItem("blush_token", userToken);
                    localStorage.setItem("blush_user", JSON.stringify(currentUser));
                    updateNavbar();
                    authModal.classList.add("hidden");
                    loginForm.reset();

                    if (currentUser.role === "superadmin") openSuperAdminDashboard();
                    else if (currentUser.role === "admin") openAdminDashboard();
                    else openUserDashboard();
                } else {
                    errorMsg.textContent = data.error || "Login failed.";
                    errorMsg.classList.remove("hidden");
                }
            } catch (err) {
                errorMsg.textContent = "Server connection error.";
                errorMsg.classList.remove("hidden");
            }
        });
    }

    // SIGNUP SUBMIT
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("signupName").value;
            const email = document.getElementById("signupEmail").value;
            const phone = document.getElementById("signupPhone").value;
            const password = document.getElementById("signupPassword").value;
            const role = document.getElementById("signupRole").value;
            const errorMsg = document.getElementById("signupErrorMsg");
            errorMsg.classList.add("hidden");

            try {
                const res = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, phone, password, role })
                });
                const data = await res.json();

                if (res.ok) {
                    userToken = data.token;
                    currentUser = data.user;
                    localStorage.setItem("blush_token", userToken);
                    localStorage.setItem("blush_user", JSON.stringify(currentUser));
                    updateNavbar();
                    authModal.classList.add("hidden");
                    signupForm.reset();

                    alert(`Account created! Welcome ${currentUser.name}`);
                    if (currentUser.role === "superadmin") openSuperAdminDashboard();
                    else if (currentUser.role === "admin") openAdminDashboard();
                    else openUserDashboard();
                } else {
                    errorMsg.textContent = data.error || "Signup failed.";
                    errorMsg.classList.remove("hidden");
                }
            } catch (err) {
                errorMsg.textContent = "Server error.";
                errorMsg.classList.remove("hidden");
            }
        });
    }


    // ==========================================
    // 4. USER DASHBOARD (WITH SIDEBAR & CALENDAR)
    // ==========================================
    const userDashboardModal = document.getElementById("userDashboardModal");
    const closeUserDashboardBtn = document.getElementById("closeUserDashboardBtn");
    const userLogoutBtn = document.getElementById("userLogoutBtn");
    const userBookingForm = document.getElementById("userBookingForm");
    const updateProfileForm = document.getElementById("updateProfileForm");
    const updatePasswordForm = document.getElementById("updatePasswordForm");
    const refreshUserApptsBtn = document.getElementById("refreshUserApptsBtn");

    function openUserDashboard() {
        if (!currentUser) return openAuthModal();
        userDashboardModal.classList.remove("hidden");

        document.getElementById("userSidebarName").textContent = currentUser.name;
        document.getElementById("userSidebarEmail").textContent = currentUser.email;

        document.getElementById("profileNameInput").value = currentUser.name;
        document.getElementById("profilePhoneInput").value = currentUser.phone;
        document.getElementById("profileEmailInput").value = currentUser.email;

        document.getElementById("bookName").value = currentUser.name;
        document.getElementById("bookPhone").value = currentUser.phone;
        document.getElementById("bookDate").value = new Date().toISOString().split("T")[0];

        switchUserSubView("userViewNewAppt");
        fetchUserAppointments();
    }

    if (closeUserDashboardBtn) closeUserDashboardBtn.addEventListener("click", () => userDashboardModal.classList.add("hidden"));
    if (userLogoutBtn) userLogoutBtn.addEventListener("click", logout);
    if (refreshUserApptsBtn) refreshUserApptsBtn.addEventListener("click", fetchUserAppointments);

    const userTabs = [
        { btnId: "userTabNewAppt", viewId: "userViewNewAppt" },
        { btnId: "userTabMyAppts", viewId: "userViewMyAppts" },
        { btnId: "userTabCalendar", viewId: "userViewCalendar" },
        { btnId: "userTabProfile", viewId: "userViewProfile" }
    ];

    userTabs.forEach(tab => {
        const btn = document.getElementById(tab.btnId);
        if (btn) {
            btn.addEventListener("click", () => switchUserSubView(tab.viewId));
        }
    });

    function switchUserSubView(targetViewId) {
        userTabs.forEach(t => {
            const btn = document.getElementById(t.btnId);
            const view = document.getElementById(t.viewId);
            if (btn && view) {
                if (t.viewId === targetViewId) {
                    btn.classList.add("active");
                    view.classList.remove("hidden");
                } else {
                    btn.classList.remove("active");
                    view.classList.add("hidden");
                }
            }
        });

        if (targetViewId === "userViewCalendar") {
            renderUserCalendar();
        }
    }

    if (userBookingForm) {
        userBookingForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const client_name = document.getElementById("bookName").value;
            const client_phone = document.getElementById("bookPhone").value;
            const service = document.getElementById("bookService").value;
            const appointment_date = document.getElementById("bookDate").value;
            const appointment_time = document.getElementById("bookTime").value;
            const remarks = document.getElementById("bookRemarks").value;

            try {
                const res = await fetch("/api/appointments", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${userToken}`
                    },
                    body: JSON.stringify({ client_name, client_phone, service, appointment_date, appointment_time, remarks })
                });
                const data = await res.json();

                if (res.ok) {
                    alert("✨ Appointment request submitted!");
                    userBookingForm.reset();
                    document.getElementById("bookName").value = currentUser.name;
                    document.getElementById("bookPhone").value = currentUser.phone;
                    fetchUserAppointments();
                    switchUserSubView("userViewMyAppts");
                } else {
                    alert(data.error || "Failed to book appointment.");
                }
            } catch (err) {
                alert("Server error.");
            }
        });
    }

    async function fetchUserAppointments() {
        try {
            const res = await fetch("/api/appointments", {
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            const data = await res.json();
            if (res.ok) {
                allAppointments = data.appointments;
                renderUserAppointmentsList(allAppointments);
            }
        } catch (err) {
            console.error("User appt error:", err);
        }
    }

    function renderUserAppointmentsList(appointments) {
        const container = document.getElementById("userAppointmentsContainer");
        if (!container) return;

        if (!appointments || appointments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 bg-[#FFF5F6] rounded-2xl border border-pink-100">
                    <i class="fa-regular fa-calendar-xmark text-3xl text-pink-300 mb-2"></i>
                    <p class="text-xs font-semibold text-gray-600">No appointments scheduled.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = appointments.map(app => {
            const badgeClass = getBadgeClass(app.status);
            return `
                <div class="bg-white p-4 rounded-2xl border border-pink-100 shadow-xs space-y-2.5">
                    <div class="flex items-center justify-between">
                        <span class="font-serif font-bold text-sm text-[#2C2627]">${escapeHTML(app.service)}</span>
                        <span class="badge-status ${badgeClass}">${escapeHTML(app.status)}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-[#FFF5F6] p-2.5 rounded-xl">
                        <div><i class="fa-regular fa-calendar text-[#D86B81] mr-1"></i> ${escapeHTML(app.appointment_date)}</div>
                        <div><i class="fa-regular fa-clock text-[#D86B81] mr-1"></i> ${formatTime(app.appointment_time)}</div>
                    </div>

                    ${app.remarks ? `<p class="text-[11px] text-gray-500"><span class="font-semibold text-gray-700">Your Remark:</span> "${escapeHTML(app.remarks)}"</p>` : ""}

                    ${app.admin_message ? `
                        <div class="bg-pink-50 border-l-4 border-[#D86B81] p-3 rounded-r-xl text-xs space-y-1">
                            <div class="flex items-center space-x-1 font-bold text-[#D86B81]">
                                <i class="fa-solid fa-comment-dots"></i>
                                <span>Note from Salon Manager:</span>
                            </div>
                            <p class="text-gray-700 italic">"${escapeHTML(app.admin_message)}"</p>
                        </div>
                    ` : ""}

                    <div class="text-right">
                        <button onclick="cancelAppointment(${app.id})" class="text-[10px] text-red-500 hover:text-red-700 font-semibold underline">Cancel Session</button>
                    </div>
                </div>
            `;
        }).join("");
    }

    const calPrevMonthBtn = document.getElementById("calPrevMonthBtn");
    const calNextMonthBtn = document.getElementById("calNextMonthBtn");

    if (calPrevMonthBtn) {
        calPrevMonthBtn.addEventListener("click", () => {
            calCurrentDate.setMonth(calCurrentDate.getMonth() - 1);
            renderUserCalendar();
        });
    }
    if (calNextMonthBtn) {
        calNextMonthBtn.addEventListener("click", () => {
            calCurrentDate.setMonth(calCurrentDate.getMonth() + 1);
            renderUserCalendar();
        });
    }

    function renderUserCalendar() {
        const grid = document.getElementById("userCalendarGrid");
        const title = document.getElementById("calMonthYearTitle");
        if (!grid || !title) return;

        const year = calCurrentDate.getFullYear();
        const month = calCurrentDate.getMonth();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        title.textContent = `${monthNames[month]} ${year}`;

        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();

        let html = `
            <div class="cal-grid">
                <div class="cal-header-cell">Sun</div>
                <div class="cal-header-cell">Mon</div>
                <div class="cal-header-cell">Tue</div>
                <div class="cal-header-cell">Wed</div>
                <div class="cal-header-cell">Thu</div>
                <div class="cal-header-cell">Fri</div>
                <div class="cal-header-cell">Sat</div>
            </div>
            <div class="cal-grid mt-1">
        `;

        for (let i = 0; i < firstDayIndex; i++) {
            html += `<div class="cal-day-cell other-month"></div>`;
        }

        const todayStr = new Date().toISOString().split("T")[0];

        for (let day = 1; day <= totalDays; day++) {
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dayStr === todayStr;
            const dayAppts = allAppointments.filter(a => a.appointment_date === dayStr);

            html += `
                <div class="cal-day-cell ${isToday ? 'today' : ''}">
                    <span class="font-bold text-[11px] text-gray-700">${day}</span>
                    <div class="space-y-1 mt-1">
                        ${dayAppts.map(a => `
                            <div class="cal-event-pill bg-pink-100 text-[#D86B81]" title="${escapeHTML(a.service)} (${a.status})">
                                ${escapeHTML(a.service)}
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        }

        html += `</div>`;
        grid.innerHTML = html;
    }

    if (updateProfileForm) {
        updateProfileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("profileNameInput").value;
            const phone = document.getElementById("profilePhoneInput").value;

            try {
                const res = await fetch("/api/users/profile", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${userToken}`
                    },
                    body: JSON.stringify({ name, phone })
                });
                const data = await res.json();
                if (res.ok) {
                    currentUser = data.user;
                    userToken = data.token;
                    localStorage.setItem("blush_token", userToken);
                    localStorage.setItem("blush_user", JSON.stringify(currentUser));
                    updateNavbar();
                    alert("✨ Profile updated!");
                } else {
                    alert(data.error || "Profile update failed.");
                }
            } catch (err) {
                alert("Server error.");
            }
        });
    }

    if (updatePasswordForm) {
        updatePasswordForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById("currentPasswordInput").value;
            const newPassword = document.getElementById("newPasswordInput").value;
            const confirmNewPassword = document.getElementById("confirmNewPasswordInput").value;

            if (newPassword !== confirmNewPassword) {
                return alert("New passwords do not match!");
            }

            try {
                const res = await fetch("/api/users/password", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${userToken}`
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const data = await res.json();
                if (res.ok) {
                    alert("🔐 Password updated!");
                    updatePasswordForm.reset();
                } else {
                    alert(data.error || "Password update failed.");
                }
            } catch (err) {
                alert("Server error.");
            }
        });
    }


    // ==========================================
    // 5. ADMIN DASHBOARD (RESTRICTED PERMISSION)
    // ==========================================
    const adminDashboardModal = document.getElementById("adminDashboardModal");
    const closeAdminDashboardBtn = document.getElementById("closeAdminDashboardBtn");
    const adminLogoutBtn = document.getElementById("adminLogoutBtn");

    function openAdminDashboard() {
        if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "superadmin")) return openAuthModal();
        adminDashboardModal.classList.remove("hidden");

        switchAdminTab("adminTabAppts", "adminPanelAppts");
        fetchAdminAppointments();
        fetchAdminServices();
        fetchAdminAnnouncements();
    }

    if (closeAdminDashboardBtn) closeAdminDashboardBtn.addEventListener("click", () => adminDashboardModal.classList.add("hidden"));
    if (adminLogoutBtn) adminLogoutBtn.addEventListener("click", logout);

    const adminTabs = [
        { btnId: "adminTabAppts", panelId: "adminPanelAppts" },
        { btnId: "adminTabServices", panelId: "adminPanelServices" },
        { btnId: "adminTabAnnouncements", panelId: "adminPanelAnnouncements" }
    ];

    adminTabs.forEach(t => {
        const btn = document.getElementById(t.btnId);
        if (btn) btn.addEventListener("click", () => switchAdminTab(t.btnId, t.panelId));
    });

    function switchAdminTab(targetBtnId, targetPanelId) {
        adminTabs.forEach(t => {
            const btn = document.getElementById(t.btnId);
            const panel = document.getElementById(t.panelId);
            if (btn && panel) {
                if (t.btnId === targetBtnId) {
                    btn.className = "adminNavTab py-2 text-[#D86B81] border-b-2 border-[#D86B81]";
                    panel.classList.remove("hidden");
                } else {
                    btn.className = "adminNavTab py-2 text-gray-400 border-b-2 border-transparent hover:text-gray-600";
                    panel.classList.add("hidden");
                }
            }
        });
    }

    const adminStatusFilter = document.getElementById("adminStatusFilter");
    const adminSearchInput = document.getElementById("adminSearchInput");

    if (adminStatusFilter) adminStatusFilter.addEventListener("change", renderAdminTable);
    if (adminSearchInput) adminSearchInput.addEventListener("input", renderAdminTable);

    async function fetchAdminAppointments() {
        try {
            const res = await fetch("/api/appointments", {
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            const data = await res.json();
            if (res.ok) {
                allAppointments = data.appointments;
                updateAdminCounters();
                renderAdminTable();
            }
        } catch (err) {
            console.error("Admin fetch appt error:", err);
        }
    }

    function updateAdminCounters() {
        document.getElementById("countTotal").textContent = allAppointments.length;
        document.getElementById("countPending").textContent = allAppointments.filter(a => a.status === "Pending").length;
        document.getElementById("countUpcoming").textContent = allAppointments.filter(a => a.status === "Upcoming" || a.status === "Accepted").length;
        document.getElementById("countCompleted").textContent = allAppointments.filter(a => a.status === "Completed").length;
        document.getElementById("countCancelled").textContent = allAppointments.filter(a => a.status === "Cancelled" || a.status === "Rejected").length;
    }

    function renderAdminTable() {
        const tableBody = document.getElementById("adminTableBody");
        if (!tableBody) return;

        const filter = adminStatusFilter ? adminStatusFilter.value : "ALL";
        const search = adminSearchInput ? adminSearchInput.value.toLowerCase().trim() : "";

        const filtered = allAppointments.filter(a => {
            const matchesStatus = filter === "ALL" || a.status === filter || (filter === "Upcoming" && a.status === "Accepted") || (filter === "Cancelled" && a.status === "Rejected");
            const matchesSearch = a.client_name.toLowerCase().includes(search) || a.service.toLowerCase().includes(search) || a.client_phone.toLowerCase().includes(search);
            return matchesStatus && matchesSearch;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-gray-400 text-xs">No matching appointments found.</td></tr>`;
            return;
        }

        tableBody.innerHTML = filtered.map(a => {
            const badge = getBadgeClass(a.status);
            return `
                <tr class="hover:bg-pink-50/50">
                    <td class="p-3"><span class="font-bold block">${escapeHTML(a.appointment_date)}</span><span class="text-[11px] text-gray-500">${formatTime(a.appointment_time)}</span></td>
                    <td class="p-3 font-semibold text-gray-900">${escapeHTML(a.client_name)}</td>
                    <td class="p-3 font-medium text-[#D86B81]">${escapeHTML(a.service)}</td>
                    <td class="p-3 text-gray-600">${escapeHTML(a.client_phone)}</td>
                    <td class="p-3"><span class="badge-status ${badge}">${escapeHTML(a.status)}</span></td>
                    <td class="p-3 max-w-xs">
                        ${a.remarks ? `<p class="text-[11px] text-gray-600 mb-1"><span class="font-bold">Client:</span> ${escapeHTML(a.remarks)}</p>` : ""}
                        ${a.admin_message ? `<p class="text-[11px] text-[#D86B81] font-semibold bg-pink-50 p-1.5 rounded-lg border border-pink-100"><i class="fa-solid fa-reply mr-1"></i> Admin: "${escapeHTML(a.admin_message)}"</p>` : `<span class="text-gray-400 text-[11px] italic">No note sent</span>`}
                    </td>
                    <td class="p-3 text-center">
                        <div class="flex items-center justify-center space-x-1">
                            <button onclick="updateApptStatus(${a.id}, 'Upcoming')" title="Accept" class="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs hover:bg-emerald-200"><i class="fa-solid fa-check"></i></button>
                            <button onclick="updateApptStatus(${a.id}, 'Cancelled')" title="Reject" class="p-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs hover:bg-rose-200"><i class="fa-solid fa-xmark"></i></button>
                            <button onclick="updateApptStatus(${a.id}, 'Completed')" title="Complete" class="p-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200"><i class="fa-solid fa-double-check"></i></button>
                            <button onclick="openAdminMessageModal(${a.id}, '${escapeHTML(a.client_name)}', '${escapeHTML(a.admin_message || '')}')" title="Send Note" class="p-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs hover:bg-amber-200"><i class="fa-regular fa-comment-dots"></i></button>
                            <button onclick="deleteAppt(${a.id})" title="Delete" class="p-1.5 bg-gray-100 text-gray-600 hover:text-red-600 rounded-lg text-xs"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    const addServiceForm = document.getElementById("addServiceForm");
    if (addServiceForm) {
        addServiceForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("serviceNameInput").value;
            const category = document.getElementById("serviceCatInput").value;
            const price = document.getElementById("servicePriceInput").value;
            const duration = document.getElementById("serviceDurationInput").value;
            const description = document.getElementById("serviceDescInput").value;

            try {
                const res = await fetch("/api/services", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${userToken}`
                    },
                    body: JSON.stringify({ name, category, price, duration, description })
                });
                const data = await res.json();
                if (res.ok) {
                    alert("💅 New Service added!");
                    addServiceForm.reset();
                    fetchPublicServices();
                    fetchAdminServices();
                } else {
                    alert(data.error || "Failed to add service.");
                }
            } catch (err) {
                alert("Server error.");
            }
        });
    }

    async function fetchAdminServices() {
        try {
            const res = await fetch("/api/services");
            const data = await res.json();
            if (res.ok) renderAdminServicesList(data.services);
        } catch (err) {
            console.error("Admin services fetch error:", err);
        }
    }

    function renderAdminServicesList(services) {
        const container = document.getElementById("adminServicesList");
        if (!container) return;

        container.innerHTML = services.map(s => `
            <div class="bg-white p-3.5 rounded-xl border border-pink-100 flex items-center justify-between shadow-xs">
                <div>
                    <h5 class="font-bold text-xs text-gray-900">${escapeHTML(s.name)}</h5>
                    <p class="text-[11px] text-gray-500">Rs. ${s.price} | ${escapeHTML(s.duration)} | ${escapeHTML(s.category)}</p>
                </div>
                <button onclick="deleteService(${s.id})" class="text-xs text-red-500 hover:text-red-700 font-semibold p-1"><i class="fa-regular fa-trash-can"></i></button>
            </div>
        `).join("");
    }

    window.deleteService = async function (id) {
        if (!confirm("Delete this service from catalog?")) return;
        try {
            const res = await fetch(`/api/services/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            if (res.ok) {
                fetchPublicServices();
                fetchAdminServices();
            }
        } catch (err) {
            alert("Delete failed.");
        }
    };

    const addAnnouncementForm = document.getElementById("addAnnouncementForm");
    if (addAnnouncementForm) {
        addAnnouncementForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const title = document.getElementById("annTitleInput").value;
            const content = document.getElementById("annContentInput").value;

            try {
                const res = await fetch("/api/announcements", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${userToken}`
                    },
                    body: JSON.stringify({ title, content })
                });
                const data = await res.json();
                if (res.ok) {
                    alert("📢 Announcement published!");
                    addAnnouncementForm.reset();
                    fetchAnnouncements();
                    fetchAdminAnnouncements();
                } else {
                    alert(data.error || "Failed to publish announcement.");
                }
            } catch (err) {
                alert("Server error.");
            }
        });
    }

    async function fetchAdminAnnouncements() {
        try {
            const res = await fetch("/api/announcements");
            const data = await res.json();
            if (res.ok) renderAdminAnnouncementsList(data.announcements);
        } catch (err) {
            console.error("Admin ann fetch error:", err);
        }
    }

    function renderAdminAnnouncementsList(items) {
        const container = document.getElementById("adminAnnouncementsList");
        if (!container) return;

        container.innerHTML = items.map(item => `
            <div class="bg-white p-3.5 rounded-xl border border-pink-100 flex items-center justify-between shadow-xs">
                <div>
                    <h5 class="font-bold text-xs text-gray-900">${escapeHTML(item.title)}</h5>
                    <p class="text-[11px] text-gray-600">${escapeHTML(item.content)}</p>
                    <span class="text-[10px] text-gray-400">${escapeHTML(item.date)}</span>
                </div>
                <button onclick="deleteAnnouncement(${item.id})" class="text-xs text-red-500 hover:text-red-700 font-semibold p-1"><i class="fa-regular fa-trash-can"></i></button>
            </div>
        `).join("");
    }

    window.deleteAnnouncement = async function (id) {
        if (!confirm("Delete announcement?")) return;
        try {
            const res = await fetch(`/api/announcements/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            if (res.ok) {
                fetchAnnouncements();
                fetchAdminAnnouncements();
            }
        } catch (err) {
            alert("Delete failed.");
        }
    };


    // ==========================================
    // 6. SUPER ADMIN SUITE (FULL ACCESS)
    // ==========================================
    const superAdminDashboardModal = document.getElementById("superAdminDashboardModal");
    const closeSuperAdminDashboardBtn = document.getElementById("closeSuperAdminDashboardBtn");
    const superAdminLogoutBtn = document.getElementById("superAdminLogoutBtn");

    function openSuperAdminDashboard() {
        if (!currentUser || currentUser.role !== "superadmin") return openAuthModal();
        superAdminDashboardModal.classList.remove("hidden");

        switchSuperTab("superTabUsers", "superPanelUsers");
        fetchSuperAdminUsers();
        fetchSuperAdminProducts();
    }

    if (closeSuperAdminDashboardBtn) closeSuperAdminDashboardBtn.addEventListener("click", () => superAdminDashboardModal.classList.add("hidden"));
    if (superAdminLogoutBtn) superAdminLogoutBtn.addEventListener("click", logout);

    const superTabs = [
        { btnId: "superTabUsers", panelId: "superPanelUsers" },
        { btnId: "superTabProducts", panelId: "superPanelProducts" },
        { btnId: "superTabPass", panelId: "superPanelPass" }
    ];

    superTabs.forEach(t => {
        const btn = document.getElementById(t.btnId);
        if (btn) btn.addEventListener("click", () => switchSuperTab(t.btnId, t.panelId));
    });

    function switchSuperTab(targetBtnId, targetPanelId) {
        superTabs.forEach(t => {
            const btn = document.getElementById(t.btnId);
            const panel = document.getElementById(t.panelId);
            if (btn && panel) {
                if (t.btnId === targetBtnId) {
                    btn.className = "superNavTab py-2 text-purple-700 border-b-2 border-purple-700";
                    panel.classList.remove("hidden");
                } else {
                    btn.className = "superNavTab py-2 text-gray-400 border-b-2 border-transparent hover:text-gray-600";
                    panel.classList.add("hidden");
                }
            }
        });
    }

    async function fetchSuperAdminUsers() {
        try {
            const res = await fetch("/api/superadmin/users", {
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            const data = await res.json();
            if (res.ok) {
                allUsers = data.users;
                document.getElementById("totalUserCountTag").textContent = `${allUsers.length} Registered Accounts`;
                renderSuperUsersTable(allUsers);
                populateSuperResetUserSelect(allUsers);
            }
        } catch (err) {
            console.error("Superadmin users fetch error:", err);
        }
    }

    function renderSuperUsersTable(users) {
        const tbody = document.getElementById("superUsersTableBody");
        if (!tbody) return;

        tbody.innerHTML = users.map(u => `
            <tr class="hover:bg-purple-50/50">
                <td class="p-3 font-mono font-bold text-gray-500">#${u.id}</td>
                <td class="p-3 font-bold text-gray-900">${escapeHTML(u.name)}</td>
                <td class="p-3 font-mono text-gray-600">${escapeHTML(u.email)}</td>
                <td class="p-3 text-gray-600">${escapeHTML(u.phone)}</td>
                <td class="p-3">
                    <select onchange="updateUserRole(${u.id}, this.value)" class="px-2 py-1 text-xs rounded border border-purple-200 bg-white font-bold">
                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>User / Client</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Salon Admin</option>
                        <option value="superadmin" ${u.role === 'superadmin' ? 'selected' : ''}>Super Admin</option>
                    </select>
                </td>
                <td class="p-3 text-center">
                    <button onclick="deleteUserAccount(${u.id})" class="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded"><i class="fa-regular fa-trash-can mr-1"></i> Delete</button>
                </td>
            </tr>
        `).join("");
    }

    window.updateUserRole = async function (userId, role) {
        try {
            const res = await fetch(`/api/superadmin/users/${userId}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${userToken}`
                },
                body: JSON.stringify({ role })
            });
            if (res.ok) {
                alert(`Role updated to ${role}!`);
                fetchSuperAdminUsers();
            } else {
                alert("Failed to update role.");
            }
        } catch (err) {
            alert("Server error.");
        }
    };

    window.deleteUserAccount = async function (userId) {
        if (!confirm("Are you sure you want to delete this user account?")) return;
        try {
            const res = await fetch(`/api/superadmin/users/${userId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert("Account deleted.");
                fetchSuperAdminUsers();
            } else {
                alert(data.error || "Delete failed.");
            }
        } catch (err) {
            alert("Server error.");
        }
    };

    function populateSuperResetUserSelect(users) {
        const select = document.getElementById("superResetUserSelect");
        if (!select) return;
        select.innerHTML = users.map(u => `<option value="${u.id}">${escapeHTML(u.name)} (${escapeHTML(u.email)}) - Role: ${u.role}</option>`).join("");
    }

    const superResetPasswordForm = document.getElementById("superResetPasswordForm");
    if (superResetPasswordForm) {
        superResetPasswordForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const userId = document.getElementById("superResetUserSelect").value;
            const newPassword = document.getElementById("superNewPasswordInput").value;

            try {
                const res = await fetch(`/api/superadmin/users/${userId}/reset-password`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${userToken}`
                    },
                    body: JSON.stringify({ newPassword })
                });
                const data = await res.json();
                if (res.ok) {
                    alert("🔐 Password reset successfully!");
                    superResetPasswordForm.reset();
                } else {
                    alert(data.error || "Password reset failed.");
                }
            } catch (err) {
                alert("Server error.");
            }
        });
    }

    const addProductForm = document.getElementById("addProductForm");
    if (addProductForm) {
        addProductForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("prodNameInput").value;
            const category = document.getElementById("prodCatInput").value;
            const price = document.getElementById("prodPriceInput").value;
            const stock = document.getElementById("prodStockInput").value;
            const description = document.getElementById("prodDescInput").value;

            try {
                const res = await fetch("/api/products", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${userToken}`
                    },
                    body: JSON.stringify({ name, category, price, stock, description })
                });
                const data = await res.json();
                if (res.ok) {
                    alert("🛍️ Product added to inventory!");
                    addProductForm.reset();
                    fetchSuperAdminProducts();
                } else {
                    alert(data.error || "Failed to add product.");
                }
            } catch (err) {
                alert("Server error.");
            }
        });
    }

    async function fetchSuperAdminProducts() {
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            if (res.ok) {
                allProducts = data.products;
                renderSuperProductsGrid(allProducts);
            }
        } catch (err) {
            console.error("Products fetch error:", err);
        }
    }

    function renderSuperProductsGrid(products) {
        const grid = document.getElementById("superProductsGrid");
        if (!grid) return;

        grid.innerHTML = products.map(p => `
            <div class="bg-white p-3.5 rounded-2xl border border-purple-100 shadow-xs space-y-2">
                <div class="flex items-center justify-between">
                    <h5 class="font-bold text-xs text-gray-900">${escapeHTML(p.name)}</h5>
                    <span class="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">${escapeHTML(p.category)}</span>
                </div>
                <p class="text-[11px] text-gray-500">${escapeHTML(p.description || "Salon beauty product")}</p>
                <div class="flex items-center justify-between text-xs font-bold text-gray-800 pt-1">
                    <span>Rs. ${p.price}</span>
                    <span class="${p.stock < 10 ? 'text-red-500' : 'text-emerald-600'}">Stock: ${p.stock} units</span>
                </div>
                <div class="text-right pt-1">
                    <button onclick="deleteProductItem(${p.id})" class="text-xs text-red-500 hover:text-red-700 font-semibold"><i class="fa-regular fa-trash-can mr-1"></i> Delete</button>
                </div>
            </div>
        `).join("");
    }

    window.deleteProductItem = async function (id) {
        if (!confirm("Remove product from inventory catalog?")) return;
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            if (res.ok) fetchSuperAdminProducts();
        } catch (err) {
            alert("Delete failed.");
        }
    };


    // ==========================================
    // 7. ADMIN CUSTOM MESSAGE MODAL
    // ==========================================
    const adminMessageModal = document.getElementById("adminMessageModal");
    const closeAdminMessageModal = document.getElementById("closeAdminMessageModal");
    const adminMessageForm = document.getElementById("adminMessageForm");

    window.openAdminMessageModal = function (id, clientName, currentMsg) {
        document.getElementById("adminMsgApptId").value = id;
        document.getElementById("adminMsgModalClientInfo").textContent = `Client: ${clientName}`;
        document.getElementById("adminMessageText").value = currentMsg;
        adminMessageModal.classList.remove("hidden");
    };

    if (closeAdminMessageModal) closeAdminMessageModal.addEventListener("click", () => adminMessageModal.classList.add("hidden"));

    if (adminMessageForm) {
        adminMessageForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("adminMsgApptId").value;
            const admin_message = document.getElementById("adminMessageText").value;

            try {
                const res = await fetch(`/api/appointments/${id}/message`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${userToken}`
                    },
                    body: JSON.stringify({ admin_message })
                });

                if (res.ok) {
                    alert("✨ Custom note sent to client!");
                    adminMessageModal.classList.add("hidden");
                    fetchAdminAppointments();
                } else {
                    alert("Failed to send message.");
                }
            } catch (err) {
                alert("Server error.");
            }
        });
    }


    // Global Helper Actions
    window.updateApptStatus = async function (id, status) {
        try {
            const res = await fetch(`/api/appointments/${id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${userToken}`
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                fetchAdminAppointments();
            }
        } catch (err) {
            alert("Server error.");
        }
    };

    window.deleteAppt = async function (id) {
        if (!confirm("Delete appointment record?")) return;
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            if (res.ok) fetchAdminAppointments();
        } catch (err) {
            alert("Delete failed.");
        }
    };

    window.cancelAppointment = async function (id) {
        if (!confirm("Cancel appointment request?")) return;
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            if (res.ok) fetchUserAppointments();
        } catch (err) {
            alert("Cancel failed.");
        }
    };

    function closeAllModals() {
        if (authModal) authModal.classList.add("hidden");
        if (userDashboardModal) userDashboardModal.classList.add("hidden");
        if (adminDashboardModal) adminDashboardModal.classList.add("hidden");
        if (superAdminDashboardModal) superAdminDashboardModal.classList.add("hidden");
        if (adminMessageModal) adminMessageModal.classList.add("hidden");
    }

    function getBadgeClass(status) {
        const s = status ? status.toLowerCase() : "";
        if (s === "completed") return "badge-completed";
        if (s === "upcoming" || s === "accepted") return "badge-upcoming";
        if (s === "cancelled" || s === "rejected") return "badge-cancelled";
        return "badge-pending";
    }

    function getCategoryIcon(cat) {
        const c = cat ? cat.toLowerCase() : "";
        if (c.includes("hair")) return "fa-scissors";
        if (c.includes("skin") || c.includes("facial")) return "fa-face-smile-beam";
        if (c.includes("nail")) return "fa-hand-sparkles";
        if (c.includes("body") || c.includes("spa")) return "fa-hot-tub-person";
        return "fa-paint-brush";
    }

    function formatTime(timeStr) {
        if (!timeStr) return "";
        const parts = timeStr.split(":");
        let hours = parseInt(parts[0]);
        const minutes = parts[1] || "00";
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
    }

    function escapeHTML(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener("click", () => {
            mobileMenu.classList.toggle("hidden");
        });
    }

});
