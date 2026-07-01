export async function onRequestGet({ request, env }) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
    };

    try {
        const url = new URL(request.url);
        const myScore = parseInt(url.searchParams.get('score'), 10);

        const db = env.DB;
        if (!db) {
            return new Response(JSON.stringify({ ok: false, error: 'db_not_configured', top: [], myRank: null, totalPlayers: 0 }), { status: 500, headers });
        }

        const topResult = await db.prepare(
            'SELECT player_name, score FROM scores ORDER BY score DESC, created_at ASC LIMIT 10'
        ).all();

        const countResult = await db.prepare(
            'SELECT COUNT(*) AS cnt FROM scores'
        ).first();
        const totalPlayers = countResult ? countResult.cnt : 0;

        let myRank = null;
        if (!isNaN(myScore) && myScore >= 0) {
            const rankResult = await db.prepare(
                'SELECT COUNT(*) + 1 AS rank FROM scores WHERE score > ?'
            ).bind(myScore).first();
            myRank = rankResult ? rankResult.rank : null;
        }

        return new Response(JSON.stringify({
            ok: true,
            top: topResult.results || [],
            myRank,
            totalPlayers
        }), { headers });

    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: 'server_error', top: [], myRank: null, totalPlayers: 0 }), { status: 500, headers });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
