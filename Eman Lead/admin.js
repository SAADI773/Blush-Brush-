// ==========================================
// BLUSH & BRUSH
// ADMIN DASHBOARD JAVASCRIPT
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

    const clientName = document.getElementById("clientName");

    const clientPhone = document.getElementById("clientPhone");

    const service = document.getElementById("service");

    const appointmentDate = document.getElementById("appointmentDate");

    const appointmentTime = document.getElementById("appointmentTime");

    const appointmentStatus =
        document.getElementById("appointmentStatus");

    const remarks = document.getElementById("remarks");


    // ==========================================
    // CURRENT DATE
    // ==========================================

    const currentDate = document.getElementById("currentDate");

    const currentDay = document.getElementById("currentDay");


    const today = new Date();

    const dateOptions = {
        month: "long",
        day: "numeric",
        year: "numeric"
    };

    const dayOptions = {
        weekday: "long"
    };


    if (currentDate) {
        currentDate.textContent =
            today.toLocaleDateString("en-US", dateOptions);
    }


    if (currentDay) {
        currentDay.textContent =
            today.toLocaleDateString("en-US", dayOptions);
    }


    // ==========================================
    // OPEN ADD APPOINTMENT MODAL
    // ==========================================

    if (openBtn) {

        openBtn.addEventListener("click", function () {

            overlay.classList.add("active");

            document.body.style.overflow = "hidden";

            setTimeout(function () {

                if (clientName) {
                    clientName.focus();
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

        if (!time) {
            return "";
        }

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

        if (!date) {
            return "";
        }

        const selectedDate = new Date(date + "T00:00:00");

        return selectedDate.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

    }


    // ==========================================
    // CREATE STATUS CLASS
    // ==========================================

    function getStatusClass(status) {

        const statusLower = status.toLowerCase();

        if (statusLower === "completed") {

            return "completed";

        }

        if (statusLower === "cancelled") {

            return "cancelled";

        }

        if (statusLower === "upcoming") {

            return "upcoming";

        }

        return "pending";

    }


    // ==========================================
    // ADD NEW APPOINTMENT
    // ==========================================

    if (form) {

        form.addEventListener("submit", function (event) {

            event.preventDefault();


            // Get values

            const nameValue =
                clientName.value.trim();

            const phoneValue =
                clientPhone.value.trim();

            const serviceValue =
                service.value;

            const dateValue =
                appointmentDate.value;

            const timeValue =
                appointmentTime.value;

            const statusValue =
                appointmentStatus.value;

            const remarksValue =
                remarks.value.trim();


            // ======================================
            // VALIDATION
            // ======================================

            if (
                nameValue === "" ||
                phoneValue === "" ||
                serviceValue === "" ||
                dateValue === "" ||
                timeValue === ""
            ) {

                alert(
                    "Please fill in all required appointment details."
                );

                return;

            }


            // ======================================
            // FORMAT DATA
            // ======================================

            const formattedTime =
                formatTime(timeValue);

            const formattedDate =
                formatDate(dateValue);


            // ======================================
            // CREATE TABLE ROW
            // ======================================

            const newRow =
                document.createElement("tr");


            newRow.innerHTML = `

                <td class="appointment-time">

                    ${formattedTime}

                </td>


                <td>

                    ${nameValue}

                </td>


                <td>

                    ${serviceValue}

                </td>


                <td>

                    ${phoneValue}

                </td>


                <td>

                    <span class="status ${getStatusClass(statusValue)}">

                        ${statusValue}

                    </span>

                </td>


                <td>

                    ${remarksValue || "—"}

                </td>

            `;


            // ======================================
            // ADD ROW TO TABLE
            // ======================================

            tableBody.appendChild(newRow);


            // ======================================
            // UPDATE APPOINTMENT COUNTS
            // ======================================

            updateAppointmentCounts();


            // ======================================
            // SUCCESS MESSAGE
            // ======================================

            alert(
                `Appointment added successfully for ${nameValue}!`
            );


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
    // ==========================================

    function updateAppointmentCounts() {

        const rows =
            tableBody.querySelectorAll("tr");


        let completed = 0;

        let cancelled = 0;

        let pending = 0;

        let upcoming = 0;


        rows.forEach(function (row) {

            const status =
                row.querySelector(".status");


            if (!status) {
                return;
            }


            if (
                status.classList.contains("completed")
            ) {

                completed++;

            }


            else if (
                status.classList.contains("cancelled")
            ) {

                cancelled++;

            }


            else if (
                status.classList.contains("pending")
            ) {

                pending++;

            }


            else if (
                status.classList.contains("upcoming")
            ) {

                upcoming++;

            }

        });


        // ======================================
        // GET SUMMARY CARDS
        // ======================================

        const cards =
            document.querySelectorAll(".summary-card");


        if (cards.length >= 5) {

            // Total

            const totalNumber =
                cards[0].querySelector(".summary-number");

            if (totalNumber) {

                totalNumber.textContent =
                    rows.length;

            }


            // Today's appointments

            const todayNumber =
                cards[1].querySelector(".summary-number");

            if (todayNumber) {

                todayNumber.textContent =
                    rows.length;

            }


            // Completed

            const completedNumber =
                cards[2].querySelector(".summary-number");

            if (completedNumber) {

                completedNumber.textContent =
                    completed;

            }


            // Cancelled

            const cancelledNumber =
                cards[3].querySelector(".summary-number");

            if (cancelledNumber) {

                cancelledNumber.textContent =
                    cancelled;

            }


            // Pending

            const pendingNumber =
                cards[4].querySelector(".summary-number");

            if (pendingNumber) {

                pendingNumber.textContent =
                    pending;

            }

        }


        // ======================================
        // UPDATE APPOINTMENT COUNT
        // ======================================

        const appointmentCount =
            document.querySelector(".appointment-count");


        if (appointmentCount) {

            appointmentCount.textContent =
                `${rows.length} Appointments`;

        }

    }

});