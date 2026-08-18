# Worker de publicação (sem token no navegador)

Este Worker é o único lugar onde o token do GitHub fica guardado. O painel
(`index.html`) só sabe a URL dele — nunca o token. Isso permite que qualquer
pessoa com o link do painel clique em "Publicar" sem precisar configurar nada.

## Deploy (gratuito, ~5 minutos, só pelo navegador)

1. Crie uma conta em **https://dash.cloudflare.com/sign-up** (gratuita, se ainda não tiver).
2. No painel da Cloudflare, vá em **Workers & Pages** → **Create** → **Create Worker**.
3. Dê um nome (ex.: `painel-darkstore-publish`) e clique em **Deploy** (ele cria com um "Hello World" — tudo bem, vamos substituir).
4. Clique em **Edit code**. Apague todo o conteúdo do editor e cole o conteúdo do arquivo [`publish-worker.js`](publish-worker.js) (deste mesmo diretório).
5. Clique em **Deploy** (ou **Save and deploy**).
6. Volte para a página do Worker → aba **Settings** → **Variables and Secrets** → **Add**.
   - Tipo: **Secret**
   - Nome: `GITHUB_TOKEN`
   - Valor: um **fine-grained personal access token** do GitHub — crie um em
     **github.com/settings/tokens** → *Fine-grained tokens* → *Generate new token*:
     - Repository access: **Only select repositories** → `painel-lastmile-darkstore`
     - Permissions → Repository permissions → **Contents: Read and write**
     - Defina uma expiração (recomendado)
   - Salve.
7. Copie a URL pública do Worker, mostrada no topo da página (algo como
   `https://painel-darkstore-publish.<seu-subdominio>.workers.dev`).
8. No arquivo `index.html` do painel, ache a linha:
   ```js
   const PUBLISH_ENDPOINT = 'https://painel-darkstore-publish.SEU-SUBDOMINIO.workers.dev/publish';
   ```
   e troque pela URL copiada, **acrescentando `/publish` no final**. Faça commit e publique essa alteração do `index.html` (`git push`) — essa é a única parte manual, feita uma única vez pelo mantenedor do painel, não pelos usuários do dia a dia.

Pronto. A partir daí, qualquer pessoa que abrir o painel só precisa clicar em
**Publicar** — se o campo "Seu nome" estiver vazio, o painel pede o nome uma
vez e publica direto, sem token, sem download de arquivo, sem configuração.

## Por que isso é seguro

- O `GITHUB_TOKEN` fica só nesse Worker (nunca trafega para o navegador de quem usa o painel).
- O Worker só aceita escrever nos 4 arquivos esperados em `data/` (`ALLOWED_PATHS`) — não dá para usar esse endpoint para alterar outra coisa no repositório.
- O Worker só aceita chamadas com origem `https://guilhermealber60-art.github.io` (CORS) — isso não é uma barreira de segurança forte (qualquer um pode forjar o header `Origin` fora do navegador), mas evita uso casual fora do painel. A proteção real é o token nunca ser exposto e o escopo de escrita ser travado nos 4 arquivos de `data/`.
- Se em algum momento quiser revogar o acesso, é só apagar/expirar o token em `github.com/settings/tokens` — o Worker para de conseguir publicar até você colocar um novo.

## Se quiser trocar/revogar o token

Volte em Workers & Pages → seu Worker → Settings → Variables and Secrets →
edite `GITHUB_TOKEN` com um token novo. Não precisa mexer no `index.html`.
