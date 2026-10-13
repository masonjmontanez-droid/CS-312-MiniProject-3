const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');

const app = express()

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'blogdb',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'cs312-blog-secret-key',
  resave: false,
  saveUninitialized: false
}))

function requireLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/signin');
    return;
  } else {
  next();
  }
}

app.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

app.post('/signup', async (req, res) => {
  const user_id = req.body.user_id;
  const password = req.body.password;
  const name = req.body.name;

  const existing = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
  if (existing.rows.length > 0) {
    res.render('signup', { error: 'That user ID is already taken, pick another one.' });
    return;
  }

  await pool.query('INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)', [user_id, password, name]);

  res.redirect('/signin');
});

app.get('/signin', (req, res) => {
  res.render('signin', { error: null });
});

app.post('/signin', async (req, res) => {
  const user_id = req.body.user_id;
  const password = req.body.password;

  const result = await pool.query('SELECT * FROM users WHERE user_id = $1 AND password = $2', [user_id, password]);

  if (result.rows.length === 0) {
    res.render('signin', { error: 'Wrong user ID or password, try again.' });
    return;
  }

  req.session.user = result.rows[0];
  console.log('logged in: ' + req.session.user.user_id);
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy(function() {
    res.redirect('/signin');
  });
});

app.get('/', requireLogin, async (req, res) => {
  let result;
  if (req.query.category) {
    result = await pool.query('SELECT * FROM blogs WHERE category = $1 ORDER BY date_created DESC', [req.query.category]);
  } else {
    result = await pool.query('SELECT * FROM blogs ORDER BY date_created DESC');
  }
  let posts = result.rows;
  res.render('index', { posts: posts, user: req.session.user });
});

app.post('/posts', requireLogin, async (req, res) => {
  const title = req.body.title;
  const body = req.body.body;
  const category = req.body.category;
  const creator_user_id = req.session.user.user_id;
  const creator_name = req.session.user.name;

  await pool.query(
    'INSERT INTO blogs (creator_name, creator_user_id, title, body, category, date_created) VALUES ($1, $2, $3, $4, $5, NOW())',
    [creator_name, creator_user_id, title, body, category]
  );

  res.redirect('/');
});

app.get('/posts/:id/edit', requireLogin, async (req, res) => {
  const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [req.params.id]);
  const post = result.rows[0];

  if (!post) {
    res.status(403).send('You can only edit your own posts.');
    return;
  }
  if (post.creator_user_id != req.session.user.user_id) {
    res.status(403).send('You can only edit your own posts.');
    return;
  }

  res.render('edit', { post: post });
});

app.post('/posts/:id/edit', requireLogin, async (req, res) => {
  const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [req.params.id]);
  const post = result.rows[0];

  if (!post) {
    res.status(403).send('You can only edit your own posts.');
    return;
  }
  if (post.creator_user_id != req.session.user.user_id) {
    res.status(403).send('You can only edit your own posts.');
    return;
  }

  const title = req.body.title;
  const body = req.body.body;
  const category = req.body.category;

  await pool.query('UPDATE blogs SET title = $1, body = $2, category = $3 WHERE blog_id = $4', [title, body, category, req.params.id]);

  res.redirect('/');
});

app.post('/posts/:id/delete', requireLogin, async (req, res) => {
  const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [req.params.id]);
  const post = result.rows[0];

  if (!post) {
    res.status(403).send('You can only delete your own posts.');
    return;
  }
  if (post.creator_user_id != req.session.user.user_id) {
    res.status(403).send('You can only delete your own posts.');
    return;
  }

  await pool.query('DELETE FROM blogs WHERE blog_id = $1', [req.params.id]);
  res.redirect('/');
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
