// ==========================================
// RESEARCHHUB - MAIN CLIENT SCRIPT
// Handles: scroll reveal animations, navbar
// scroll effect, and animated stat counters
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------
    // Navbar scroll effect
    // ------------------------------------------

    const navbar = document.getElementById("mainNavbar");

    if (navbar) {

        window.addEventListener("scroll", () => {

            if (window.scrollY > 30) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }

        });

    }

    // ------------------------------------------
    // Scroll reveal animations
    // ------------------------------------------

    const revealEls = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window && revealEls.length) {

        const observer = new IntersectionObserver((entries) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {
                    entry.target.classList.add("in-view");
                    observer.unobserve(entry.target);
                }

            });

        }, { threshold: 0.12 });

        revealEls.forEach((el) => observer.observe(el));

    } else {

        // Fallback: just show everything
        revealEls.forEach((el) => el.classList.add("in-view"));

    }

    // ------------------------------------------
    // Animated stat counters
    // ------------------------------------------

    const counters = document.querySelectorAll(".counter");

    if (counters.length) {

        const animateCounter = (el) => {

            const target = parseInt(el.getAttribute("data-target"), 10) || 0;
            const duration = 1200;
            const start = performance.now();

            const step = (now) => {

                const progress = Math.min((now - start) / duration, 1);
                const value = Math.floor(progress * target);

                el.textContent = value;

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.textContent = target;
                }

            };

            requestAnimationFrame(step);

        };

        if ("IntersectionObserver" in window) {

            const counterObserver = new IntersectionObserver((entries) => {

                entries.forEach((entry) => {

                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        counterObserver.unobserve(entry.target);
                    }

                });

            }, { threshold: 0.4 });

            counters.forEach((el) => counterObserver.observe(el));

        } else {

            counters.forEach((el) => animateCounter(el));

        }

    }

    // ------------------------------------------
    // Auto-dismiss alerts after a few seconds
    // ------------------------------------------

    document.querySelectorAll(".alert").forEach((alertEl) => {

        setTimeout(() => {
            alertEl.style.transition = "opacity .5s ease";
            alertEl.style.opacity = "0";
            setTimeout(() => alertEl.remove(), 500);
        }, 6000);

    });

});
