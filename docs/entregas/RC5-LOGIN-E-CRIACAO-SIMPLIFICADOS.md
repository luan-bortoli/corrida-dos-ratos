# RC5 — Entrada simplificada para Administrador e Jogador

## Interface

- Tela com seleção **Sou Administrador** / **Sou Jogador**.
- Administrador: abas **Criar sala** (senha) e **Acessar sala** (código da sala + senha).
- Jogador: código da sala, nome, profissão e sonho para primeiro ingresso.
- Removidas as opções de recuperação visíveis na tela inicial.
- Mantido o tabuleiro homologado de 13×5, Mercado e cartas em modal.

## Regras de acesso

- O servidor só permite novos jogadores com a sala em estado `lobby`.
- O jogador que retorna no **mesmo navegador** com código e nome utiliza a credencial local preservada, sem alterar profissão, sonho ou progresso.
- Se usar **outro navegador ou dispositivo**, o nome e o código identificam a solicitação, mas **não autorizam a sessão por si mesmos**: o administrador deve aprovar a solicitação em "Solicitações de retorno". Somente depois o servidor emite uma nova credencial e invalida a anterior.
- O pedido de retorno é temporário (10 minutos) e a autorização ou recusa é realizada pelo administrador autenticado.
- O administrador pode acessar uma sala existente com código e senha `ADMIN_PASSWORD`. Isso substitui, na interface, o fluxo de recuperação por código, sem remover os endpoints antigos de recuperação para compatibilidade técnica.
- Sala iniciada não aceita ingressos novos; participantes previamente inscritos podem retornar.
- A saída não exclui o participante e a desistência continua definitiva.

## Avisos

- O retorno automático no mesmo navegador usa `localStorage` para uma credencial de sessão. Em dispositivos compartilhados, recomenda-se utilizar perfil privativo ou dedicado, já que dados locais podem permanecer disponíveis para outros usuários do mesmo navegador.
- Solicitações de retorno pendentes residem em memória e precisam ser refeitas se o servidor reiniciar.
- O login de administrador em sala existente substitui o token administrativo anterior.
- A compatibilidade com os endpoints antigos de recuperação foi mantida, mas não há controles de recuperação na tela inicial.

## Validação

- Suíte completa: **525/525 testes aprovados**.
- Incluídos quatro testes novos para login administrativo, bloqueio após início, autorização/recusa de retorno e estrutura da tela.
- Teste visual automatizado tentou abrir a aplicação local no Chromium, mas foi bloqueado pelo ambiente (`ERR_BLOCKED_BY_ADMINISTRATOR`). Homologação visual real pendente.
