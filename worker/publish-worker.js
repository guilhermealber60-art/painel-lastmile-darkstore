/* =====================================================================
   Worker de publicação — painel-lastmile-darkstore
   -----------------------------------------------------------------------
   Guarda o token do GitHub como secret no servidor (Cloudflare) e faz o
   commit em nome do painel. O navegador de quem clica em "Publicar" NUNCA
   vê esse token — só envia os arquivos já prontos (base64) para este
   endpoint, e o Worker é quem fala com a API do GitHub.

   Deploy (ver worker/README.md para o passo a passo completo):
     1. Cole este arquivo num Worker novo em workers.cloudflare.com.
     2. Em Settings → Variables and Secrets, adicione o secret GITHUB_TOKEN
        (um fine-grained personal access token do GitHub, restrito a este
        repositório, com permissão Contents: Read and write).
     3. Deploy. Copie a URL do Worker (ex.: https://xxxx.workers.dev) e
        cole em PUBLISH_ENDPOINT no index.html do painel, terminando em
        "/publish".
===================================================================== */

const GH_OWNER = 'guilhermealber60-art';
const GH_REPO = 'painel-lastmile-darkstore';
const GH_BRANCH = 'main';

// Only these paths may be written — the client can never make this Worker
// touch anything else in the repo (e.g. the site's own index.html).
const ALLOWED_PATHS = new Set([
  'data/orders.json.gz',
  'data/report.json.gz',
  'data/meta.json',
  'data/diagnostico.json',
]);

// Restrict which origin is allowed to call this Worker (the published GitHub Pages site).
const ALLOWED_ORIGIN = 'https://guilhermealber60-art.github.io';

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Método não permitido' }, 405, corsHeaders);
    }

    const token = env.GITHUB_TOKEN;
    if (!token) {
      return json({ ok: false, error: 'Worker sem GITHUB_TOKEN configurado' }, 500, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ ok: false, error: 'JSON inválido' }, 400, corsHeaders);
    }

    const files = Array.isArray(body && body.files) ? body.files : [];
    const message = (body && body.message) || 'Atualiza painel Dark Store';
    if (!files.length) {
      return json({ ok: false, error: 'Nenhum arquivo enviado' }, 400, corsHeaders);
    }
    for (const f of files) {
      if (!f || !ALLOWED_PATHS.has(f.path) || typeof f.contentB64 !== 'string' || !f.contentB64) {
        return json({ ok: false, error: `Arquivo inválido ou não permitido: ${f && f.path}` }, 400, corsHeaders);
      }
    }

    try {
      const commitSha = await publishToGitHub(token, files, message);
      return json({ ok: true, commit: commitSha }, 200, corsHeaders);
    } catch (err) {
      return json({ ok: false, error: String((err && err.message) || err) }, 500, corsHeaders);
    }
  },
};

async function publishToGitHub(token, files, message) {
  const base = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}`;
  const api = (path, opts) => githubApiFetch(`${base}${path}`, token, opts);

  const refData = await api(`/git/refs/heads/${GH_BRANCH}`);
  const parentCommitSha = refData.object.sha;
  const parentCommit = await api(`/git/commits/${parentCommitSha}`);
  const baseTreeSha = parentCommit.tree.sha;

  const treeEntries = [];
  for (const f of files) {
    const blob = await api('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: f.contentB64, encoding: 'base64' }),
    });
    treeEntries.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const newTree = await api('/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
  });
  const newCommit = await api('/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [parentCommitSha] }),
  });
  await api(`/git/refs/heads/${GH_BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha }),
  });
  return newCommit.sha;
}

async function githubApiFetch(url, token, opts) {
  const res = await fetch(url, Object.assign({}, opts, {
    headers: Object.assign({
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'painel-darkstore-publish-worker',
    }, opts && opts.headers),
  }));
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HTTP ${res.status} do GitHub: ${t.slice(0, 300)}`);
  }
  return res.json();
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
  });
}
