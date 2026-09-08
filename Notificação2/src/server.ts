import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import path from 'path';

const app = express();
app.use(express.json());

// Serve os arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, '../public')));

interface Parceiro {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  status: 'Pendente' | 'Ativo' | 'Inativo';
}

interface StatusRequestBody {
  status: 'Ativo' | 'Inativo';
  motivoRecusa?: string;
}

// "Banco de dados" em memória com os dados atualizados
const parceirosDB: Parceiro[] = [
  {
    id: "12345",
    nome: "NETFIXER",
    cnpj: "12.345.678/0001-95",
    email: "contato@netfixer.com.br",
    status: "Pendente"
  }
];

// Instância do transporter do Nodemailer
let transporter: nodemailer.Transporter;

// Configuração automática de conta de testes do Ethereal
async function inicializarEmail(): Promise<void> {
  try {
    const contaTeste = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: contaTeste.user,
        pass: contaTeste.pass
      }
    });
    console.log('[E-MAIL] Conta de teste temporária criada e configurada com sucesso!');
  } catch (err) {
    console.error('[E-MAIL] Erro ao criar conta de teste no Ethereal:', err);
  }
}

// Inicializa o serviço de e-mail ao subir o servidor
inicializarEmail();

// Função responsável pelo envio da mensagem
async function enviarEmailNotificacao(destino: string, assunto: string, mensagem: string): Promise<void> {
  try {
    if (!transporter) {
      console.error("[ERRO E-MAIL] O serviço de e-mail ainda está inicializando. Tente novamente.");
      return;
    }

    const info = await transporter.sendMail({
      from: '"SmartFix Admin" <admin@smartfix.com>',
      to: destino,
      subject: assunto,
      text: mensagem
    });

    console.log(`\n==================================================`);
    console.log(`[E-MAIL ENVIADO] Notificação enviada para: ${destino}`);
    console.log(`[LINK PARA VISUALIZAR O E-MAIL]: ${nodemailer.getTestMessageUrl(info)}`);
    console.log(`==================================================\n`);
  } catch (error) {
    console.error("[ERRO E-MAIL] Falha ao enviar e-mail:", error);
  }
}

// Rota principal da aplicação
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Consulta de dados do parceiro
app.get('/api/admin/parceiros/:id', (req: Request<{ id: string }>, res: Response) => {
  const parceiro = parceirosDB.find(p => p.id === req.params.id);
  if (!parceiro) return res.status(404).json({ erro: "Parceiro não encontrado" });
  return res.json(parceiro);
});

// Alteração de status (Aprovação / Recusa)
app.patch('/api/admin/parceiros/:id/status', async (
  req: Request<{ id: string }, {}, StatusRequestBody>,
  res: Response
) => {
  const { id } = req.params;
  const { status, motivoRecusa } = req.body;

  const parceiro = parceirosDB.find(p => p.id === id);
  if (!parceiro) {
    return res.status(404).json({ erro: "Parceiro não encontrado." });
  }

  parceiro.status = status;

  if (status === 'Ativo') {
    await enviarEmailNotificacao(
      parceiro.email,
      'Credenciamento Aprovado - SmartFix',
      `Olá, ${parceiro.nome}!\n\nSeu credenciamento foi APROVADO com sucesso.`
    );
  } else {
    await enviarEmailNotificacao(
      parceiro.email,
      'Atualização do Credenciamento - SmartFix',
      `Olá, ${parceiro.nome}.\n\nSeu credenciamento foi RECUSADO.\nMotivo: ${motivoRecusa || 'Não informado.'}`
    );
  }

  return res.status(200).json({
    mensagem: "Status atualizado com sucesso.",
    parceiro: parceiro
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor TypeScript rodando em: http://localhost:${PORT}`);
});