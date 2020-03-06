const sqlite3 = require('sqlite3').verbose();

exports.open = async (file) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        reject (new Error('Open error: ' + 'unable to open ' + file));
      } else {
        resolve(db);
      }
    });
  });
};

exports.run = async (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(sql, params, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  });
};

exports.all = async (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });
};

exports.close = async (db) => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      resolve(true);
    });
  });
};
