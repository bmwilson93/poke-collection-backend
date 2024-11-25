-- Run to create the tables for this project

-- My tables
CREATE TABLE users (
	id serial PRIMARY KEY,
  username varchar(64) NOT NULL UNIQUE,
  email varchar(128) NOT NULL UNIQUE,
  password varchar(64) NOT NULL
);
 
CREATE TABLE collections (
  id serial PRIMARY KEY,
  collection json,
  user_id int REFERENCES users(id)
);
  

-- Table to store the session data from express-session, connect-pg-simple
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");