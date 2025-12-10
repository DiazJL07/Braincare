const carousel = document.querySelector('.carousel2');
const cards = carousel.querySelectorAll('.card2');
let scrollPosition = 0;
const cardWidth = cards[0].offsetWidth + 30; 
const visibleCards = Math.floor(carousel.clientWidth / cardWidth); 
const totalCards = cards.length;
const maxScrollPosition = (cardWidth * totalCards) - (visibleCards * cardWidth); 

function showNext() {
  scrollPosition += cardWidth * visibleCards; 
  if (scrollPosition > maxScrollPosition) {
    scrollPosition = 0; 
  }
  carousel.scrollTo({ left: scrollPosition, behavior: 'smooth' });
}

function showPrev() {
  scrollPosition -= cardWidth * visibleCards; 
  if (scrollPosition < 0) {
    scrollPosition = maxScrollPosition;
  }
  carousel.scrollTo({ left: scrollPosition, behavior: 'smooth' });
}

document.getElementById('next').addEventListener('click', showNext);
document.getElementById('prev').addEventListener('click', showPrev);