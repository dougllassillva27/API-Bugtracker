# API de Consulta de Revendas

Esta é uma API simples construída com Express e SQL Server para consultar revendas usando o CNPJ. Ela também mantém um log das consultas e oferece endpoints para visualizar e limpar os logs.

## Funcionalidades

- **Consulta de Revendas**: A API permite que você consulte informações sobre uma revenda através do seu CNPJ. O CNPJ pode ser fornecido com ou sem pontuação.
- **Logs**: A API mantém um log das consultas realizadas, com informações sobre as consultas feitas e erros.
- **Limpeza de Logs**: A API oferece um endpoint para limpar os logs armazenados.

## Requisitos

Antes de executar a API, você precisa ter o seguinte instalado em sua máquina:

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- [SQL Server](https://www.microsoft.com/en-us/sql-server) configurado com as credenciais apropriadas

## Instalação

1. **Clone o repositório** para o seu ambiente local:

   ```bash
   git clone https://github.com/seu-usuario/repo.git
   cd repo
   ```
