require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const app = express();
const port = process.env.PORT || 10000;

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

// Verificação de disponibilidade da API
let apiNotAvailable = false; // Variável fictícia para simular indisponibilidade do serviço

// Middleware para verificar se o serviço está disponível
app.use((req, res, next) => {
  if (apiNotAvailable) {
    return res
      .status(400)
      .json({ erro: "Serviço indisponível, tente novamente mais tarde." });
  }
  next();
});

// Rota de consulta de revendas
app.get("/revendas/:documento(*)", async (req, res) => {
  try {
    await sql.connect(dbConfig);

    let documento = req.params.documento.trim();

    // Divide o texto em linhas (considerando 2 linhas)
    const linhas = documento.split(/\r?\n/);

    // Se existirem 2 linhas, a segunda linha deve ser o CNPJ
    const cnpjOriginal =
      linhas.length === 2 ? linhas[1].trim() : linhas[0].trim();

    // Verifica se o CNPJ é alfanumérico
    const documentoEhAlfanumerico = isAlfanumero(cnpjOriginal);

    // Se for alfanumérico, consulta o banco exatamente como foi enviado
    const documentoParaConsulta = documentoEhAlfanumerico
      ? cnpjOriginal
      : limparDocumento(cnpjOriginal); // Caso contrário, converte para consulta no banco

    // Log para registrar a consulta antes da busca
    logToServer(`Consultando CNPJ: ${documentoParaConsulta}`);

    // Consulta no banco de dados utilizando o CNPJ EXATAMENTE como recebido
    const result =
      await sql.query`SELECT Nome, [Razao Social], [CNPJ/doc], [Atendimento de Suporte], [Tipo Suporte], [Categoria], [Estado], [Mobuss], Obs FROM v_revendas_bugtracker WHERE [CNPJ/doc] = ${documentoParaConsulta}`;

    // Caso tenha encontrado o CNPJ no banco de dados
    if (result.recordset.length > 0) {
      result.recordset = result.recordset.map((item) => ({
        ...item,
        CNPJ_Comex: documentoEhAlfanumerico ? cnpjOriginal : null, // Exibe o CNPJ original alfanumérico na resposta
        "CNPJ/doc": limparDocumento(item["CNPJ/doc"]), // Exibe o CNPJ sem pontuação no campo "CNPJ/doc"
        CNPJ_Formatado: formatCNPJ(limparDocumento(item["CNPJ/doc"])), // Exibe o CNPJ formatado no campo "CNPJ_Formatado"
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
    console.error("Erro na consulta:", err.message);
    logToServer(`Erro na consulta: ${err.message}`);

    // Captura erro de timeout e retorna 400 Bad Request
    if (err.code === "ETIMEOUT") {
      return res
        .status(400)
        .json({ erro: "Tempo limite da solicitação excedido" });
    }

    // Retorna erro interno do servidor para outras falhas
    return res.status(500).send("Erro interno do servidor");
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

// Endpoint separado para testes de pesquisa
app.get("/testes", async (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teste de Consulta</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 300px;
            text-align: center;
            transition: padding 0.3s ease, max-width 0.3s ease;
        }
        h2 {
            color: #333;
        }
        input, button {
            width: 90%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 16px;
        }
        button {
            background-color: #007bff;
            color: #fff;
            cursor: pointer;
            max-width: 38%;
        }
        button:hover {
            background-color: #0056b3;
        }
        .resultado {
            margin-top: 20px;
            padding: 10px;
            background: #e9ecef;
            border-radius: 5px;
            text-align: left;
            display: none;
            max-height: 600px;
            overflow-y: auto;
            white-space: pre-wrap;
            font-family: monospace;
            font-size: 14px;
            border: 1px solid #ccc;
            transition: max-height 0.3s ease;
        }
        .container.pesquisa-ativa {
            max-width: 900px;
            padding: 30px;
        }
        .resultado.mostrar {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Teste de Consulta</h2>
        <form id="consultaForm">
            <label for="documento">Digite o CNPJ (ou Nome: CNPJ):</label>
            <input type="text" id="documento" name="documento" required>
            <button type="submit">Consultar</button>
        </form>
        <div class="resultado" id="resultado"></div>
    </div>

    <script>
        document.getElementById("consultaForm").addEventListener("submit", async function(event) {
            event.preventDefault(); // Evita o envio do formulário que recarrega a página

            let documento = document.getElementById("documento").value.trim();
            const resultadoDiv = document.getElementById("resultado");
            const containerDiv = document.querySelector(".container");

            // Exibe a mensagem de carregamento
            resultadoDiv.style.display = "none";
            resultadoDiv.innerHTML = "Consultando...";

            // Verifica se o documento tem o formato "Nome: CNPJ"
            const partes = documento.split(":");
            if (partes.length === 2) {
                documento = partes[1].trim(); // Pega apenas o CNPJ após os dois pontos
            }

            // Limpeza do CNPJ (Remove tudo que não for número)
            documento = documento.replace(/\D/g, ""); // Remove tudo que não for número

            // Verifica se o CNPJ tem exatamente 14 dígitos após a limpeza
            if (documento.length !== 14) {
                resultadoDiv.style.display = "block";
                resultadoDiv.innerHTML = "<strong>CNPJ inválido. Certifique-se de que o CNPJ tenha 14 dígitos.</strong>";
                return;
            }

            try {
                // Realiza a consulta com o CNPJ limpo
                const response = await fetch("/revendas/" + encodeURIComponent(documento));

                console.log("Resposta recebida:", response);  // Verificação de resposta

                if (!response.ok) {
                    throw new Error("Erro ao consultar");
                }

                // Lê o corpo da resposta corretamente
                const data = await response.json();
                console.log("Dados recebidos:", data);  // Verificação dos dados

                // Verifica se o array de dados está vazio ou contém um resultado
                if (data && Array.isArray(data) && data.length > 0) {
                    // Expande o container e mostra os resultados
                    containerDiv.classList.add("pesquisa-ativa");  // Ajusta o tamanho do container
                    resultadoDiv.classList.add("mostrar");  // Exibe o resultado
                    resultadoDiv.style.display = "block";  // Assegura que o resultado será mostrado

                    // Exibe o primeiro item do array de dados
                    resultadoDiv.innerHTML = "<strong>Resultado:</strong><br><pre>" + JSON.stringify(data[0], null, 2) + "</pre>";
                } else {
                    resultadoDiv.innerHTML = "<strong>CNPJ não encontrado.</strong>";
                    resultadoDiv.style.display = "block";  // Assegura que a mensagem será exibida
                }
            } catch (error) {
                containerDiv.classList.add("pesquisa-ativa");
                resultadoDiv.classList.add("mostrar");
                resultadoDiv.innerHTML = "<strong>Erro na consulta. Tente novamente mais tarde.</strong>";
                resultadoDiv.style.display = "block";  // Assegura que a mensagem de erro será exibida
                console.error("Erro:", error);  // Log de erro para depuração
            }
        });
    </script>
</body>
</html>
    `);
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
