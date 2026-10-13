

DROP TABLE IF EXISTS blogs;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE blogs (
  blog_id SERIAL PRIMARY KEY,
  creator_name VARCHAR(255) NOT NULL,
  creator_user_id VARCHAR(255) REFERENCES users(user_id),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(255),
  date_created TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO users (user_id, password, name) VALUES
  ('1111', '1111', 'Mason'),
  ('2222', '2222', 'mason jr'),
  ('3333', '3333', 'mason the 3rd');

INSERT INTO blogs (creator_name, creator_user_id, title, body, category, date_created) VALUES
  ('Mason', '1111', 'Grim Darkness', 'In the grim darkness of the 41st millennium, there is only war.', 'Hobbys', NOW() - INTERVAL '4 days'),
  ('Mason', '1111', 'Got Promoted', 'I got promoted to Geek Squad.', 'Professional', NOW() - INTERVAL '3 days'),
  ('Mason', '1111', 'Hockey Win', 'I played and won in a game of ice hockey, ya me.', 'Fitness', NOW() - INTERVAL '2 days'),
  ('mason jr', '2222', 'Shoutout', 'Mason sr is really cool.', 'Professional', NOW() - INTERVAL '1 day'),
  ('mason the 3rd', '3333', 'Shoutout', 'Mason sr is the coolest guy I know.', 'Professional', NOW());
