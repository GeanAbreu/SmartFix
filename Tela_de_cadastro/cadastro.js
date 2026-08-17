import { supabase } from './supabase.js';

// ============================================================
// FORMATAÇÕES / MÁSCARAS (Versões Definitivas)
// ============================================================
const formatCPF = (val) => {
  return val
    .replace(/\D/g, '') // Remove tudo o que não é dígito
    .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto entre o 3º e o 4º dígitos
    .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto entre o 6º e o 7º dígitos
    .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca traço entre o 9º e o 10º dígitos
    .replace(/(-\d{2})\d+?$/, '$1'); // Impede a digitação de mais de 11 números
};

const formatCNPJ = (val) => {
  return val
    .replace(/\D/g, '') 
    .replace(/(\d{2})(\d)/, '$1.$2') 
    .replace(/(\d{3})(\d)/, '$1.$2') 
    .replace(/(\d{3})(\d)/, '$1/$2') 
    .replace(/(\d{4})(\d)/, '$1-$2') 
    .replace(/(-\d{2})\d+?$/, '$1');
};

const formatPhone = (val) => {
  let v = val.replace(/\D/g, '');
  if (v.length <= 10) {
    return v
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return v
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
};

const formatCEP = (val) => {
  return val
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

// ============================================================
// VALIDAÇÕES
// ============================================================
function validateCPF(cpf) {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum += parseInt(clean.substring(i - 1, i), 10) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(clean.substring(9, 10), 10)) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(clean.substring(i - 1, i), 10) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(clean.substring(10, 11), 10);
}

function validateCNPJ(cnpj) {
  const clean = cnpj.replace(/[^\d]+/g, '');
  if (clean.length !== 14 || !!clean.match(/(\d)\1{13}/)) return false;
  let tamanho = clean.length - 2;
  let numeros = clean.substring(0, tamanho);
  let digitos = clean.substring(tamanho);
  let soma = 0, pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) { soma += numeros.charAt(tamanho - i) * pos--; if (pos < 2) pos = 9; }
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(0)) return false;
  tamanho = tamanho + 1;
  numeros = clean.substring(0, tamanho);
  soma = 0; pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) { soma += numeros.charAt(tamanho - i) * pos--; if (pos < 2) pos = 9; }
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  return resultado == digitos.charAt(1);
}

// ============================================================
// DOM E LÓGICA PRINCIPAL
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-cadastro");
  const tipoUsuario = document.getElementById("tipoUsuario");
  const pjWarning = document.getElementById("pj-warning");
  const lblNome = document.getElementById("lbl-nome");
  const lblDocumento = document.getElementById("lbl-documento");
  const lblNascimento = document.getElementById("lbl-nascimento");
  const lblRua = document.getElementById("lbl-rua");

  const fields = {
    nomeCompleto: document.getElementById("nomeCompleto"),
    email: document.getElementById("email"),
    telefone: document.getElementById("telefone"),
    documento: document.getElementById("documento"),
    dataNascimento: document.getElementById("dataNascimento"),
    senha: document.getElementById("senha"),
    confirmarSenha: document.getElementById("confirmarSenha"),
    cep: document.getElementById("cep"),
    rua: document.getElementById("rua"),
    numero: document.getElementById("numero"),
    complemento: document.getElementById("complemento"),
    bairro: document.getElementById("bairro"),
    municipio: document.getElementById("municipio"),
    uf: document.getElementById("uf"),
  };

  const btnSubmit = document.getElementById("btn-submit");
  const btnText = document.getElementById("btn-text");
  const btnSpinner = document.getElementById("btn-spinner");
  const cepSpinner = document.getElementById("cep-spinner");

  const modal = document.getElementById("feedback-modal");
  const modalIcon = document.getElementById("modal-icon-container");
  const modalTitle = document.getElementById("modal-title");
  const modalMessage = document.getElementById("modal-message");
  const btnModalAction = document.getElementById("btn-modal-action");

  function setError(id, message) {
    const errSpan = document.getElementById(`err-${id}`);
    if (errSpan) errSpan.textContent = message || "";
  }

  function clearErrors() {
    Object.keys(fields).forEach((key) => setError(key, ""));
  }

  function showModal(type, title, message) {
    modal.classList.remove("hidden");
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    if (type === "success") {
      modalIcon.innerHTML = `<svg width="50" height="50" fill="none" stroke="#10b981" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
      btnModalAction.textContent = "Ir para o Login";
      btnModalAction.style.backgroundColor = "var(--blue-primary)";
      btnModalAction.onclick = () => window.location.href = "./login.html";
    } else {
      modalIcon.innerHTML = `<svg width="50" height="50" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
      btnModalAction.textContent = "Tentar Novamente";
      btnModalAction.style.backgroundColor = "var(--orange-primary)";
      btnModalAction.onclick = () => modal.classList.add("hidden");
    }
  }

  // Alternância Cliente / Parceiro
  tipoUsuario.addEventListener("change", (e) => {
    fields.documento.value = "";
    setError("documento", "");

    if (e.target.value === "parceiro") {
      pjWarning.classList.remove("hidden");
      lblNome.textContent = "Razão Social *";
      lblDocumento.textContent = "CNPJ *";
      fields.documento.placeholder = "00.000.000/0000-00";
      lblNascimento.textContent = "Fundação *";
      lblRua.textContent = "Endereço Comercial *";
    } else {
      pjWarning.classList.add("hidden");
      lblNome.textContent = "Nome Completo *";
      lblDocumento.textContent = "CPF *";
      fields.documento.placeholder = "000.000.000-00";
      lblNascimento.textContent = "Data Nasc. *";
      lblRua.textContent = "Logradouro / Rua *";
    }
  });

  // Eventos de Input para aplicar as Máscaras imediatamente
  fields.documento.addEventListener("input", (e) => {
    e.target.value = tipoUsuario.value === "parceiro" ? formatCNPJ(e.target.value) : formatCPF(e.target.value);
  });

  fields.telefone.addEventListener("input", (e) => {
    e.target.value = formatPhone(e.target.value);
  });

  fields.cep.addEventListener("input", async (e) => {
    e.target.value = formatCEP(e.target.value);
    const rawCep = e.target.value.replace(/\D/g, "");

    // Quando bater 8 números limpos, pesquisa na API
    if (rawCep.length === 8) {
      setError("cep", "");
      cepSpinner.classList.remove("hidden");

      try {
        const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
        const data = await res.json();

        if (data.erro) {
          setError("cep", "CEP não encontrado.");
          fields.rua.value = "";
          fields.bairro.value = "";
          fields.municipio.value = "";
          fields.uf.value = "";
        } else {
          fields.rua.value = data.logradouro || "";
          fields.bairro.value = data.bairro || "";
          fields.municipio.value = data.localidade || "";
          fields.uf.value = data.uf || "";

          // Avisa o navegador que esses campos foram preenchidos
          ['rua', 'bairro', 'municipio', 'uf'].forEach(name => {
            fields[name].dispatchEvent(new Event('input', { bubbles: true }));
            fields[name].dispatchEvent(new Event('change', { bubbles: true }));
          });

          fields.numero.focus();
        }
      } catch {
        setError("cep", "Erro ao consultar o CEP.");
      } finally {
        cepSpinner.classList.add("hidden");
      }
    }
  });

  // Alternar Visibilidade das Senhas
  const eyeOpenSVG = `<svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const eyeClosedSVG = `<svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"></path></svg>`;

  document.getElementById("btn-toggle-senha").addEventListener("click", function() {
    const isPass = fields.senha.type === "password";
    fields.senha.type = isPass ? "text" : "password";
    this.innerHTML = isPass ? eyeClosedSVG : eyeOpenSVG;
  });

  document.getElementById("btn-toggle-confirmar").addEventListener("click", function() {
    const isPass = fields.confirmarSenha.type === "password";
    fields.confirmarSenha.type = isPass ? "text" : "password";
    this.innerHTML = isPass ? eyeClosedSVG : eyeOpenSVG;
  });

  // Submissão do Formulário
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    let isValid = true;
    const isParceiro = tipoUsuario.value === "parceiro";

    if (fields.nomeCompleto.value.trim().length < 3) { setError("nomeCompleto", "Preenchimento obrigatório"); isValid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim())) { setError("email", "E-mail inválido"); isValid = false; }
    if (fields.telefone.value.length < 14) { setError("telefone", "Telefone incompleto"); isValid = false; }

    if (isParceiro) {
      if (!validateCNPJ(fields.documento.value)) { setError("documento", "CNPJ inválido"); isValid = false; }
    } else {
      if (!validateCPF(fields.documento.value)) { setError("documento", "CPF inválido"); isValid = false; }
    }

    if (!fields.dataNascimento.value) { 
      setError("dataNascimento", "Obrigatório"); 
      isValid = false; 
    } else if (!isParceiro) {
      const birth = new Date(fields.dataNascimento.value);
      let age = new Date().getFullYear() - birth.getFullYear();
      if (new Date().getMonth() < birth.getMonth() || (new Date().getMonth() === birth.getMonth() && new Date().getDate() < birth.getDate())) age--;
      if (age < 18) { setError("dataNascimento", "Mínimo 18 anos"); isValid = false; } 
    }

    const valSenha = fields.senha.value;
    if (valSenha.length < 8 || !/\d/.test(valSenha) || !/[^a-zA-Z0-9]/.test(valSenha)) {
      setError("senha", "Mínimo 8 caracteres, 1 número e 1 caractere especial"); 
      isValid = false;
    }
    if (fields.confirmarSenha.value !== valSenha) { 
      setError("confirmarSenha", "As senhas não conferem"); 
      isValid = false; 
    }

    if (fields.cep.value.length < 9) { setError("cep", "CEP incompleto"); isValid = false; }
    if (!fields.rua.value.trim()) { setError("rua", "Obrigatório"); isValid = false; }
    if (!fields.numero.value.trim()) { setError("numero", "Obrigatório"); isValid = false; }
    if (!fields.bairro.value.trim()) { setError("bairro", "Obrigatório"); isValid = false; }
    if (!fields.municipio.value.trim()) { setError("municipio", "Obrigatório"); isValid = false; }
    if (fields.uf.value.length !== 2) { setError("uf", "Obrigatório"); isValid = false; }

    if (!isValid) return;

    btnSubmit.disabled = true;
    btnText.textContent = "Criando conta...";
    btnSpinner.classList.remove("hidden");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fields.email.value.trim(),
        password: valSenha
      });

      if (authError) throw authError;

      const tableName = isParceiro ? "partner" : "clients";
      const docColumn = isParceiro ? "cnpj" : "cpf";

      if (authData.user) {
        const { error: profileError } = await supabase.from(tableName).insert([{
          id: authData.user.id,
          nome: fields.nomeCompleto.value.trim(),
          email: fields.email.value.trim(),
          telefone: fields.telefone.value.trim(),
          [docColumn]: fields.documento.value.replace(/\D/g, ''),
          data_nascimento: fields.dataNascimento.value,
          cep: fields.cep.value.replace(/\D/g, ''),
          logradouro: fields.rua.value.trim(),
          numero: fields.numero.value.trim(),
          complemento: fields.complemento.value.trim(),
          bairro: fields.bairro.value.trim(),
          municipio: fields.municipio.value.trim(),
          uf: fields.uf.value.trim()
        }]);

        if (profileError) throw profileError;

        showModal("success", "Tudo pronto!", "Sua conta foi cadastrada com sucesso.");
      }
    } catch (err) {
      showModal("error", "Erro ao cadastrar", err.message);
    } finally {
      btnSubmit.disabled = false;
      btnText.textContent = "Finalizar Cadastro";
      btnSpinner.classList.add("hidden");
    }
  });
});
