# C Scale — Church Scale

Sistema de escalas para os ministérios da Lagoinha, desenvolvido com Next.js, Supabase e Railway.

## Funcionalidades

- Cadastro de voluntários, funções e disponibilidade flexível, incluindo madrugada
- Pastor: visão de toda a igreja; líderes: apenas seus ministérios
- Geração assistida de escalas, confirmação de convites e substituições
- Painel simplificado com relatórios opcionais
- Escalas visuais em cartões, com ocupação e nomes dos confirmados
- Demonstração interativa em `/demo`, sem compartilhar dados com a igreja real

## Autenticação

Login por e-mail e senha via Supabase Auth. As configurações de URL e confirmação de e-mail devem apontar para o domínio da implantação. O banco tem políticas RLS que separam os dados por igreja, líder e voluntário.

## WhatsApp da igreja: conectar via QR Code

No painel real do **pastor**, abra **WhatsApp** e clique em **Gerar QR Code**. Depois:

1. Abra o WhatsApp no celular com o número da igreja.
2. Entre em **Aparelhos conectados → Conectar aparelho**.
3. Escaneie o QR Code temporário exibido no C Scale.
4. Espere o status **Número conectado** e envie uma mensagem de teste para o próprio número, se desejar.

**Importante:** o QR Code é gerado durante o pareamento. Carregar uma imagem de QR Code de contato não conecta um número e não concede acesso para enviar mensagens.

A integração por QR usa um gateway de WhatsApp Web com Baileys, independente da API oficial. Ela pode ser interrompida ou restringida pelo WhatsApp; considere migrar para a WhatsApp Business Cloud API para envio contínuo. O QR nunca é guardado no banco, e as credenciais de sessão residem apenas no volume persistente do gateway.

### Estrutura

- `src/components/WhatsAppSettings.jsx`: painel pastoral do QR e estado da conexão
- `src/app/api/whatsapp/route.js`: proxy do backend que verifica, pelo Supabase, se o usuário confirmado é pastor
- `gateway/`: serviço Railway privado, sem domínio público, com sessão persistente em `/data/whatsapp`
- `church_whatsapp_settings`: tabela com RLS apenas para o pastor, cujo envio automático começa desabilitado

Variáveis Railway (servidor **somente**, sem prefixo `NEXT_PUBLIC_`):

- No app web: `WHATSAPP_GATEWAY_URL=http://cscale-whatsapp.railway.internal:3000`, `WHATSAPP_GATEWAY_KEY`
- No gateway: `WHATSAPP_GATEWAY_KEY`, `WHATSAPP_AUTH_DIR=/data/whatsapp`, `PORT=3000`

A mesma chave secreta deve existir nos dois serviços, **nunca** no GitHub. O gateway não expõe domínio público. Apenas pastores autenticados podem iniciar, visualizar e encerrar o pareamento.

**Mensagens automáticas para voluntários continuam desabilitadas.** A fila `notification_outbox` guarda eventos, mas ainda faltam regras de consentimento, disparo, segurança contra duplicações e revisão dos formatos das mensagens. A conexão do número não significa que envios automáticos já ocorram.

## Testes

`npm test` executa os testes unitários do algoritmo e da demonstração. `npm run build` valida a compilação Next.js. A validação ponta a ponta do QR depende de o pastor escanear o código com o celular real.

## Desenvolvimento

`/demo` é um simulador sem login, com personagens fictícios. Ele nunca tenta conectar o WhatsApp, nem grava convocações reais.
