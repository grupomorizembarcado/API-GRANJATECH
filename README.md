# API de Monitoramento de Silos e Métricas Ambientais

Esta é uma API RESTful construída com **Node.js**, **Express** e **Prisma ORM**, utilizando o **Supabase** como banco de dados PostgreSQL.

## 🚀 Configuração e Execução

### 1. Pré-requisitos

Certifique-se de ter o **Node.js** e o **npm** instalados.

### 2. Instalação

1.  **Clone ou baixe o projeto.**
2.  **Navegue até o diretório do projeto:**
    ```bash
    cd supabase-api-project
    ```
3.  **Instale as dependências:**
    ```bash
    npm install
    ```

### 3. Configuração do Banco de Dados

O projeto utiliza um arquivo `.env` para gerenciar a string de conexão com o banco de dados.

1.  **Edite o arquivo `.env`**
    A string de conexão completa já foi inserida, mas você deve garantir que ela esteja correta.

    **Conteúdo de `.env`:**
    ```
    DATABASE_URL="postgresql://postgres.ispucbxdeghcprtbmxwp:dblxOMi52gxIZELp@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
    ```

2.  **Sincronize o esquema do Prisma com o Supabase**
    Este comando irá criar as tabelas no seu banco de dados Supabase de acordo com o `schema.prisma`.

    ```bash
    npx prisma db push
    ```

### 4. Inicialização da API

Para iniciar o servidor da API, execute o script `start`:

```bash
npm start
```

A API estará rodando em `http://localhost:3000`.

## 📌 Rotas Disponíveis

A API possui as seguintes rotas:

| Método | Rota | Descrição | Corpo da Requisição (Exemplo) |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Rota padrão de status da API. | N/A |
| `POST` | `/barn` | Cria um novo Barn (Galpão) com Silo e Unidade Ambiental associados. | `{ "barn_name": "Barn Teste", "silo_sensor_code": "S-001", "env_sensor_code": "E-001" }` |
| `POST` | `/silo/reading` | Registra uma nova leitura de nível para um Silo. | `{ "silo_id": 1, "level_value": 150.5 }` |
| `GET` | `/silos` | Consulta todos os Silos e sua última leitura de nível. | N/A |
| `POST` | `/environment/reading` | Registra uma nova leitura de temperatura e umidade. | `{ "metrics_id": 1, "temperature": 25.3, "humidity": 65.8 }` |
| `GET` | `/environment` | Consulta todas as Unidades Ambientais e sua última leitura. | N/A |

---
*Desenvolvido com Node.js, Express e Prisma.*
