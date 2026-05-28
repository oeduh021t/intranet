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

// Rota Principal: Busca Avançada de Ramais
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