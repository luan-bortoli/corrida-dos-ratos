# Execução e implantação controlada — v2.0 RC1

## Desenvolvimento / laboratório

Requisitos: Node.js 20+ e acesso ao terminal.

```bash
export ADMIN_PASSWORD='substitua-por-senha-forte'
export DATA_DIR='./dados-salas'
npm test
npm start
```

No PowerShell:

```powershell
$env:ADMIN_PASSWORD='substitua-por-senha-forte'
$env:DATA_DIR='./dados-salas'
npm test
npm start
```

Abra `http://localhost:3000/multiplayer.html`.

## Infraestrutura

- Usar **uma única instância** de Node.js atrás de HTTPS configurado no proxy reverso; a aplicação não gerencia TLS diretamente.
- Montar `DATA_DIR` em volume persistente com permissões restritas e backup automatizado.
- Fornecer senha docente por variável de ambiente, jamais no código-fonte ou repositório.
- O serviço responde a `GET /health` com JSON `{"status":"ok"}` para monitoramento.
- O controle de tentativas por IP é **em memória**, é reiniciado com o processo e não substitui WAF e proteção externa.
- Não disponibilizar este protótipo livremente na internet antes de atender aos bloqueadores de homologação documentados.
