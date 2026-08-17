export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // TESTE DO BANCO D1
    if (url.pathname === "/api/teste") {
      try {
        const resultado = await env.DB
          .prepare("SELECT 1 AS funcionando")
          .first();

        return respostaJSON({
          sucesso: true,
          mensagem: "D1 conectado com sucesso",
          resultado
        });
      } catch (erro) {
        return respostaJSON({
          sucesso: false,
          erro: erro.message
        }, 500);
      }
    }

    // LISTAR TODAS AS ESTAMPAS ATIVAS
    if (url.pathname === "/api/estampas") {
      try {
        const { results } = await env.DB
          .prepare(`
            SELECT
              id,
              codigo,
              nome,
              categoria,
              preco,
              imagem,
              descricao,
              tags,
              ativo,
              destaque
            FROM estampas
            WHERE ativo = 1
            ORDER BY destaque DESC, id DESC
          `)
          .all();

        return respostaJSON({
          sucesso: true,
          estampas: results
        });

      } catch (erro) {
        return respostaJSON({
          sucesso: false,
          erro: erro.message
        }, 500);
      }
    }

    // BUSCAR UMA ESTAMPA PELO CÓDIGO
    if (url.pathname.startsWith("/api/produto/")) {
      try {
        const codigo = decodeURIComponent(
          url.pathname.replace("/api/produto/", "")
        ).trim();

        const produto = await env.DB
          .prepare(`
            SELECT *
            FROM estampas
            WHERE codigo = ?
            LIMIT 1
          `)
          .bind(codigo)
          .first();

        if (!produto) {
          return respostaJSON({
            sucesso: false,
            mensagem: "Estampa não encontrada"
          }, 404);
        }

        return respostaJSON({
          sucesso: true,
          produto
        });

      } catch (erro) {
        return respostaJSON({
          sucesso: false,
          erro: erro.message
        }, 500);
      }
    }

    // SITE / INDEX.HTML
    return env.ASSETS.fetch(request);
  }
};

function respostaJSON(dados, status = 200) {
  return new Response(
    JSON.stringify(dados, null, 2),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "no-store"
      }
    }
  );
}
