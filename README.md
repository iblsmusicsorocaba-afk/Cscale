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
