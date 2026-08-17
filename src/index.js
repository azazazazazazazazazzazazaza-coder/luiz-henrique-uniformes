export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // TESTE DO D1
    if (url.pathname === "/api/teste" && method === "GET") {
      try {
        const resultado = await env.DB
          .prepare("SELECT 1 AS funcionando")
          .first();

        return json({
          sucesso: true,
          mensagem: "D1 conectado com sucesso",
          resultado
        });
      } catch (erro) {
        return json({ sucesso: false, erro: erro.message }, 500);
      }
    }

    // LISTAR ESTAMPAS
    if (url.pathname === "/api/estampas" && method === "GET") {
      try {
        const categoria = url.searchParams.get("categoria");
        const busca = url.searchParams.get("busca");

        let sql = `
          SELECT
            id,
            codigo,
            nome,
            categoria,
            preco,
            imagem,
            descricao,
            ativo,
            criado_em,
            atualizado_em
          FROM estampas
          WHERE ativo = 1
        `;

        const valores = [];

        if (categoria && categoria !== "Todos") {
          sql += " AND categoria = ?";
          valores.push(categoria);
        }

        if (busca) {
          sql += " AND (nome LIKE ? OR codigo LIKE ?)";
          valores.push(`%${busca}%`, `%${busca}%`);
        }

        sql += " ORDER BY id DESC";

        const stmt = env.DB.prepare(sql);
        const { results } = valores.length
          ? await stmt.bind(...valores).all()
          : await stmt.all();

        return json({
          sucesso: true,
          total: results.length,
          estampas: results
        });
      } catch (erro) {
        return json({ sucesso: false, erro: erro.message }, 500);
      }
    }

    // BUSCAR UMA ESTAMPA
    if (url.pathname.startsWith("/api/estampas/") && method === "GET") {
      try {
        const codigo = decodeURIComponent(
          url.pathname.replace("/api/estampas/", "")
        ).trim();

        const estampa = await env.DB
          .prepare("SELECT * FROM estampas WHERE codigo = ? LIMIT 1")
          .bind(codigo)
          .first();

        if (!estampa) {
          return json(
            { sucesso: false, mensagem: "Estampa não encontrada" },
            404
          );
        }

        return json({ sucesso: true, estampa });
      } catch (erro) {
        return json({ sucesso: false, erro: erro.message }, 500);
      }
    }

    // CADASTRAR ESTAMPA
    if (url.pathname === "/api/estampas" && method === "POST") {
      try {
        const dados = await request.json();

        if (!dados.codigo || !dados.nome || !dados.categoria) {
          return json(
            {
              sucesso: false,
              mensagem: "Código, nome e categoria são obrigatórios"
            },
            400
          );
        }

        await env.DB.prepare(`
          INSERT INTO estampas
          (codigo, nome, categoria, preco, imagem, descricao, ativo)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `)
          .bind(
            dados.codigo.trim(),
            dados.nome.trim(),
            dados.categoria.trim(),
            Number(dados.preco || 49.90),
            dados.imagem || "",
            dados.descricao || ""
          )
          .run();

        return json({
          sucesso: true,
          mensagem: "Estampa cadastrada com sucesso"
        }, 201);
      } catch (erro) {
        return json({ sucesso: false, erro: erro.message }, 500);
      }
    }

    // EDITAR ESTAMPA
    if (url.pathname.startsWith("/api/estampas/") && method === "PUT") {
      try {
        const codigoAtual = decodeURIComponent(
          url.pathname.replace("/api/estampas/", "")
        ).trim();

        const dados = await request.json();

        await env.DB.prepare(`
          UPDATE estampas
          SET
            codigo = ?,
            nome = ?,
            categoria = ?,
            preco = ?,
            imagem = ?,
            descricao = ?,
            atualizado_em = CURRENT_TIMESTAMP
          WHERE codigo = ?
        `)
          .bind(
            dados.codigo,
            dados.nome,
            dados.categoria,
            Number(dados.preco || 0),
            dados.imagem || "",
            dados.descricao || "",
            codigoAtual
          )
          .run();

        return json({
          sucesso: true,
          mensagem: "Estampa atualizada com sucesso"
        });
      } catch (erro) {
        return json({ sucesso: false, erro: erro.message }, 500);
      }
    }

    // EXCLUIR / DESATIVAR ESTAMPA
    if (url.pathname.startsWith("/api/estampas/") && method === "DELETE") {
      try {
        const codigo = decodeURIComponent(
          url.pathname.replace("/api/estampas/", "")
        ).trim();

        await env.DB
          .prepare(`
            UPDATE estampas
            SET ativo = 0,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE codigo = ?
          `)
          .bind(codigo)
          .run();

        return json({
          sucesso: true,
          mensagem: "Estampa removida do catálogo"
        });
      } catch (erro) {
        return json({ sucesso: false, erro: erro.message }, 500);
      }
    }

    // SITE
    return env.ASSETS.fetch(request);
  }
};

function json(dados, status = 200) {
  return new Response(JSON.stringify(dados, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
}
