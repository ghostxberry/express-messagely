/** User class for message.ly */
const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt");

  
/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
 try {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
    `INSERT INTO users (
      username,
      password, 
      first_name, 
      last_name,
      phone,
      join_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING username`,
      [username, hashedPassword, first_name, last_name, phone]);

      return result.rows[0];
    } catch(e) {
      if (e.code === '23505') {
        throw new Error("Username taken. Please try another.");
      }
      throw e;
    }
    }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    try {
      const result = await db.query(
        `SELECT password FROM users WHERE username =$1`, 
        [username]); 
        const user = result.rows[0];

        if (user) {
          if (await bcrypt.compare(password, user.password) === true) {
            return true 
          }
        }
    }
    catch(e) {
    
    }
   }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    try {
      const result = await db.query(
        `UPDATE users
        SET last_login_at = current_timestamp
        where username = $1
        RETURNING username, last_login_at`,
        [username]);

        if (!result.rows[0]) {
          throw new ExpressError(`No such user: ${username}`, 404);
        }
        return result.rows[0];
    
    }
    catch(e) {
      console.error(`Error updating login timestamp for user ${username}:`, e);
    throw new ExpressError('An error occurred while updating the login timestamp', 500);
    }

   }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const result = await db.query(
      `SELECT * FROM users`
    )
    return result.rows[0];
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username,
      first_name, 
      last_name,
      phone,
      join_at, 
      last_login_at
      FROM users WHERE username = $1`,
      [username]
    );
    
    if (!result.rows[0]) {
      throw new ExpressError(`No such user: ${username}`, 404);
    }
    return result.rows[0];
   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
  const result = await db.query(
    `SELECT id,
    from_username, 
    body, 
    sent_at, 
    read_at
    FROM messages 
    WHERE from_username = $1`,
    [username]
  );

  if (result.rows.length === 0) {
    throw new ExpressError(`No messages found from user: ${username}`, 404);
  }
  return result.rows;
}
  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT id, 
      to_username,
      body,
      sent_at, 
      read_at
      FROM messages
      WHERE to_username = $1`,
      [username]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`No messages found sent to user: ${username}`, 404);
    }
    return result.rows;
   }
}


module.exports = User;