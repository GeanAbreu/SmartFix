const faqItems = document.querySelectorAll(".faq-item");
const faqSearch = document.getElementById("faqSearch");
const talkButton = document.getElementById("talkButton");
const messages = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const attachButton = document.getElementById("attachButton");
const fileInput = document.getElementById("fileInput");

// Abre/fecha as perguntas frequentes
faqItems.forEach((item) => {
    const button = item.querySelector(".faq-question");

    button.addEventListener("click", () => {
        item.classList.toggle("open");
    });
});

// Pesquisa de perguntas frequentes
faqSearch.addEventListener("input", () => {
    const search = faqSearch.value.toLowerCase().trim();

    faqItems.forEach((item) => {
        const question = item.dataset.question.toLowerCase();

        item.style.display = question.includes(search) ? "block" : "none";
    });
});

// Botão "Falar com a assistência"
talkButton.addEventListener("click", () => {
    document.querySelector(".chat-panel").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    setTimeout(() => {
        messageInput.focus();
    }, 500);
});

// Envio de mensagem
chatForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = messageInput.value.trim();

    if (!text) return;

    addMessage(text, "sent");
    messageInput.value = "";

    // Simulação de resposta da assistência
    setTimeout(() => {
        addMessage(
            "Olá! Recebemos sua mensagem. Um atendente da TechFix Soluções responderá em breve. 😊",
            "received",
            true
        );
    }, 1000);
});

// Permite enviar pressionando Enter
messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        chatForm.requestSubmit();
    }
});

// Anexo
attachButton.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", () => {
    if (!fileInput.files.length) return;

    const fileName = fileInput.files[0].name;

    addMessage(`📎 Arquivo selecionado: ${fileName}`, "sent");
    fileInput.value = "";
});

// Cria uma nova mensagem no chat
function addMessage(text, type, isAssistant = false) {
    const message = document.createElement("div");
    message.classList.add("message", type);

    const now = new Date();
    const time = now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });

    if (isAssistant) {
        message.innerHTML = `
            <strong>TechFix Soluções</strong>
            <p>${escapeHTML(text)}</p>
            <time>${time}</time>
        `;
    } else {
        message.innerHTML = `
            <p>${escapeHTML(text)}</p>
            <time>${time} ✓✓</time>
        `;
    }

    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
}

// Evita inserir HTML digitado pelo usuário
function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Mantém o chat no final ao carregar
messages.scrollTop = messages.scrollHeight;
