const parceiroId = "12345";

async function carregarParceiro() {
  try {
    const res = await fetch(`/api/admin/parceiros/${parceiroId}`);
    const dados = await res.json();
    
    // Atualiza o Nome na interface
    const elNome = document.getElementById("nomeParceiro");
    if (elNome && dados.nome) {
      elNome.innerText = dados.nome;
    }

    // Atualiza o Status na interface
    const elStatus = document.getElementById("statusAtual");
    if (elStatus) {
      elStatus.innerText = dados.status;
      if (dados.status === 'Ativo') elStatus.style.color = '#ff6b00';
    }

    // Atualiza o CNPJ na interface
    const elCnpj = document.getElementById("cnpjParceiro");
    if (elCnpj && dados.cnpj) {
      elCnpj.innerText = dados.cnpj;
    }
  } catch (error) {
    console.error("Erro ao carregar dados do parceiro:", error);
  }
}

async function processarStatus(novoStatus) {
  let motivo = '';
  if (novoStatus === 'Inativo') {
    motivo = prompt('Informe o motivo da recusa para o parceiro:');
    if (!motivo) return;
  }

  const elMensagem = document.getElementById("statusMessage");
  if (elMensagem) elMensagem.innerText = "Processando no servidor...";

  try {
    const response = await fetch(`/api/admin/parceiros/${parceiroId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus, motivoRecusa: motivo })
    });

    const resultado = await response.json();

    if (response.ok) {
      const elStatus = document.getElementById("statusAtual");
      if (elStatus) elStatus.innerText = resultado.parceiro.status;

      if (elMensagem) {
        if (novoStatus === 'Ativo') {
          if (elStatus) elStatus.style.color = '#ff6b00';
          elMensagem.innerText = "Parceiro APROVADO! Notificação enviada por e-mail.";
        } else {
          if (elStatus) elStatus.style.color = '#ffffff';
          elMensagem.innerText = "Parceiro RECUSADO! Notificação enviada por e-mail.";
        }
      }
    } else {
      if (elMensagem) elMensagem.innerText = resultado.erro || "Erro na solicitação.";
    }
  } catch (error) {
    if (elMensagem) elMensagem.innerText = "Falha de conexão com o servidor.";
  }
}

carregarParceiro();