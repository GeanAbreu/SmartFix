const CLIENTE_ID = 1;

const modal = document.getElementById("modal");
const form = document.getElementById("enderecoForm");
const lista = document.getElementById("listaEnderecos");
const mensagem = document.getElementById("mensagem");
const formErro = document.getElementById("formErro");
const modalTitulo = document.getElementById("modalTitulo");

const btnNovoEndereco = document.getElementById("btnNovoEndereco");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnCancelar = document.getElementById("btnCancelar");

const cepInput = document.getElementById("cep");
const cepStatus = document.getElementById("cepStatus");

let enderecos = [];

// ===============================
// Inicialização
// ===============================

document.addEventListener("DOMContentLoaded", carregarEnderecos);

async function carregarEnderecos() {
  try {
    const resposta = await fetch(`/api/clientes/${CLIENTE_ID}/enderecos`);

    if (!resposta.ok) {
      throw new Error("Não foi possível carregar os endereços.");
    }

    enderecos = await resposta.json();
    renderizarEnderecos();
  } catch (erro) {
    lista.innerHTML = `
      <div class="empty-state">
        Não foi possível carregar os endereços.
      </div>
    `;
  }
}

// ===============================
// Renderização
// ===============================

function renderizarEnderecos() {
  if (enderecos.length === 0) {
    lista.innerHTML = `
      <div class="empty-state">
        <h3>Nenhum endereço cadastrado</h3>
        <p>Adicione um endereço para utilizar os serviços de coleta e entrega.</p>
      </div>
    `;
    return;
  }

  lista.innerHTML = enderecos.map((endereco) => `
    <article class="address-card ${endereco.principal ? "principal" : ""}">
      <div class="address-top">
        <div class="address-title">
          <div class="address-icon" aria-hidden="true">
            ${iconeEndereco(endereco.tipo)}
          </div>

          <div>
            <h3>${escapeHtml(endereco.identificacao)}</h3>
            ${endereco.principal ? '<span class="badge">Principal</span>' : ""}
          </div>
        </div>
      </div>

      <div class="address-body">
        <p>
          <strong>${escapeHtml(endereco.logradouro)}, ${escapeHtml(endereco.numero)}</strong>
          ${endereco.complemento ? ` - ${escapeHtml(endereco.complemento)}` : ""}
        </p>
        <p>
          ${escapeHtml(endereco.bairro)} - ${escapeHtml(endereco.cidade)}/${escapeHtml(endereco.estado)}
        </p>
        <p>CEP: ${escapeHtml(endereco.cep)}</p>
      </div>

      <div class="address-actions">
        <button class="action-button" type="button"
                onclick="editarEndereco(${endereco.id})">
          Editar
        </button>

        ${!endereco.principal ? `
          <button class="action-button" type="button"
                  onclick="definirPrincipal(${endereco.id})">
            Tornar principal
          </button>
        ` : ""}

        <button class="action-button delete" type="button"
                onclick="excluirEndereco(${endereco.id})">
          Excluir
        </button>
      </div>
    </article>
  `).join("");
}

function iconeEndereco(tipo) {
  if (tipo === "Trabalho") return "🏢";
  if (tipo === "Outro") return "📍";
  return "🏠";
}

// ===============================
// Modal
// ===============================

btnNovoEndereco.addEventListener("click", () => abrirModal());

btnFecharModal.addEventListener("click", fecharModal);
btnCancelar.addEventListener("click", fecharModal);

document.querySelector("[data-close-modal]").addEventListener("click", fecharModal);

function abrirModal(endereco = null) {
  limparFormulario();

  if (endereco) {
    modalTitulo.textContent = "Editar endereço";

    document.getElementById("enderecoId").value = endereco.id;
    document.getElementById("identificacao").value = endereco.identificacao;
    document.getElementById("tipo").value = endereco.tipo;
    document.getElementById("cep").value = endereco.cep;
    document.getElementById("logradouro").value = endereco.logradouro;
    document.getElementById("numero").value = endereco.numero;
    document.getElementById("complemento").value = endereco.complemento;
    document.getElementById("bairro").value = endereco.bairro;
    document.getElementById("cidade").value = endereco.cidade;
    document.getElementById("estado").value = endereco.estado;
    document.getElementById("principal").checked = endereco.principal;
  } else {
    modalTitulo.textContent = "Adicionar endereço";
  }

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  document.getElementById("identificacao").focus();
}

function fecharModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function limparFormulario() {
  form.reset();
  document.getElementById("enderecoId").value = "";
  formErro.textContent = "";
  cepStatus.textContent = "";
  cepStatus.removeAttribute("style");
}

// ===============================
// CEP / ViaCEP
// ===============================

cepInput.addEventListener("input", () => {
  let valor = cepInput.value.replace(/\D/g, "");

  if (valor.length > 5) {
    valor = `${valor.substring(0, 5)}-${valor.substring(5, 8)}`;
  }

  cepInput.value = valor;

  const cepNumerico = valor.replace(/\D/g, "");

  if (cepNumerico.length === 8) {
    buscarCep(cepNumerico);
  }
});

async function buscarCep(cep) {
  cepStatus.textContent = "Buscando...";
  cepStatus.style.color = "#0756a8";

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

    if (!resposta.ok) {
      throw new Error("Erro na consulta do CEP.");
    }

    const dados = await resposta.json();

    if (dados.erro) {
      throw new Error("CEP não encontrado.");
    }

    document.getElementById("logradouro").value = dados.logradouro || "";
    document.getElementById("bairro").value = dados.bairro || "";
    document.getElementById("cidade").value = dados.localidade || "";
    document.getElementById("estado").value = dados.uf || "";

    cepStatus.textContent = "✓ Encontrado";
    cepStatus.style.color = "#15803d";

    // O número do imóvel não vem do ViaCEP.
    document.getElementById("numero").focus();
  } catch (erro) {
    cepStatus.textContent = "CEP inválido";
    cepStatus.style.color = "#dc2626";
  }
}

// ===============================
// Salvar
// ===============================

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formErro.textContent = "";

  const dados = {
    identificacao: document.getElementById("identificacao").value.trim(),
    tipo: document.getElementById("tipo").value,
    cep: document.getElementById("cep").value.trim(),
    logradouro: document.getElementById("logradouro").value.trim(),
    numero: document.getElementById("numero").value.trim(),
    complemento: document.getElementById("complemento").value.trim(),
    bairro: document.getElementById("bairro").value.trim(),
    cidade: document.getElementById("cidade").value.trim(),
    estado: document.getElementById("estado").value.trim().toUpperCase(),
    principal: document.getElementById("principal").checked
  };

  const validacao = validarEndereco(dados);

  if (validacao) {
    formErro.textContent = validacao;
    return;
  }

  const id = document.getElementById("enderecoId").value;

  try {
    const resposta = await fetch(
      id ? `/api/enderecos/${id}` : `/api/clientes/${CLIENTE_ID}/enderecos`,
      {
        method: id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
      }
    );

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado.mensagem || "Erro ao salvar endereço.");
    }

    fecharModal();
    await carregarEnderecos();

    mostrarMensagem(
      id ? "Endereço atualizado com sucesso!" : "Endereço cadastrado com sucesso!",
      "success"
    );
  } catch (erro) {
    formErro.textContent = erro.message;
  }
});

function validarEndereco(dados) {
  const cepNumerico = dados.cep.replace(/\D/g, "");

  if (cepNumerico.length !== 8) {
    return "Digite um CEP válido com 8 números.";
  }

  if (dados.identificacao.length < 2) {
    return "Informe uma identificação para o endereço.";
  }

  if (!dados.numero) {
    return "Informe o número do imóvel.";
  }

  if (!dados.logradouro || !dados.bairro || !dados.cidade || !dados.estado) {
    return "Preencha o endereço completo.";
  }

  return "";
}

// ===============================
// Editar
// ===============================

window.editarEndereco = function(id) {
  const endereco = enderecos.find((item) => item.id === id);

  if (endereco) {
    abrirModal(endereco);
  }
};

// ===============================
// Excluir
// ===============================

window.excluirEndereco = async function(id) {
  const endereco = enderecos.find((item) => item.id === id);

  if (!endereco) return;

  const confirmar = confirm(
    `Deseja realmente excluir o endereço "${endereco.identificacao}"?`
  );

  if (!confirmar) return;

  try {
    const resposta = await fetch(`/api/enderecos/${id}`, {
      method: "DELETE"
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado.mensagem || "Não foi possível excluir.");
    }

    await carregarEnderecos();
    mostrarMensagem("Endereço excluído com sucesso!", "success");
  } catch (erro) {
    mostrarMensagem(erro.message, "error");
  }
};

// ===============================
// Principal
// ===============================

window.definirPrincipal = async function(id) {
  try {
    const resposta = await fetch(`/api/enderecos/${id}/principal`, {
      method: "PATCH"
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado.mensagem || "Não foi possível definir o endereço.");
    }

    await carregarEnderecos();
    mostrarMensagem("Endereço definido como principal!", "success");
  } catch (erro) {
    mostrarMensagem(erro.message, "error");
  }
};

// ===============================
// Mensagens / Segurança
// ===============================

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `message show ${tipo}`;

  setTimeout(() => {
    mensagem.className = "message";
  }, 3500);
}

function escapeHtml(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}