// ==========================================
// BLUSH & BRUSH - FULL-STACK CLIENT ENGINE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // Global State
    let currentUser = null;
    let userToken = localStorage.getItem("blush_token") || null;
    let allAppointments = [];

    // ==========================================
    // 1. STARTUP LOADER DISMISSAL
    // ==========================================
    const loader = document.getElementById("loader");
    if (loader) {
        setTimeout(() => {
            loader.classList.add("hidden");
        }, 2200); // Hide loader after 2.2 seconds
    }

    // ==========================================
    // 2. INITIALIZE AUTHENTICATION STATE
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
        alert("You have been logged out.");
    }

    function updateNavbar() {
        const navAuthContainer = document.getElementById("navAuthContainer");
        const mobileAuthContainer = document.getElementById("mobileAuthContainer");

        if (!currentUser) {
            // Logged Out State
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
        } else if (currentUser.role === "admin") {
            // Admin Logged In
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
            if (mobileAuthContainer) {
                mobileAuthContainer.innerHTML = `
                    <button id="mobileAdminDashboardBtn" class="w-full py-2 bg-[#D86B81] text-white text-xs font-semibold uppercase rounded-lg">Admin Dashboard</button>
                    <button id="mobileLogoutBtn" class="w-full mt-2 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg">Logout</button>
                `;
            }
        } else {
            // User Logged In
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
            if (mobileAuthContainer) {
                mobileAuthContainer.innerHTML = `
                    <button id="mobileUserDashboardBtn" class="w-full py-2 bg-[#D86B81] text-white text-xs font-semibold uppercase rounded-lg">My Dashboard</button>
                    <button id="mobileLogoutBtn" class="w-full mt-2 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg">Logout</button>
                `;
            }
        }

        bindDynamicNavEvents();
    }

    function bindDynamicNavEvents() {
        const openAuthBtn = document.getElementById("openAuthBtn");
        const mobileOpenAuthBtn = document.getElementById("mobileOpenAuthBtn");
        const logoutNavBtn = document.getElementById("logoutNavBtn");
        const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
        const openAdminDashboardNavBtn = document.getElementById("openAdminDashboardNavBtn");
        const mobileAdminDashboardBtn = document.getElementById("mobileAdminDashboardBtn");
        const openUserDashboardNavBtn = document.getElementById("openUserDashboardNavBtn");
        const mobileUserDashboardBtn = document.getElementById("mobileUserDashboardBtn");

        if (openAuthBtn) openAuthBtn.addEventListener("click", openAuthModal);
        if (mobileOpenAuthBtn) mobileOpenAuthBtn.addEventListener("click", openAuthModal);
        if (logoutNavBtn) logoutNavBtn.addEventListener("click", logout);
        if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", logout);
        if (openAdminDashboardNavBtn) openAdminDashboardNavBtn.addEventListener("click", openAdminDashboard);
        if (mobileAdminDashboardBtn) mobileAdminDashboardBtn.addEventListener("click", openAdminDashboard);
        if (openUserDashboardNavBtn) openUserDashboardNavBtn.addEventListener("click", openUserDashboard);
        if (mobileUserDashboardBtn) mobileUserDashboardBtn.addEventListener("click", openUserDashboard);

        document.querySelectorAll(".openBookingModalBtn").forEach(btn => {
            btn.addEventListener("click", () => {
                if (!currentUser) {
                    alert("Please login or signup to book an appointment.");
                    openAuthModal();
                } else if (currentUser.role === "admin") {
                    openAdminDashboard();
                } else {
                    openUserDashboard();
                }
            });
        });
    }


    // ==========================================
    // 3. AUTH MODAL & FORM HANDLERS
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

    if (closeAuthModal) {
        closeAuthModal.addEventListener("click", () => authModal.classList.add("hidden"));
    }

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

    // Toggle Password Visibility
    document.querySelectorAll(".togglePasswordBtn").forEach(btn => {
        btn.addEventListener("click", function () {
            const input = this.previousElementSibling;
            if (input.type === "password") {
                input.type = "text";
                this.innerHTML = `<i class="fa-regular fa-eye-slash"></i>`;
            } else {
                input.type = "password";
                this.innerHTML = `<i class="fa-regular fa-eye"></i>`;
            }
        });
    });

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

                    if (currentUser.role === "admin") {
                        openAdminDashboard();
                    } else {
                        openUserDashboard();
                    }
                } else {
                    errorMsg.textContent = data.error || "Login failed.";
                    errorMsg.classList.remove("hidden");
                }
            } catch (err) {
                errorMsg.textContent = "Server error. Please try again.";
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

                    alert(`Account created successfully! Welcome ${currentUser.name}`);
                    if (currentUser.role === "admin") {
                        openAdminDashboard();
                    } else {
                        openUserDashboard();
                    }
                } else {
                    errorMsg.textContent = data.error || "Registration failed.";
                    errorMsg.classList.remove("hidden");
                }
            } catch (err) {
                errorMsg.textContent = "Server error. Please try again.";
                errorMsg.classList.remove("hidden");
            }
        });
    }


    // ==========================================
    // 4. USER DASHBOARD & APPOINTMENT BOOKING
    // ==========================================
    const userDashboardModal = document.getElementById("userDashboardModal");
    const closeUserDashboardBtn = document.getElementById("closeUserDashboardBtn");
    const userBookingForm = document.getElementById("userBookingForm");
    const refreshUserApptsBtn = document.getElementById("refreshUserApptsBtn");
    const userLogoutBtn = document.getElementById("userLogoutBtn");

    function openUserDashboard() {
        if (!currentUser) return openAuthModal();
        userDashboardModal.classList.remove("hidden");
        document.getElementById("userNameHeader").textContent = `Welcome, ${currentUser.name}`;
        document.getElementById("userEmailHeader").textContent = `${currentUser.email} (${currentUser.phone})`;

        // Pre-fill booking form
        document.getElementById("bookName").value = currentUser.name;
        document.getElementById("bookPhone").value = currentUser.phone;
        
        // Default date to today
        const today = new Date().toISOString().split("T")[0];
        document.getElementById("bookDate").value = today;

        fetchUserAppointments();
    }

    if (closeUserDashboardBtn) closeUserDashboardBtn.addEventListener("click", () => userDashboardModal.classList.add("hidden"));
    if (userLogoutBtn) userLogoutBtn.addEventListener("click", logout);
    if (refreshUserApptsBtn) refreshUserApptsBtn.addEventListener("click", fetchUserAppointments);

    // Book Service Button click from landing page
    document.querySelectorAll(".bookServiceBtn").forEach(btn => {
        btn.addEventListener("click", function () {
            const serviceName = this.getAttribute("data-service");
            if (!currentUser) {
                alert(`Please login to book ${serviceName}.`);
                openAuthModal();
            } else {
                openUserDashboard();
                const bookServiceSelect = document.getElementById("bookService");
                if (bookServiceSelect) bookServiceSelect.value = serviceName;
            }
        });
    });

    // Submit Appointment (User)
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
                    alert("✨ Appointment request submitted! We will update your status shortly.");
                    userBookingForm.reset();
                    document.getElementById("bookName").value = currentUser.name;
                    document.getElementById("bookPhone").value = currentUser.phone;
                    fetchUserAppointments();
                } else {
                    alert(data.error || "Failed to book appointment.");
                }
            } catch (err) {
                alert("Server error while submitting appointment.");
            }
        });
    }

    async function fetchUserAppointments() {
        const container = document.getElementById("userAppointmentsContainer");
        if (!container) return;

        container.innerHTML = `<p class="text-xs text-gray-400 text-center py-6">Loading your appointments...</p>`;

        try {
            const res = await fetch("/api/appointments", {
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            const data = await res.json();

            if (res.ok) {
                renderUserAppointments(data.appointments);
            } else {
                container.innerHTML = `<p class="text-xs text-red-500 text-center py-4">Error loading appointments.</p>`;
            }
        } catch (err) {
            container.innerHTML = `<p class="text-xs text-red-500 text-center py-4">Server error.</p>`;
        }
    }

    function renderUserAppointments(appointments) {
        const container = document.getElementById("userAppointmentsContainer");
        if (!appointments || appointments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 bg-[#FFF5F6] rounded-2xl border border-pink-100">
                    <i class="fa-regular fa-calendar-xmark text-3xl text-pink-300 mb-2"></i>
                    <p class="text-xs font-semibold text-gray-600">No appointments booked yet.</p>
                    <p class="text-[11px] text-gray-400">Fill out the form on the left to schedule your session!</p>
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
                        <div>
                            <i class="fa-regular fa-calendar text-[#D86B81] mr-1"></i> ${escapeHTML(app.appointment_date)}
                        </div>
                        <div>
                            <i class="fa-regular fa-clock text-[#D86B81] mr-1"></i> ${formatTime(app.appointment_time)}
                        </div>
                    </div>

                    ${app.remarks ? `
                        <p class="text-[11px] text-gray-500">
                            <span class="font-semibold text-gray-700">Your Note:</span> "${escapeHTML(app.remarks)}"
                        </p>
                    ` : ""}

                    <!-- ADMIN CUSTOM MESSAGE HIGHLIGHT -->
                    ${app.admin_message ? `
                        <div class="bg-pink-50 border-l-4 border-[#D86B81] p-3 rounded-r-xl text-xs space-y-1">
                            <div class="flex items-center space-x-1 font-bold text-[#D86B81]">
                                <i class="fa-solid fa-comment-dots"></i>
                                <span>Message from Salon Admin:</span>
                            </div>
                            <p class="text-gray-700 italic">"${escapeHTML(app.admin_message)}"</p>
                        </div>
                    ` : ""}

                    <div class="text-right">
                        <button onclick="cancelAppointment(${app.id})" class="text-[10px] text-red-500 hover:text-red-700 font-semibold underline">
                            Cancel Request
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    }


    // ==========================================
    // 5. ADMIN DASHBOARD & CONTROLS
    // ==========================================
    const adminDashboardModal = document.getElementById("adminDashboardModal");
    const closeAdminDashboardBtn = document.getElementById("closeAdminDashboardBtn");
    const adminLogoutBtn = document.getElementById("adminLogoutBtn");
    const adminStatusFilter = document.getElementById("adminStatusFilter");
    const adminSearchInput = document.getElementById("adminSearchInput");
    const adminAddApptBtn = document.getElementById("adminAddApptBtn");

    function openAdminDashboard() {
        if (!currentUser || currentUser.role !== "admin") return openAuthModal();
        adminDashboardModal.classList.remove("hidden");

        const dateStr = new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById("adminDateDisplay").textContent = `Schedule overview for ${dateStr}`;

        fetchAdminAppointments();
    }

    if (closeAdminDashboardBtn) closeAdminDashboardBtn.addEventListener("click", () => adminDashboardModal.classList.add("hidden"));
    if (adminLogoutBtn) adminLogoutBtn.addEventListener("click", logout);
    if (adminStatusFilter) adminStatusFilter.addEventListener("change", renderAdminTable);
    if (adminSearchInput) adminSearchInput.addEventListener("input", renderAdminTable);
    if (adminAddApptBtn) adminAddApptBtn.addEventListener("click", () => openUserDashboard());

    async function fetchAdminAppointments() {
        try {
            const res = await fetch("/api/appointments", {
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            const data = await res.json();

            if (res.ok) {
                allAppointments = data.appointments;
                updateAdminSummaryCounters();
                renderAdminTable();
            } else {
                alert("Failed to fetch admin appointments.");
            }
        } catch (err) {
            console.error("Admin fetch error:", err);
        }
    }

    function updateAdminSummaryCounters() {
        const total = allAppointments.length;
        const pending = allAppointments.filter(a => a.status === "Pending").length;
        const upcoming = allAppointments.filter(a => a.status === "Upcoming" || a.status === "Accepted").length;
        const completed = allAppointments.filter(a => a.status === "Completed").length;
        const cancelled = allAppointments.filter(a => a.status === "Cancelled" || a.status === "Rejected").length;

        document.getElementById("countTotal").textContent = total;
        document.getElementById("countPending").textContent = pending;
        document.getElementById("countUpcoming").textContent = upcoming;
        document.getElementById("countCompleted").textContent = completed;
        document.getElementById("countCancelled").textContent = cancelled;
    }

    function renderAdminTable() {
        const tableBody = document.getElementById("adminTableBody");
        if (!tableBody) return;

        const filterStatus = adminStatusFilter ? adminStatusFilter.value : "ALL";
        const searchTerm = adminSearchInput ? adminSearchInput.value.toLowerCase().trim() : "";

        let filtered = allAppointments.filter(app => {
            const matchesStatus = filterStatus === "ALL" || app.status === filterStatus || (filterStatus === "Upcoming" && app.status === "Accepted") || (filterStatus === "Cancelled" && app.status === "Rejected");
            const matchesSearch = app.client_name.toLowerCase().includes(searchTerm) || app.service.toLowerCase().includes(searchTerm) || app.client_phone.toLowerCase().includes(searchTerm);
            return matchesStatus && matchesSearch;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8 text-gray-400 text-xs">
                        No appointments found matching your filters.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filtered.map(app => {
            const badgeClass = getBadgeClass(app.status);
            return `
                <tr class="hover:bg-pink-50/50 transition-colors">
                    <td class="p-3">
                        <span class="font-bold block">${escapeHTML(app.appointment_date)}</span>
                        <span class="text-[11px] text-gray-500">${formatTime(app.appointment_time)}</span>
                    </td>
                    <td class="p-3 font-semibold text-gray-900">${escapeHTML(app.client_name)}</td>
                    <td class="p-3 font-medium text-[#D86B81]">${escapeHTML(app.service)}</td>
                    <td class="p-3 text-gray-600">${escapeHTML(app.client_phone)}</td>
                    <td class="p-3">
                        <span class="badge-status ${badgeClass}">${escapeHTML(app.status)}</span>
                    </td>
                    <td class="p-3 max-w-xs">
                        ${app.remarks ? `<p class="text-[11px] text-gray-600 mb-1"><span class="font-bold">Client:</span> ${escapeHTML(app.remarks)}</p>` : ""}
                        ${app.admin_message ? `<p class="text-[11px] text-[#D86B81] font-semibold bg-pink-50 p-1.5 rounded-lg border border-pink-100"><i class="fa-solid fa-reply mr-1"></i> Admin: "${escapeHTML(app.admin_message)}"</p>` : `<span class="text-gray-400 text-[11px] italic">No admin message sent</span>`}
                    </td>
                    <td class="p-3 text-center">
                        <div class="flex items-center justify-center space-x-1.5">
                            <!-- Accept -->
                            <button onclick="updateApptStatus(${app.id}, 'Upcoming')" title="Accept / Approve" class="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs">
                                <i class="fa-solid fa-check"></i>
                            </button>
                            <!-- Reject -->
                            <button onclick="updateApptStatus(${app.id}, 'Cancelled')" title="Reject / Cancel" class="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                            <!-- Complete -->
                            <button onclick="updateApptStatus(${app.id}, 'Completed')" title="Mark Completed" class="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs">
                                <i class="fa-solid fa-double-check"></i>
                            </button>
                            <!-- Custom Message -->
                            <button onclick="openAdminMessageModal(${app.id}, '${escapeHTML(app.client_name)}', '${escapeHTML(app.admin_message || '')}')" title="Send Note to Client" class="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs">
                                <i class="fa-regular fa-comment-dots"></i>
                            </button>
                            <!-- Delete -->
                            <button onclick="deleteAppt(${app.id})" title="Delete Appointment" class="p-1.5 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-lg text-xs">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // UPDATE APPOINTMENT STATUS (Global Window function)
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
            } else {
                alert("Failed to update status.");
            }
        } catch (err) {
            alert("Server error.");
        }
    };

    // DELETE APPOINTMENT (Global Window function)
    window.deleteAppt = async function (id) {
        if (!confirm("Are you sure you want to delete this appointment record?")) return;
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            if (res.ok) {
                fetchAdminAppointments();
            }
        } catch (err) {
            alert("Delete failed.");
        }
    };

    // CANCEL APPOINTMENT FROM USER SIDE
    window.cancelAppointment = async function (id) {
        if (!confirm("Are you sure you want to cancel this appointment request?")) return;
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${userToken}` }
            });
            if (res.ok) {
                fetchUserAppointments();
            }
        } catch (err) {
            alert("Failed to cancel.");
        }
    };


    // ==========================================
    // 6. ADMIN CUSTOM MESSAGE MODAL
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
                    alert("✨ Custom note sent to client successfully!");
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


    // Helper Functions
    function closeAllModals() {
        if (authModal) authModal.classList.add("hidden");
        if (userDashboardModal) userDashboardModal.classList.add("hidden");
        if (adminDashboardModal) adminDashboardModal.classList.add("hidden");
        if (adminMessageModal) adminMessageModal.classList.add("hidden");
    }

    function getBadgeClass(status) {
        const s = status ? status.toLowerCase() : "";
        if (s === "completed") return "badge-completed";
        if (s === "upcoming" || s === "accepted") return "badge-upcoming";
        if (s === "cancelled" || s === "rejected") return "badge-cancelled";
        return "badge-pending";
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

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener("click", () => {
            mobileMenu.classList.toggle("hidden");
        });
    }

});
