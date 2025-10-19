
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Resolve base paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../db/database.sqlite");

// Ensure the /db folder exists
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// Initialize database
const db = new Database(dbPath);

// Create objects table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS objects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sugar_value INTEGER NOT NULL
  )
`).run();

// Create users table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    donated_amount REAL DEFAULT 0
  )
`).run();

// Insert default data if table is empty
const count = db.prepare("SELECT COUNT(*) as total FROM objects").get().total;
if (count === 0) {
  const insert = db.prepare("INSERT INTO objects (name, sugar_value) VALUES (?, ?)");
  insert.run("Candy", 15);
  insert.run("Chocolate", 25);
  insert.run("Gummy Bear", 20);
  insert.run("Lollipop", 30);
  console.log("Inserted default sweet objects into database");
}

// Export query helpers for objects
export function getAllObjects() {
  return db.prepare("SELECT * FROM objects").all();
}

export function getObjectById(id) {
  return db.prepare("SELECT * FROM objects WHERE id = ?").get(id);
}

export function getRandomObject() {
  return db.prepare("SELECT * FROM objects ORDER BY RANDOM() LIMIT 1").get();
}

// Export query helpers for users
export function addUser(name, email, donated_amount = 0) {
  return db
    .prepare("INSERT INTO users (name, email, donated_amount) VALUES (?, ?, ?)")
    .run(name, email, donated_amount);
}

export function getAllUsers() {
  return db.prepare("SELECT * FROM users").all();
}

export function getUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

export default db;
