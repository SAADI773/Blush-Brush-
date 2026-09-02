// ==========================================
// BLUSH & BRUSH - LOGIN JS
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const loginButton = document.querySelector(".login-button");
    const emailInput = document.querySelector("#email");
    const passwordInput = document.querySelector("#password");
    const loginForm = document.querySelector(".login-form");

    // Check if login button exists
    if (!loginButton) {
        console.log("Login button not found!");
        return;
    }


    // ==========================================
    // LOGIN BUTTON CLICK
    // ==========================================

    loginButton.addEventListener("click", function (event) {

        event.preventDefault();

        // Get values
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value.trim() : "";


        // ==========================================
        // CHECK EMAIL & PASSWORD
        // ==========================================

        if (email === "" || password === "") {

            alert("Please enter your email and password.");

            return;
        }


        // ==========================================
        // OPEN ADMIN PAGE
        // ==========================================

        window.location.href = "admin.html";

    });


    // ==========================================
    // ALSO HANDLE FORM SUBMIT
    // ==========================================

    if (loginForm) {

        loginForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const email = emailInput ? emailInput.value.trim() : "";
            const password = passwordInput ? passwordInput.value.trim() : "";


            if (email === "" || password === "") {

                alert("Please enter your email and password.");

                return;
            }


            // Open admin.html
            window.location.href = "admin.html";

        });

    }

});