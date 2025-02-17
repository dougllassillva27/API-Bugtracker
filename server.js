require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const app = express();
const port = process.env.PORT || 10001;

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
let logs = [];

// Função para adicionar logs com horário de Brasília
function logToServer(message) {
    const timestamp = new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
    }); // Ajuste de fuso horário
    logs.push({ message, timestamp });

    // Limita a 100 logs
    if (logs.length > 100) {
        logs.shift();
    }
}

// Rota de consulta de revendas
app.get("/revendas/:documento(*)", async (req, res) => {
    try {
        await sql.connect(dbConfig);

        let documento = req.params.documento.trim();

        // Divide o texto em linhas
        const linhas = documento.split(/\r?\n/);

        // Procura a primeira linha que contém um possível CNPJ
        for (const linha of linhas) {
            const cnpjLimpo = limparDocumento(linha);

            // Aceita CNPJs entre 4 e 14 dígitos
            if (/^\d{4,14}$/.test(cnpjLimpo)) {
                documento = cnpjLimpo;
                break;
            }
        }


        // Verifica se o CNPJ é alfanumérico. Se for, mantém a pontuação
        const documentoSemPontuacao = isAlfanumero(documento)
            ? documento // Mantém o CNPJ alfanumérico
            : limparDocumento(documento); // Remove pontuação se não for alfanumérico

        // Verifica se o documento contém apenas números e tem o tamanho correto
        if (!/^\d{4,14}$/.test(documentoSemPontuacao) && !isAlfanumero(documento)) {
            logToServer(`CNPJ não encontrado: ${documento}`);
            return res.json({ CNPJ_encontrado: false });
        }

        // Log para registrar a consulta
        logToServer(`Consultando CNPJ: ${documento}`);

        // Consulta no banco de dados utilizando o CNPJ sem pontuação
        const result =
            await sql.query`SELECT Nome, [Razao Social], [CNPJ/doc], [Atendimento de Suporte], [Tipo Suporte], [Categoria], [Estado], [Mobuss], Obs FROM v_revendas_bugtracker WHERE [CNPJ/doc] = ${documentoSemPontuacao}`;

        // Caso tenha encontrado o CNPJ no banco de dados
        if (result.recordset.length > 0) {
            result.recordset = result.recordset.map((item) => ({
                ...item,
                CNPJ_Comex: isAlfanumero(documento) ? documento : null, // Exibe o CNPJ original alfanumérico na resposta
                "CNPJ/doc": limparDocumento(item["CNPJ/doc"]), // Exibe o CNPJ sem pontuação no campo "CNPJ/doc"
                CNPJ_Formatado: formatCNPJ(limparDocumento(item["CNPJ/doc"])), // Exibe o CNPJ formatado no campo "CNPJ_Formatado"
                CNPJ_encontrado: true, // Indica que o CNPJ foi encontrado
            }));
            logToServer(`CNPJ encontrado: ${documento}`);
            return res.json(result.recordset);
        } else {
            // Caso o CNPJ não seja encontrado no banco
            logToServer(`CNPJ não encontrado: ${documento}`);
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
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json({ logs });
});

// Endpoint para limpar os logs
app.delete("/logs", (req, res) => {
    logs = [];
    res.json({ message: "Logs limpos com sucesso" });
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`API rodando em http://localhost:${port}`);
});
