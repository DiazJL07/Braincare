  
   const testimonials = [
            {
                text: "I've tried countless tea brands, but nothing compares to the freshness and aroma of this one. Every sip feels like a warm hug! My mornings are incomplete without it.",
                author: "Olivia Richardson",
                location: "New York, USA",
                avatar: "OR"
            },
            {
                text: "As a tea lover, I appreciate the rich flavors and organic ingredients. The chamomile blend has become my go-to for relaxation after a long day.",
                author: "Sophia Mitchell",
                location: "London, UK",
                avatar: "SM"
            },
            {
                text: "I never knew tea could taste this good! The flavors are so pure and soothing. Plus, the packaging is beautiful - perfect for gifting too!",
                author: "Aisha Khan",
                location: "London, UK",
                avatar: "AK"
            },
            {
                text: "The variety of blends is amazing! Whether I need a morning energy boost or a calming bedtime tea, this brand has it all. Highly recommend!",
                author: "Emily Sanders",
                location: "Sydney, Australia",
                avatar: "ES"
            },
            {
                text: "This tea has changed my daily routine for the better! The detox blend helps me feel refreshed and energized. Love the natural ingredients!",
                author: "Priya Deshmukh",
                location: "Mumbai, India",
                avatar: "PD"
            },
            {
                text: "I'm obsessed with the Earl Grey blend! It gives me the perfect morning boost and the jitters. A must-try for all tea enthusiasts.",
                author: "Mia Lawrence",
                location: "Toronto, Canada",
                avatar: "ML"
            },
            {
                text: "The quality is exceptional and the customer service is outstanding. Every order arrives fresh and perfectly packaged. Couldn't ask for more!",
                author: "James Wilson",
                location: "Melbourne, Australia",
                avatar: "JW"
            },
            {
                text: "From green tea to herbal blends, everything is absolutely delicious. The subscription service makes it so convenient to never run out!",
                author: "Isabella Garcia",
                location: "Madrid, Spain",
                avatar: "IG"
            }
        ];
  function createTestimonialCard(testimonial, index) {
            const cardClass = `card-${(index % 8) + 1}`;
            return `
                <div class="testimonial-card ${cardClass}">
                    <div class="testimonial-text">
                        "${testimonial.text}"
                    </div>
                    <div class="testimonial-author">
                        <div class="author-avatar">${testimonial.avatar}</div>
                        <div class="author-info">
                            <h4>${testimonial.author}</h4>
                            <p>${testimonial.location}</p>
                        </div>
                    </div>
                </div>
            `;
        }

        function populateRow(rowId, startIndex = 0) {
            const row = document.getElementById(rowId);
            let html = '';
            
            
            for (let i = 0; i < 16; i++) {
                const testimonialIndex = (startIndex + i) % testimonials.length;
                html += createTestimonialCard(testimonials[testimonialIndex], i);
            }
            
            row.innerHTML = html;
        }

        // Inicializar las filas
        populateRow('row1', 0); 
        populateRow('row2', 4); 