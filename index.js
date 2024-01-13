require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { Pool } = require("pg");

const PORT = process.env.PORT || 8000;
const pool = new Pool({
  connectionString: process.env.ELEPHANT_SQL_CONNECTION_STRING,
});

app.use(express.json());
app.use(cors());

// global middleware
app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});

app.get("/", (req, res) => {
  res.send("hello world");
});

app.get("/api/movies", (req, res) => {
  pool
    .query("SELECT * FROM movies;")
    .then((data) => {
      res.json(data.rows);
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});

app.get("/api/movies/:id", (req, res) => {
  const id = req.params.id;
  pool
    .query("SELECT * FROM movies WHERE id=$1;", [id])
    .then((data) => {
      if (data.rowCount === 0) {
        res.status(404).json({ message: `Movie with id ${id} not found!` });
      } else {
        res.json(data.rows[0]);
      }
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});

const validateMovie = (req, res, next) => {
  const requiredFields = [
    "title",
    "director",
    "year",
    "rating",
    "poster",
    "movie_details",
  ];
  let missingFields = "";
  for (const field of requiredFields) {
    if (!req.body[field]) {
      missingFields += `${field} required `;
    }
  }
  if (missingFields) {
    next(missingFields);
  } else {
    next();
  }
};

app.post("/api/movies", validateMovie, (req, res, next) => {
  const { title, director, year, rating, poster, movie_details } = req.body;
  pool
    .query(
      "INSERT INTO movies (title, director, year, rating, poster, movie_details) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;",
      [title, director, year, rating, poster, movie_details]
    )
    .then((data) => {
      res.status(201).json(data.rows[0]);
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});

app.put("/api/movies/:id", (req, res) => {
  const id = req.params.id;
  const { title, director, year, rating, poster, movie_details } = req.body;
  pool
    .query(
      "UPDATE movies SET title=$1, director=$2, year=$3, rating=$4, poster=$5, movie_details=$6 WHERE id=$7 RETURNING *;",
      [title, director, year, rating, poster, id, movie_details]
    )
    .then((data) => {
      res.json(data.rows[0]);
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});

app.delete("/api/movies/:id", (req, res) => {
  const id = req.params.id;
  pool
    .query("DELETE FROM movies WHERE id=$1 RETURNING *", [id])
    .then((data) => {
      if (data.rowCount === 0) {
        res.status(404).json({ message: `Movie with id ${id} not found!` });
      } else {
        res.json(data.rows[0]);
      }
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});

app.get("/api/movies/:id/comments", (req, res) => {
  const movieId = req.params.id;
  pool
    .query("SELECT * FROM comments WHERE movie_id=$1;", [movieId])
    .then((data) => {
      res.json(data.rows);
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});
app.post("/api/movies/:id/comments", (req, res) => {
  const movieId = req.params.id;
  const { comment_text } = req.body;
  pool
    .query(
      "INSERT INTO comments (movie_id, comment_text) VALUES ($1, $2) RETURNING *;",
      [movieId, comment_text]
    )
    .then((data) => {
      res.status(201).json(data.rows[0]);
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});
app.put("/api/comments/:id", (req, res) => {
  const id = req.params.id;
  const { comment_text } = req.body;
  pool
    .query(
      "UPDATE comments SET comment_text=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *;",
      [comment_text, id]
    )
    .then((data) => {
      if (data.rowCount === 0) {
        res.status(404).json({ message: `Comment with id ${id} not found!` });
      } else {
        res.json(data.rows[0]);
      }
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});

app.delete("/api/comments/:id", (req, res) => {
  const id = req.params.id;
  pool
    .query("DELETE FROM comments WHERE id=$1 RETURNING *", [id])
    .then((data) => {
      if (data.rowCount === 0) {
        res.status(404).json({ message: `Comment with id ${id} not found!` });
      } else {
        res.json(data.rows[0]);
      }
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});

app.get("/api/comments", (req, res) => {
  pool
    .query("SELECT * FROM comments;")
    .then((data) => {
      res.json(data.rows);
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});
app.use((error, req, res, next) => {
  res.status(400).json({ error });
});

app.listen(PORT, () => {
  console.log("Server is running!!");
});
