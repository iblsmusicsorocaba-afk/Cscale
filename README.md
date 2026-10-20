# C Scale — Church Scale

Aplicação Next.js integrada ao Supabase, preparada para Railway. Igreja-piloto: Lagoinha.

## Funcionalidades da primeira versão
- Cadastro individual autenticado por e-mail e aprovação da liderança
- Disponibilidade semanal flexível e exceções
- Dez ministérios, funções por especialidade e controle de chegada/saída
- Cultos e geração assistida de escalas equilibradas
- Convocações individuais, revisão das respostas e exibição dos confirmados
- Registros de notificações pendentes no Supabase

## Configuração
Defina `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no Railway. O projeto Supabase utiliza RLS; jamais envie chaves de serviço para o cliente.

## Pendências antes de produção completa
Configurar o remetente e as URLs de autenticação no Supabase, integração WhatsApp Business API, substituição automática no backend, avisos automáticos e testes ponta a ponta. A criação e publicação de cultos depende do pastor.

## Autenticação por e-mail
No painel Supabase → Authentication → URL Configuration, configure:
- Site URL: https://cscale-web-production.up.railway.app
- Redirect URL: https://cscale-web-production.up.railway.app/**

O login usa um link no e-mail. A igreja deverá configurar as políticas de envio e o SMTP se necessário.

## WhatsApp
O banco tem a fila `notification_outbox` e gatilhos de convites, resumos e substituições. O envio real depende de configurar a WhatsApp Business Cloud API, seu token e modelos de mensagem aprovados; nenhuma mensagem é enviada sem essas credenciais.

## Testes
`npm test` executa testes unitários do algoritmo. `npm run build` valida o aplicativo.
