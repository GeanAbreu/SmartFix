// ==========================================
// MÁSCARA DINÂMICA PARA LOGIN (CPF ou CNPJ)
// ==========================================
const formatIdentificador = (val) => {
    const num = val.replace(/\D/g, '');
    if (num.length <= 11) {
        return num.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2');
    } else {
        return num.slice(0, 14).replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // Referências aos elementos do HTML
    const form = document.getElementById("form-login");
    const identificador = document.getElementById("identificador");
    const senha = document.getElementById("senha");

    const btnSubmit = document.getElementById("btn-submit");
    const btnText = document.getElementById("btn-text");
    const btnSpinner = document.getElementById("btn-spinner");

    const modal = document.getElementById("feedback-modal");
    const modalIcon = document.getElementById("modal-icon-container");
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");
    const btnModalAction = document.getElementById("btn-modal-action");

    // ==========================================
    // VERIFICAÇÃO DE SESSÃO ATIVA
    // ==========================================
    // Como a autenticação é nas tabelas, usamos o localStorage para manter o cliente logado
    const usuarioSessao = localStorage.getItem("smartfix_user");
    if (usuarioSessao) {
        window.location.href = "cliente/dashboard.html";
    }

    // ==========================================
    // FUNÇÕES AUXILIARES DA INTERFACE
    // ==========================================
    function setError(id, message) {
        const errSpan = document.getElementById(`err-${id}`);
        if (errSpan) errSpan.textContent = message || "";
    }

    function clearErrors() {
        setError("identificador", "");
        setError("senha", "");
    }

    function showModal(type, title, message) {
        modal.classList.remove("hidden");
        modalTitle.textContent = title;
        modalMessage.textContent = message;

        if (type === "error") {
            modalIcon.innerHTML = `<svg width="50" height="50" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
            btnModalAction.textContent = "Tentar Novamente";
            btnModalAction.style.backgroundColor = "var(--orange-primary, #f37021)";
            btnModalAction.onclick = () => {
                modal.classList.add("hidden");
                senha.value = ""; 
                senha.focus();
            };
        }
    }

    // Aplica máscara se não for e-mail
    identificador.addEventListener("input", (e) => {
        const val = e.target.value;
        if (!val.includes('@') && /\d/.test(val)) {
            e.target.value = formatIdentificador(val);
        }
    });

    // Mostrar/Ocultar Senha
    const btnToggleSenha = document.getElementById("btn-toggle-senha");
    if (btnToggleSenha) {
        btnToggleSenha.addEventListener("click", function() {
            const isPass = senha.type === "password";
            senha.type = isPass ? "text" : "password";
            this.innerHTML = isPass 
                ? `<svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"></path></svg>`
                : `<svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        });
    }

    // ==========================================
    // ENVIO DO LOGIN (VALIDAÇÃO NO SUPABASE)
    // ==========================================
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearErrors();

        const idValue = identificador.value.trim();
        const passValue = senha.value;
        let isValid = true;

        if (!idValue) {
            setError("identificador", "Preencha com seu e-mail, CPF ou CNPJ");
            isValid = false;
        }

        if (!passValue) {
            setError("senha", "Digite sua senha");
            isValid = false;
        }

        if (!isValid) return;

        if (!window.supabase) {
            showModal("error", "Erro Interno", "Conexão com o banco falhou.");
            return;
        }

        btnSubmit.disabled = true;
        btnText.textContent = "Autenticando...";
        btnSpinner.classList.remove("hidden");

        try {
            const isEmail = idValue.includes('@');
            const docLimpo = idValue.replace(/\D/g, ''); // Tira pontos e traços
            
            let usuarioEncontrado = null;
            let tipoUsuario = null;

            if (isEmail) {
                // 1. Procura primeiro na tabela de Clientes pelo E-mail
                let { data: cliente } = await supabase.from('clients').select('*').eq('email', idValue).maybeSingle();
                
                if (cliente) {
                    usuarioEncontrado = cliente;
                    tipoUsuario = 'cliente';
                } else {
                    // 2. Se não achou em Clientes, procura em Parceiros pelo E-mail
                    let { data: parceiro } = await supabase.from('partner').select('*').eq('email', idValue).maybeSingle();
                    if (parceiro) {
                        usuarioEncontrado = parceiro;
                        tipoUsuario = 'parceiro';
                    }
                }
            } else {
                // Se for Número (CPF ou CNPJ)
                if (docLimpo.length <= 11) {
                    // Procura por CPF na tabela de clientes
                    let { data: cliente } = await supabase.from('clients').select('*').eq('cpf', docLimpo).maybeSingle();
                    if (cliente) {
                        usuarioEncontrado = cliente;
                        tipoUsuario = 'cliente';
                    }
                } else {
                    // Procura por CNPJ na tabela de parceiros
                    let { data: parceiro } = await supabase.from('partner').select('*').eq('cnpj', docLimpo).maybeSingle();
                    if (parceiro) {
                        usuarioEncontrado = parceiro;
                        tipoUsuario = 'parceiro';
                    }
                }
            }

            // ==========================================
            // VALIDA A SENHA
            // ==========================================
            if (!usuarioEncontrado) {
                throw new Error("Usuário não encontrado.");
            }

            if (usuarioEncontrado.senha !== passValue) {
                throw new Error("Senha incorreta.");
            }

            // ==========================================
            // LOGIN BEM SUCEDIDO!
            // ==========================================
            // Salva as informações do usuário no navegador (Sessão)
            const dadosSessao = {
                id: usuarioEncontrado.id,
                tipo: tipoUsuario,
                nome: usuarioEncontrado.nome || usuarioEncontrado.nome_fantasia,
                email: usuarioEncontrado.email
            };
            localStorage.setItem("smartfix_user", JSON.stringify(dadosSessao));

            // Redireciona para o Dashboard
            window.location.href = "cliente/dashboard.html";

        } catch (err) {
            console.error("Erro no login:", err.message);
            showModal("error", "Erro de Autenticação", "Usuário não cadastrado ou senha incorreta. Verifique os dados e tente novamente.");
        } finally {
            // Restaura o botão
            btnSubmit.disabled = false;
            btnText.textContent = "Entrar";
            btnSpinner.classList.add("hidden");
        }
    });
});
