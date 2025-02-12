# API de Consulta de Revendas

Esta é uma API simples construída com Express e SQL Server para consultar revendas usando o CNPJ. Ela também mantém um log das consultas e oferece endpoints para visualizar e limpar os logs.

## Funcionalidades

- **Consulta de Revendas**: A API permite que você consulte informações sobre uma revenda através do seu Documento de identificação (seja ele CNPJ, CPF ou número alfanumérico (para clientes do exterio)). O documento pode ser fornecido com ou sem pontuação. A consulta é realizada em um banco de dados **SQL Server**, que contém os dados das revendas, como nome, razão social, tipo de suporte, categoria, estado e observações.
- **Logs**: A API mantém um log das consultas realizadas, com informações sobre as consultas feitas e erros.
- **Limpeza de Logs**: A API oferece um endpoint para limpar os logs armazenados.

## Requisitos

Antes de executar a API, você precisa ter o seguinte instalado em sua máquina:

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- [SQL Server](https://www.microsoft.com/en-us/sql-server) configurado com as credenciais apropriadas
- Pacotes npm: `express`, `mssql`, `dotenv`

## Instalação

1. Clone o repositório ou baixe o código para sua máquina.
2. Instale as dependências necessárias:

```bash
npm install
```
