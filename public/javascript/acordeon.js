document.addEventListener('DOMContentLoaded', function() {
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const question = item.querySelector('.accordion-question');
        const answer = item.querySelector('.accordion-answer');
        
        question.addEventListener('click', function() {
            // Cerrar todos los otros acordeones
            accordionItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.accordion-answer').style.maxHeight = '0';
                }
            });
            
            // Alternar el estado del acordeón actual
            item.classList.toggle('active');
            
            if (item.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                answer.style.maxHeight = '0';
            }
        });
    });
});