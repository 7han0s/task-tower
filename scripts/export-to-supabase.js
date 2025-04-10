const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

async function exportToSupabase() {
    try {
        // Initialize Supabase connection
        const pool = new Pool({
            connectionString: process.env.SUPABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        // Read data from JSON files
        const games = JSON.parse(fs.readFileSync('data/games.json', 'utf8'));
        const players = JSON.parse(fs.readFileSync('data/players.json', 'utf8'));
        const tasks = JSON.parse(fs.readFileSync('data/tasks.json', 'utf8'));
        const subtasks = JSON.parse(fs.readFileSync('data/subtasks.json', 'utf8'));
        const settings = JSON.parse(fs.readFileSync('data/settings.json', 'utf8'));

        // Helper function to convert data to SQL values
        function convertToSQLValues(data, table) {
            const values = data.map(item => {
                const keys = Object.keys(item);
                return `(
                    ${keys.map(key => typeof item[key] === 'string' ? 
                        `'${item[key]}'` : 
                        item[key] === null ? 'NULL' : item[key]
                    ).join(', ')}
                )`;
            });
            return values.join(',\n');
        }

        // Insert Games
        await pool.query(`
            INSERT INTO games (
                id, lobby_code, mode, current_phase, time_remaining, created_at, updated_at
            ) VALUES ${convertToSQLValues(games, 'games')}
        `);

        // Insert Players
        await pool.query(`
            INSERT INTO players (
                id, game_id, name, score, created_at, updated_at
            ) VALUES ${convertToSQLValues(players, 'players')}
        `);

        // Insert Tasks
        await pool.query(`
            INSERT INTO tasks (
                id, player_id, text, category, points, completed, created_at, updated_at
            ) VALUES ${convertToSQLValues(tasks, 'tasks')}
        `);

        // Insert Subtasks
        await pool.query(`
            INSERT INTO subtasks (
                id, task_id, text, completed, created_at, updated_at
            ) VALUES ${convertToSQLValues(subtasks, 'subtasks')}
        `);

        // Insert Settings
        await pool.query(`
            INSERT INTO settings (
                id, game_id, categories, round_duration, theme, variant, created_at, updated_at
            ) VALUES ${convertToSQLValues(settings, 'settings')}
        `);

        console.log('Data exported to Supabase successfully');
    } catch (error) {
        console.error('Error exporting to Supabase:', error);
        throw error;
    } finally {
        pool.end();
    }
}

exportToSupabase().catch(console.error);
