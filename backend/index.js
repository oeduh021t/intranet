const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do pool de conexão com o MariaDB/MySQL do Host
const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.168.5.101', // IP do Gateway do Docker
  user: process.env.DB_USER || 'intranet',        // Insira o seu usuário do banco se mudou
  password: process.env.DB_PASS || '@TiHmdl#2007$', // <--- COLOQUE A SENHA DO SEU MARIADB AQUI
  database: 'intranet', // Database dedicada que você acabou de criar
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Rota de Teste de Conectividade
app.get('/api/status', (req, res) => {
  res.json({ status: 'Online', sistema: 'Intranet Maternidade' });
});

// ROTA: Autenticação de Usuário (Login)
app.post('/api/login', async (req, res) => {
  try {
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    // Busca o usuário no banco
    const sql = 'SELECT id, nome, login, grupo FROM intranet_usuarios WHERE login = ? AND senha = ?';
    const [rows] = await pool.query(sql, [login, senha]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    // Retorna os dados do usuário (menos a senha por segurança)
    res.json(rows[0]);

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Rota : Busca Avançada de Ramais
app.get('/api/ramais', async (req, res) => {
  try {
    const { busca } = req.query;
    
    // Se o usuário digitou algo na busca, filtramos por setor ou responsável
    if (busca) {
      const sql = `
        SELECT * FROM intranet_ramais 
        WHERE setor LIKE ? OR responsavel LIKE ?
        ORDER BY setor ASC
      `;
      const termoBusca = `%${busca}%`;
      const [rows] = await pool.query(sql, [termoBusca, termoBusca]);
      return res.json(rows);
    }

    // Se não houver busca, traz todos os ramais da Maternidade
    const [rows] = await pool.query('SELECT * FROM intranet_ramais ORDER BY setor ASC');
    res.json(rows);

  } catch (error) {
    console.error('Erro ao buscar ramais no banco:', error);
    res.status(500).json({ error: 'Erro interno no servidor de banco de dados' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor da Intranet rodando na porta ${PORT}`);
});