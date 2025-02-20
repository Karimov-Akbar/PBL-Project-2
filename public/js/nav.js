document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu()
})

function setupMobileMenu() {
  const burgerButton = document.querySelector(".burger-menu")
  const nav = document.querySelector("nav ul")
  const header = document.querySelector("header")

  if (!burgerButton || !nav || !header) {
    console.warn("Mobile menu elements not found. Skipping setup.")
    return
  }

  burgerButton.addEventListener("click", () => {
    nav.classList.toggle("active")
    burgerButton.classList.toggle("active")
    header.classList.toggle("nav-open")
  })

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!header.contains(e.target) && nav.classList.contains("active")) {
      nav.classList.remove("active")
      burgerButton.classList.remove("active")
      header.classList.remove("nav-open")
    }
  })

  // Close menu when clicking on a link
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("active")
      burgerButton.classList.remove("active")
      header.classList.remove("nav-open")
    })
  })
}

