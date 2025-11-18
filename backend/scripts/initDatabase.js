const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'postgres', // Подключаемся к default DB для создания нашей БД
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function initializeDatabase() {
  try {
    // Создаем базу данных если не существует
    await pool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    console.log(`✅ Database ${process.env.DB_NAME} created`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`📁 Database ${process.env.DB_NAME} already exists`);
    } else {
      console.error('❌ Error creating database:', error);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

initializeDatabase();