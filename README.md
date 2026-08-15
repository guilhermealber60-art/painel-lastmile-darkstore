# Painel Last Mile — Dark Store (Farmácias São João)

Painel operacional da Dark Store, no mesmo esquema do [painel da rede](https://guilhermealber60-art.github.io/painel-lastmile-saojoao/): processamento 100% local no navegador, dados acumulados entre importações e publicação direta no GitHub (via token pessoal, sem git/terminal).

Mantém todas as regras de cálculo do painel original da Dark Store (SLA, separação por modalidade/turno, diagnóstico colaborativo de atrasos), mudando apenas a forma de entrada de dados: em vez de 3 abas (Pedidos/Vtex/Eventos), agora usa as **2 mesmas bases do painel da rede — Orders (Abbiamo) e Report (VTEX)** — já que o Orders exportado inclui as colunas de evento (`order_last_dispatched_event_date` / `order_last_in_transit_event_date`) que antes vinham da aba Eventos separada.

## Como colocar no ar

1. **Criar o repositório no GitHub**
   - Crie um repositório **público** chamado `painel-lastmile-darkstore` na conta `guilhermealber60-art` (mesma conta do painel da rede).
   - Se preferir outro nome/conta, ajuste as constantes `GH_OWNER` / `GH_REPO` no topo do `<script>` do `index.html` antes de publicar.

2. **Subir os arquivos**
   - Suba `index.html` e `.nojekyll` (deste mesmo diretório) para a raiz do repositório — pode ser pelo `git push` ou arrastando os arquivos na própria interface do GitHub ("Add file" → "Upload files").
   - Não precisa criar a pasta `data/` manualmente: ela é criada automaticamente no primeiro "Publicar".

3. **Ativar o GitHub Pages**
   - No repositório: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
   - Depois de alguns minutos o painel fica em `https://guilhermealber60-art.github.io/painel-lastmile-darkstore/`.

4. **Configurar o token de publicação** (uma vez por navegador/pessoa)
   - Abra o painel publicado, clique em **⚙️** na barra superior.
   - Gere um token em `github.com/settings/tokens` — recomendado um **fine-grained token**, restrito ao repositório `painel-lastmile-darkstore`, com permissão só de **Contents: Read and write**, com data de expiração.
   - Cole o token e clique em **Salvar**. Ele fica salvo só no `localStorage` daquele navegador — nunca é enviado a mais ninguém além da API do GitHub.
   - Sem token configurado, o botão **Publicar** baixa os arquivos `.gz` para upload manual em `data/`.

## Uso do dia a dia

1. **📂 Atualizar dados** → selecione o CSV de **Orders (Abbiamo)** e/ou **Report (VTEX)** → **Processar e aplicar ao painel** (isso já atualiza a tela, mas só no seu navegador).
2. Feche o diálogo e clique em **Publicar** (ou **Publicar no GitHub**, se o token já estiver configurado) → agora fica visível para todo mundo com o link.
3. Os dados **acumulam** a cada importação (merge por número do pedido / Order) — pode importar um dia por vez ou o mês inteiro de uma vez.
4. Na virada do mês, use **Atualizar dados → Apagar acumulado** para zerar o acumulado local antes de importar o novo mês.
5. O **diagnóstico de atrasos** (motivo/plano de ação) é preenchido na tabela vermelha e publicado automaticamente no GitHub (com o token configurado) poucos segundos depois de parar de digitar — sincroniza entre todo mundo que abrir o link.

## Estrutura de dados publicada

```
data/
  orders.json.gz       # Orders acumulado (comprimido)
  report.json.gz       # Report acumulado, deduplicado por Order (comprimido)
  meta.json            # {updatedAt, updatedBy} da última publicação
  diagnostico.json     # diagnóstico colaborativo de atrasos (motivo/plano/autor)
```

## O que mudou em relação à versão anterior (Claude)

- **Armazenamento:** trocado `window.storage` (só funciona dentro do Claude) por GitHub — o painel agora funciona em qualquer navegador, hospedado no GitHub Pages.
- **Entrada de dados:** de 3 arquivos (Pedidos/Vtex/Eventos) para 2 (Orders/Report), mesmo formato do painel da rede — os horários de evento (coleta) agora vêm direto das colunas do Orders.
- **Tudo o resto é igual:** cálculo de SLA, separação, turno, DS, diagnóstico de atrasos, filtros, gráficos e exportações (Excel/imagem) seguem exatamente as mesmas regras do painel original da Dark Store.
