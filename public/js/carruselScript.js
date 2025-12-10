let currentIndex = 0;
let items = document.querySelectorAll('.carousel-item');
let totalItems = items.length;
let autoSlideInterval;


function nextSlide() {
    currentIndex = (currentIndex + 1) % totalItems;
    updateCarousel();
}


function prevSlide() {
    currentIndex = (currentIndex - 1 + totalItems) % totalItems;
    updateCarousel();
}


function updateCarousel() {
    document.querySelector('.carousel-inner').style.transform = `translateX(-${currentIndex * 100}%)`;
}


function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 10000); 
}


function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}


document.querySelector('.prev').addEventListener('click', stopAutoSlide);
document.querySelector('.next').addEventListener('click', stopAutoSlide);


startAutoSlide();