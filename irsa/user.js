// ==========================================
// BLUSH & BRUSH
// USER DASHBOARD JAVASCRIPT
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // GET ELEMENTS
    // ==========================================

    const openBtn = document.getElementById("openAppointmentBtn");
    const closeBtn = document.getElementById("closeAppointmentBtn");
    const cancelBtn = document.getElementById("cancelAppointmentBtn");
    const overlay = document.getElementById("appointmentOverlay");
    const modal = document.getElementById("appointmentModal");
    const form = document.getElementById("appointmentForm");
    const tableBody = document.getElementById("appointmentsTableBody");


    // ==========================================
    // FORM INPUTS
    // ==========================================

    const clientPhone = document.getElementById("clientPhone");
    const service = document.getElementById("service");
    const appointmentDate = document.getElementById("appointmentDate");
    const appointmentTime = document.getElementById("appointmentTime");
    const remarks = document.getElementById("remarks");


    // ==========================================
    // CURRENT DATE
    // ==========================================

    const currentDate = document.getElementById("currentDate");
    const currentDay = document.getElementById("currentDay");

    const today = new Date();

    const dateOptions = { month: "long", day: "numeric", year: "numeric" };
    const dayOptions = { weekday: "long" };

    if (currentDate) {
        currentDate.textContent = today.toLocaleDateString("en-US", dateOptions);
    }

    if (currentDay) {
        currentDay.textContent = today.toLocaleDateString("en-US", dayOptions);
    }


    // ==========================================
    // OPEN BOOK APPOINTMENT MODAL
    // ==========================================

    if (openBtn) {
        openBtn.addEventListener("click", function () {
            overlay.classList.add("active");
            document.body.style.overflow = "hidden";

            setTimeout(function () {
                if (clientPhone) {
                    clientPhone.focus();
                }
            }, 200);
        });
    }


    // ==========================================
    // CLOSE MODAL
    // ==========================================

    function closeModal() {
        overlay.classList.remove("active");
        document.body.style.overflow = "";
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", closeModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", closeModal);
    }


    // ==========================================
    // CLICK OUTSIDE MODAL TO CLOSE
    // ==========================================

    if (overlay) {
        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) {
                closeModal();
            }
        });
    }


    // ==========================================
    // ESCAPE KEY TO CLOSE
    // ==========================================

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            if (overlay.classList.contains("active")) {
                closeModal();
            }
        }
    });


    // ==========================================
    // FORMAT TIME
    // ==========================================

    function formatTime(time) {
        if (!time) return "";

        const parts = time.split(":");
        let hours = parseInt(parts[0]);
        const minutes = parts[1];
        const ampm = hours >= 12 ? "PM" : "AM";

        hours = hours % 12;
        hours = hours ? hours : 12;

        return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
    }


    // ==========================================
    // FORMAT DATE
    // ==========================================

    function formatDate(date) {
        if (!date) return "";

        const selectedDate = new Date(date + "T00:00:00");

        return selectedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }


    // ==========================================
    // BOOK NEW APPOINTMENT
    // (status is always "Pending" — salon confirms later)
    // ==========================================

    if (form) {

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const phoneValue = clientPhone.value.trim();
            const serviceValue = service.value;
            const dateValue = appointmentDate.value;
            const timeValue = appointmentTime.value;
            const remarksValue = remarks.value.trim();


            // ======================================
            // VALIDATION
            // ======================================

            if (
                phoneValue === "" ||
                serviceValue === "" ||
                dateValue === "" ||
                timeValue === ""
            ) {
                alert("Please fill in all required details.");
                return;
            }


            // ======================================
            // FORMAT DATA
            // ======================================

            const formattedTime = formatTime(timeValue);
            const formattedDate = formatDate(dateValue);


            // ======================================
            // CREATE TABLE ROW
            // ======================================

            const newRow = document.createElement("tr");

            newRow.innerHTML = `
                <td class="appointment-time">${formattedDate}</td>
                <td>${formattedTime}</td>
                <td>${serviceValue}</td>
                <td><span class="status pending">Pending</span></td>
                <td>${remarksValue || "—"}</td>
            `;


            // ======================================
            // ADD ROW TO TABLE
            // ======================================

            tableBody.appendChild(newRow);


            // ======================================
            // UPDATE SUMMARY COUNTS
            // ======================================

            updateAppointmentCounts();


            // ======================================
            // SUCCESS MESSAGE
            // ======================================

            alert("Your appointment request has been sent! We'll confirm it shortly.");


            // ======================================
            // RESET FORM
            // ======================================

            form.reset();


            // ======================================
            // CLOSE MODAL
            // ======================================

            closeModal();
        });

    }


    // ==========================================
    // UPDATE SUMMARY COUNTS
    // (Total, Upcoming, Completed, Cancelled — 4 cards)
    // ==========================================

    function updateAppointmentCounts() {

        const rows = tableBody.querySelectorAll("tr");

        let completed = 0;
        let cancelled = 0;
        let upcoming = 0;

        rows.forEach(function (row) {
            const status = row.querySelector(".status");
            if (!status) return;

            if (status.classList.contains("completed")) {
                completed++;
            } else if (status.classList.contains("cancelled")) {
                cancelled++;
            } else if (
                status.classList.contains("upcoming") ||
                status.classList.contains("pending")
            ) {
                upcoming++;
            }
        });


        // ======================================
        // GET SUMMARY CARDS
        // ======================================

        const cards = document.querySelectorAll(".summary-card");

        if (cards.length >= 4) {

            const totalNumber = cards[0].querySelector(".summary-number");
            if (totalNumber) totalNumber.textContent = rows.length;

            const upcomingNumber = cards[1].querySelector(".summary-number");
            if (upcomingNumber) upcomingNumber.textContent = upcoming;

            const completedNumber = cards[2].querySelector(".summary-number");
            if (completedNumber) completedNumber.textContent = completed;

            const cancelledNumber = cards[3].querySelector(".summary-number");
            if (cancelledNumber) cancelledNumber.textContent = cancelled;

        }


        // ======================================
        // UPDATE APPOINTMENT COUNT
        // ======================================

        const appointmentCount = document.querySelector(".appointment-count");

        if (appointmentCount) {
            appointmentCount.textContent = `${rows.length} Appointments`;
        }

    }

});