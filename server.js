require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const app = express();
const port = process.env.PORT || 10000;

// Configuração de CORS
const corsOptions = {
  origin: 'http://20.206.161.75:8080', // Permitir apenas o domínio específico
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));

// Configuração do banco de dados
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    enableArithAbort: true,
  },
};

// Middleware para permitir JSON
app.use(express.json());

// Função para formatar o CNPJ
function formatCNPJ(cnpj) {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// Função para remover a pontuação do CNPJ
function limparDocumento(doc) {
  return doc.replace(/\D/g, ''); // Remove tudo que não for número
}

// Função para verificar se o CNPJ é alfanumérico
function isAlfanumero(cnpj) {
  return /[a-zA-Z]/.test(cnpj); // Verifica se há letras no CNPJ
}

// Logs em memória
let logs = [];

// Função para adicionar logs com horário de Brasília
function logToServer(message) {
  const timestamp = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  }); // Ajuste de fuso horário
  logs.push({ message, timestamp });

  // Limita a 100 logs
  if (logs.length > 100) {
    logs.shift();
  }
}

// Verificação de disponibilidade da API
let apiNotAvailable = false; // Variável fictícia para simular indisponibilidade do serviço

// Middleware para verificar se o serviço está disponível
app.use((req, res, next) => {
  if (apiNotAvailable) {
    return res.status(400).json({ erro: 'Serviço indisponível, tente novamente mais tarde.' });
  }
  next();
});

// Rota de consulta de revendas
app.get('/revendas/:documento(*)', async (req, res) => {
  try {
    await sql.connect(dbConfig);

    let documento = req.params.documento.trim();

    // Divide o texto em linhas (considerando 2 linhas)
    const linhas = documento.split(/\r?\n/);

    // Se existirem 2 linhas, a segunda linha deve ser o CNPJ
    const cnpjOriginal = linhas.length === 2 ? linhas[1].trim() : linhas[0].trim();

    // Verifica se o CNPJ é alfanumérico
    const documentoEhAlfanumerico = isAlfanumero(cnpjOriginal);

    // Se for alfanumérico, consulta o banco exatamente como foi enviado
    const documentoParaConsulta = documentoEhAlfanumerico ? cnpjOriginal : limparDocumento(cnpjOriginal); // Caso contrário, converte para consulta no banco

    // Log para registrar a consulta antes da busca
    logToServer(`Consultando CNPJ: ${documentoParaConsulta}`);

    // Consulta no banco de dados utilizando o CNPJ EXATAMENTE como recebido
    const result = await sql.query`SELECT Nome, [Razao Social], [CNPJ/doc], [Atendimento de Suporte], [Tipo Suporte], [Categoria], [Estado], [Mobuss], Obs FROM v_revendas_bugtracker WHERE [CNPJ/doc] = ${documentoParaConsulta}`;

    // Caso tenha encontrado o CNPJ no banco de dados
    if (result.recordset.length > 0) {
      result.recordset = result.recordset.map((item) => ({
        ...item,
        CNPJ_Comex: documentoEhAlfanumerico ? cnpjOriginal : null, // Exibe o CNPJ original alfanumérico na resposta
        'CNPJ/doc': limparDocumento(item['CNPJ/doc']), // Exibe o CNPJ sem pontuação no campo "CNPJ/doc"
        CNPJ_Formatado: formatCNPJ(limparDocumento(item['CNPJ/doc'])), // Exibe o CNPJ formatado no campo "CNPJ_Formatado"
        CNPJ_encontrado: true, // Indica que o CNPJ foi encontrado
      }));
      logToServer(`CNPJ encontrado: ${documentoParaConsulta}`);
      return res.json(result.recordset);
    } else {
      // Caso o CNPJ não seja encontrado no banco
      logToServer(`CNPJ não encontrado: ${documentoParaConsulta}`);
      return res.json({ CNPJ_encontrado: false });
    }
  } catch (err) {
    console.error('Erro na consulta:', err.message);
    logToServer(`Erro na consulta: ${err.message}`);

    // Captura erro de timeout e retorna 400 Bad Request
    if (err.code === 'ETIMEOUT') {
      return res.status(400).json({ erro: 'Tempo limite da solicitação excedido' });
    }

    // Retorna erro interno do servidor para outras falhas
    return res.status(500).send('Erro interno do servidor');
  } finally {
    sql.close();
  }
});

// Endpoint para retornar os logs
app.get('/logs', (req, res) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ logs });
});

// Endpoint para limpar os logs
app.delete('/logs', (req, res) => {
  logs = [];
  res.json({ message: 'Logs limpos com sucesso' });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
