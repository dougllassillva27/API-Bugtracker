require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const app = express();
const port = process.env.PORT || 10001;

// Configuração do banco de dados
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // Exemplo: localhost ou IP
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false, // Defina como true se estiver usando Azure
    enableArithAbort: true,
  },
};

// Middleware para permitir JSON
app.use(express.json());

// Função para formatar o CNPJ
function formatCNPJ(cnpj) {
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

// Função para remover a pontuação do CNPJ
function limparDocumento(doc) {
  return doc.replace(/\D/g, ""); // Remove tudo que não for número
}

// Função para verificar se o CNPJ é alfanumérico
function isAlfanumero(cnpj) {
  return /[a-zA-Z]/.test(cnpj); // Verifica se há letras no CNPJ
}

// Logs em memória
let logs = []; // Array para armazenar logs temporários

// Função para adicionar logs
function logToServer(message) {
  logs.push({ message, timestamp: new Date() }); // Adiciona um timestamp para os logs
  // Limita a 100 logs, removendo o mais antigo caso o número de logs ultrapasse esse limite
  if (logs.length > 100) {
    logs.shift();
  }
}

// Rota de consulta de revendas
app.get("/revendas/:documento(*)", async (req, res) => {
  try {
    await sql.connect(dbConfig);

    const documento = req.params.documento;

    // Verifica se o CNPJ é alfanumérico. Se for, mantém a pontuação
    const documentoSemPontuacao = isAlfanumero(documento)
      ? documento // Mantém o CNPJ como está se for alfanumérico
      : limparDocumento(documento); // Remove pontuação se não for alfanumérico

    // Verifica se o documento resultante contém apenas números e tem o tamanho correto
    if (!/^\d{4,14}$/.test(documentoSemPontuacao) && !isAlfanumero(documento)) {
      logToServer(`CNPJ não encontrado: ${documento}`);
      return res.json({ CNPJ_encontrado: false });
    }

    // Log para verificar o valor do CNPJ antes de fazer a consulta
    logToServer(`Consultando CNPJ: ${documentoSemPontuacao}`);

    // Consulta o banco de dados, usando o CNPJ formatado ou alfanumérico
    const result =
      await sql.query`SELECT Nome, [Razao Social], [CNPJ/doc], [Atendimento de Suporte], [Tipo Suporte], [Categoria], [Estado], [Mobuss], Obs FROM v_revendas_bugtracker WHERE [CNPJ/doc] = ${documentoSemPontuacao}`;

    if (result.recordset.length > 0) {
      result.recordset = result.recordset.map((item) => ({
        ...item,
        CNPJ_Formatado: formatCNPJ(item["CNPJ/doc"]),
        CNPJ_encontrado: true,
      }));
      logToServer(`CNPJ encontrado: ${documentoSemPontuacao}`);
      return res.json(result.recordset);
    } else {
      logToServer(`CNPJ não encontrado: ${documentoSemPontuacao}`);
      return res.json({ CNPJ_encontrado: false });
    }
  } catch (err) {
    console.error("Erro na consulta:", err.message);
    logToServer(`Erro na consulta: ${err.message}`);
    res.status(500).send(err.message);
  } finally {
    sql.close();
  }
});

// Endpoint para retornar os logs
app.get("/logs", (req, res) => {
  // Impede cache no navegador
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({ logs }); // Retorna os logs mais recentes
});

// Endpoint para limpar os logs
app.delete("/logs", (req, res) => {
  logs = []; // Limpa todos os logs
  res.json({ message: "Logs limpos com sucesso" });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
