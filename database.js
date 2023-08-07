import dotenv from 'dotenv';
import mysqlPromise from 'mysql2/promise';

// load .env configuration
dotenv.config();

// connect to MySQL
const db = await mysqlPromise.createPool({
	host: process.env.MYSQL_HOST,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_DATABASE,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

export async function getMessages() {
	const [rows] = await db.query('SELECT * FROM messages');
	return rows;
}

export async function getMessage(id) {
	const [rows] = await db.query(`SELECT * FROM messages WHERE id = ?`, [id]);
	return rows[0];
}

export async function createMessage(name, message) {
	const [res] = await db.query(
		`INSERT INTO messages (name, message) VALUES (?, ?)`,
		[name, message]
	);
	const id = res.insertId;
	return getMessage(id);
}

export async function getLastTenMessages() {
	const [rows] = await db.query(
		`SELECT * FROM messages ORDER BY id DESC LIMIT 10`
	);
	const messages = rows.map((record) => {
		return {
			message: record.message,
			name: record.name,
			id: record.id
		};
	});

	return messages;
}


