const sideHeader = document.querySelector('.side-header');
const contexteSection = document.querySelector('#contexte');
const recordsSection = document.querySelector('#records');
const depenseSection = document.querySelector('#depenses');


window.addEventListener('scroll', () => {
  const contexteRect = contexteSection.getBoundingClientRect();
  const recordsRect = recordsSection.getBoundingClientRect();
  const depenseRect = depenseSection.getBoundingClientRect();



  if ((contexteRect.top <= window.innerHeight * 0.5 && contexteRect.bottom > 0) || 
      (recordsRect.top <= window.innerHeight && recordsRect.bottom > 0)
      (depenseRect.top <= window.innerHeight && depenseRect.bottom > 0)) {
    sideHeader.classList.add('visible');
  } else {
    sideHeader.classList.remove('visible');
  }
});

const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".side-header ul li a");

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.4 && rect.bottom > window.innerHeight * 0.4) {
      current = section.getAttribute("id");
    }
  });
  navLinks.forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active");
    }
  });
});

const recordsSwiper = new Swiper('.records-swiper', {
  direction: 'vertical',
  loop: true,
  slidesPerView: 1.6,
  centeredSlides: true,
  spaceBetween: 20,
  initialSlide: 1,
  autoplay: {
    delay: 2500, 
    disableOnInteraction: false, 
  },
  speed: 2500, 
  scrollbar: {
    el: '.swiper-scrollbar',
    draggable: true,
  },
});
