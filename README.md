# Frontend do Prioriza

Este é o frontend do Prioriza, meu projeto de gerenciamento de atividades.

Fiz essa parte para consumir a API do backend, permitir login, listar atividades, cadastrar, editar, filtrar e organizar as informações de um jeito simples e funcional.

O objetivo aqui não foi inventar moda, e sim montar uma interface que funcionasse bem no fluxo do sistema e conversasse direito com a API.

- **Backend:** Java 21, Spring Boot e PostgreSQL
- **Frontend:** React, Vite, TypeScript e Tailwind CSS
- **Deploy:** GitHub Pages no frontend e Render na API

---

## Acesso em produção

- **Frontend:** https://gustavomprado.github.io/task-manager-frontend/
- **API:** https://task-manager-api-njza.onrender.com
- **Health da API:** https://task-manager-api-njza.onrender.com/actuator/health

> Como a API está no plano gratuito do Render, a primeira requisição pode demorar um pouco quando o serviço fica parado.

---

## O que a aplicação faz

- login
- listagem de atividades
- cadastro de atividade
- edição de atividade
- exclusão de atividade
- busca por termo
- filtro por status
- filtro por prioridade
- paginação
- ordenação
- atualização rápida de status e prioridade pela lista

---

## Sobre a interface

No frontend, foquei principalmente em manter o fluxo de uso simples.

A ideia foi deixar a navegação direta e cuidar do básico que faz diferença no uso da aplicação, como feedback visual de carregamento, mensagens de sucesso e erro, proteção de rotas e tratamento de sessão expirada.

Quando a autenticação expira ou o token fica inválido, o usuário volta para a tela de login.

---

## Como rodar localmente

### Backend

    cd C:\workspace\springboot-api
    docker compose up -d --build

Resultado esperado:
- a API sobe localmente em `http://localhost:8081`

### Frontend

    cd C:\workspace\task-manager-frontend
    npm install
    npm run dev

Resultado esperado:
- o frontend sobe em `http://localhost:5173`

---

## Configuração

Em produção, o frontend usa esta variável para acessar a API:

    VITE_API_URL=https://task-manager-api-njza.onrender.com

No ambiente de desenvolvimento, as chamadas `/api/...` são redirecionadas pelo Vite para `http://localhost:8081`.

---

## Como testar

1. Abra o frontend em produção  
   https://gustavomprado.github.io/task-manager-frontend/

2. Faça login

3. Teste o fluxo de listagem, cadastro, edição, filtros e exclusão

4. Valide o comportamento de rota protegida  
   - sem token ou com token inválido, a aplicação volta para o login

---

## Capturas de tela

![Login](./screenshots/10-v2-login.png)
![Lista](./screenshots/11-v2-list.png)
![Criação com aviso](./screenshots/12-v2-create-toast.png)
![Sessão expirada](./screenshots/13-v2-session-expired.png)

---

## Repositórios

- **Backend:** https://github.com/GustavoMPrado/task-manager-api
- **Frontend:** https://github.com/GustavoMPrado/task-manager-frontend

---

## Contato

Gustavo Marinho Prado Alves  
GitHub: https://github.com/GustavoMPrado  
Email: gmarinhoprado@gmail.com






