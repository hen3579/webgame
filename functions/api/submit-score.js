export async function onRequestPost({ request, env }) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    };

    try {
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: { ...headers, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
            });
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), { status: 400, headers });
        }

        const name = (body.name || '').toString().trim().slice(0, 12);
        const score = parseInt(body.score, 10);
        const gameKey = (body.key || '').toString();

        if (!name || name.length === 0) {
            return new Response(JSON.stringify({ ok: false, error: 'name_required' }), { status: 400, headers });
        }
        if (isNaN(score) || score < 0 || score > 999999) {
            return new Response(JSON.stringify({ ok: false, error: 'invalid_score' }), { status: 400, headers });
        }
        if (gameKey.length > 64) {
            return new Response(JSON.stringify({ ok: false, error: 'invalid_key' }), { status: 400, headers });
        }

        const db = env.DB;
        if (!db) {
            return new Response(JSON.stringify({ ok: false, error: 'db_not_configured' }), { status: 500, headers });
        }

        await db.prepare(
            'INSERT INTO scores (player_name, score) VALUES (?, ?)'
        ).bind(name, score).run();

        const rankResult = await db.prepare(
            'SELECT COUNT(*) + 1 AS rank FROM scores WHERE score > ?'
        ).bind(score).first();

        return new Response(JSON.stringify({
            ok: true,
            rank: rankResult ? rankResult.rank : null
        }), { headers });

    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: 'server_error' }), { status: 500, headers });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
