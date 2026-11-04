# RC5 — Visualização da senha do administrador

## Alteração

- O campo **Senha do administrador** possui botão de olho para alternar entre senha oculta e visível.
- O botão é do tipo `button`, não envia o formulário, tem nome acessível e mantém o foco e o valor digitado.
- A senha continua oculta por padrão.

## Configuração

A senha de criação/acesso administrativo é definida em `ADMIN_PASSWORD` no arquivo `.env` da raiz. O texto `SuaSenhaSegura123!` mencionado como exemplo **não é uma senha padrão**; só é válido se o arquivo `.env` contiver exatamente esse valor e o servidor tiver sido reiniciado.

Se não existir `.env`, copie `.env.example` para `.env` e edite a variável. A senha deve ter no mínimo 10 caracteres. Reinicie com `npm start`.

## Verificação

`npm test` — 532/532 testes aprovados, incluindo dois testes adicionais sobre o controle de visibilidade.
