interface ServiceReview {
  orderId: string;
  partnerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const ratingDescriptions: Record<number, string> = {
  1: "Muito insatisfeito 😞",
  2: "Insatisfeito 🙁",
  3: "Regular 😐",
  4: "Satisfeito 🙂",
  5: "Excelente! 😀"
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof (window as any).lucide !== 'undefined') {
    (window as any).lucide.createIcons();
  }

  const starButtons = document.querySelectorAll<HTMLButtonElement>('.star-btn');
  const selectedRatingInput = document.getElementById('selected-rating') as HTMLInputElement | null;
  const ratingLabel = document.getElementById('rating-label') as HTMLParagraphElement | null;
  const commentTextarea = document.getElementById('comment') as HTMLTextAreaElement | null;
  const charCount = document.getElementById('char-count') as HTMLSpanElement | null;
  const form = document.getElementById('review-form') as HTMLFormElement | null;

  let currentRating = 0;

  starButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const rating = Number(button.getAttribute('data-rating'));
      currentRating = rating;

      if (selectedRatingInput) selectedRatingInput.value = String(rating);
      if (ratingLabel) {
        ratingLabel.innerText = ratingDescriptions[rating] || "";
        ratingLabel.className = "text-center text-xs font-bold text-yellow-400 mt-2 h-4";
      }

      starButtons.forEach((btn, index) => {
        if (index < rating) {
          btn.classList.remove('text-gray-600');
          btn.classList.add('text-yellow-400');
        } else {
          btn.classList.remove('text-yellow-400');
          btn.classList.add('text-gray-600');
        }
      });
    });
  });

  commentTextarea?.addEventListener('input', () => {
    if (charCount) charCount.innerText = `${commentTextarea.value.length}/500`;
  });

  form?.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    if (currentRating === 0) {
      alert("Por favor, selecione ao menos uma estrela antes de enviar.");
      return;
    }

    const reviewData: ServiceReview = {
      orderId: "#OS-2026-8942",
      partnerName: "TechFix Express - Barueri",
      rating: currentRating,
      comment: commentTextarea?.value || "",
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('smartfix_last_review', JSON.stringify(reviewData));
    alert(`✅ Avaliação de ${currentRating} estrelas enviada com sucesso!`);
    window.location.href = '/dashboard.html';
  });
});