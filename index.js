const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));

// Middleware para leer datos de formularios (POST)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// -----------------------------------------------------------------
// SOLUCIÓN EXERCISE TRACKER (In-Memory Database)
// -----------------------------------------------------------------

// Bases de datos temporales
let users = [];         // Almacena objetos { username, _id }
let exercises = [];     // Almacena objetos { userId, description, duration, date }

// Función auxiliar para generar IDs únicos simples
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// 1. Crear un nuevo usuario (POST /api/users)
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  
  const newUser = {
    username: username,
    _id: generateId()
  };
  
  users.push(newUser);
  res.json(newUser);
});

// 2. Obtener todos los usuarios (GET /api/users)
app.get('/api/users', (req, res) => {
  res.json(users);
});

// 3. Agregar ejercicio (POST /api/users/:_id/exercises)
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  // Buscar usuario
  const user = users.find(u => u._id === userId);
  if (!user) return res.json({ error: "User not found" });

  // Procesar fecha: si no hay fecha, usar 'now'.
  // Importante: Guardamos el objeto Date real para poder filtrar después
  const exerciseDate = date ? new Date(date) : new Date();

  const newExercise = {
    userId: userId,
    description: description,
    duration: parseInt(duration), // Debe ser número
    date: exerciseDate
  };

  exercises.push(newExercise);

  // Respuesta requerida: Datos del usuario + datos del ejercicio
  res.json({
    _id: user._id,
    username: user.username,
    date: exerciseDate.toDateString(), // Formato exigido: "Mon Jan 01 1990"
    duration: newExercise.duration,
    description: newExercise.description
  });
});

// 4. Obtener logs (historial) (GET /api/users/:_id/logs)
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const user = users.find(u => u._id === userId);
  if (!user) return res.json({ error: "User not found" });

  // Filtrar ejercicios de este usuario
  let userExercises = exercises.filter(ex => ex.userId === userId);

  // Filtro de fecha: FROM
  if (from) {
    const fromDate = new Date(from);
    userExercises = userExercises.filter(ex => ex.date >= fromDate);
  }

  // Filtro de fecha: TO
  if (to) {
    const toDate = new Date(to);
    userExercises = userExercises.filter(ex => ex.date <= toDate);
  }

  // Filtro: LIMIT (cantidad de resultados)
  if (limit) {
    userExercises = userExercises.slice(0, parseInt(limit));
  }

  // Formatear para la respuesta (convertir date a String en el log)
  const log = userExercises.map(ex => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date.toDateString()
  }));

  // Respuesta final
  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log
  });
});

// -----------------------------------------------------------------

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});