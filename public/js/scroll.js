let hidden = document.querySelectorAll(".hidden");
const observer = new IntersectionObserver((entries)=>{
    entries.forEach((entry)=>{
        entry.target.classList.toggle('mostrar', entry.isIntersecting);
    })
},{threshold: 0.25}
)
hidden.forEach((seccion)=>observer.observe(seccion));