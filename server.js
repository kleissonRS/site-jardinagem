const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Na Vercel, apenas a pasta /tmp tem permissão de escrita. 
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const DATA_FILE = isProduction 
    ? path.join('/tmp', 'orcamentos.json') 
    : path.join(__dirname, 'data', 'orcamentos.json');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read data
function getOrcamentos() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, '[]', 'utf8');
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error('Erro ao ler orçamentos:', err);
        return [];
    }
}

// Helper to write data
function saveOrcamentos(orcamentos) {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(orcamentos, null, 2), 'utf8');
    } catch (err) {
        console.error('Erro ao salvar orçamentos:', err);
    }
}

// API Routes
// 1. Receber solicitação de orçamento
app.post('/api/orcamento', (req, res) => {
    const { nome, telefone, email, servico, area, mensagem, preferenciacontato } = req.body;

    if (!nome || !telefone) {
        return res.status(400).json({ success: false, message: 'Nome e telefone são obrigatórios.' });
    }

    const orcamentos = getOrcamentos();
    const novoOrcamento = {
        id: 'ORC-' + Date.now().toString().slice(-6),
        nome,
        telefone,
        email: email || 'Não informado',
        servico: servico || 'Geral',
        area: area || 'Não especificada',
        mensagem: mensagem || '',
        preferenciacontato: preferenciacontato || 'WhatsApp',
        status: 'Novo',
        dataCriacao: new Date().toISOString()
    };

    orcamentos.unshift(novoOrcamento);
    saveOrcamentos(orcamentos);

    res.status(201).json({
        success: true,
        id: novoOrcamento.id,
        message: 'Solicitação de orçamento recebida com sucesso!',
        orcamento: novoOrcamento
    });
});

// Retrocompatibilidade com a rota antiga /api/contato
app.post('/api/contato', (req, res) => {
    const { nome, telefone, servico, mensagem } = req.body;
    const orcamentos = getOrcamentos();
    const novoOrcamento = {
        id: 'ORC-' + Date.now().toString().slice(-6),
        nome: nome || 'Contato via Site',
        telefone: telefone || 'Não informado',
        email: 'Não informado',
        servico: servico || 'Jardinagem Geral',
        area: 'Não especificada',
        mensagem: mensagem || '',
        preferenciacontato: 'WhatsApp',
        status: 'Novo',
        dataCriacao: new Date().toISOString()
    };
    orcamentos.unshift(novoOrcamento);
    saveOrcamentos(orcamentos);
    res.status(201).json({ success: true, id: novoOrcamento.id, message: 'Sucesso' });
});

// 2. Listar orçamentos (Painel Admin)
app.get('/api/orcamento', (req, res) => {
    const orcamentos = getOrcamentos();
    res.json({ success: true, count: orcamentos.length, data: orcamentos });
});

// 3. Atualizar status do orçamento
app.patch('/api/orcamento/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    let orcamentos = getOrcamentos();
    const index = orcamentos.findIndex(o => o.id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Orçamento não encontrado.' });
    }

    orcamentos[index].status = status || orcamentos[index].status;
    orcamentos[index].dataAtualizacao = new Date().toISOString();

    saveOrcamentos(orcamentos);
    res.json({ success: true, message: 'Status atualizado', orcamento: orcamentos[index] });
});

// Rotas SEO
app.get('/sitemap.xml', (req, res) => {
    const host = req.headers.host || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const baseUrl = `${protocol}://${host}`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
});

app.get('/robots.txt', (req, res) => {
    const host = req.headers.host || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const baseUrl = `${protocol}://${host}`;

    const txt = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${baseUrl}/sitemap.xml`;

    res.header('Content-Type', 'text/plain');
    res.send(txt);
});

// Rota do Admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Iniciar Servidor (Local) ou Exportar (Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🌿 Servidor de Jardinagem rodando na porta ${PORT}`);
        console.log(`👉 Acesse o site em: http://localhost:${PORT}`);
        console.log(`👉 Acesse o Painel de Orçamentos em: http://localhost:${PORT}/admin`);
    });
}

module.exports = app;