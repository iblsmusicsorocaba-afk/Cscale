# Gateway de WhatsApp por QR Code

Serviço privado para o C Scale. Utiliza a biblioteca Baileys (não oficial), que emula um aparelho conectado do WhatsApp Web. Pode ser instável e sujeito a políticas de uso da Meta. Preferir Cloud API oficial para envios em volume.

O QR de pareamento nunca é armazenado no banco. Autenticação fica exclusivamente no volume persistente em `/data/whatsapp`. O serviço **não tem domínio público** e só atende a chamadas autenticadas de dentro da rede privada Railway.

Variáveis obrigatórias: `WHATSAPP_GATEWAY_KEY` (chave forte, partilhada apenas com o backend web), `WHATSAPP_AUTH_DIR=/data/whatsapp`. Porta do Railway é a variável `PORT`.

`/status`, `/connect`, `/disconnect`, `/test` exigem bearer. O envio em lote (`/send`) fica intencionalmente desabilitado até configurar consentimento e regras para mensagens.
