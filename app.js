const express = require("express");
const path = require("path");
const { open } = require("sqlite");

const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
        SELECT * FROM todo
        WHERE todo LIKE '%${search_q}%' AND
        status='${status}'
        AND priority='${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
        SELECT * FROM todo
        WHERE todo LIKE '%${search_q}%' AND
        priority='${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `
        SELECT * FROM todo
        WHERE todo LIKE '%${search_q}%' AND
        status='${status}';`;
      break;
    default:
      getTodoQuery = `
        SELECT * FROM todo
        WHERE todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodoQuery);
  response.send(data);
});
// get id
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdQuery = `
    SELECT * FROM todo
    WHERE id=${todoId};`;
  const todoData = await db.get(getTodoIdQuery);
  response.send(todoData);
});
// add post
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const getTodoIdQuery = `
    INSERT INTO
    todo (id, todo, priority, status)
    VALUES(${id},'${todo}', '${priority}', '${status}');`;
  const todoData = await db.run(getTodoIdQuery);
  response.send("Todo Successfully Added");
});

// get todoid
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updatedResult = "";

  switch (true) {
    case requestBody.priority !== undefined:
      updatedResult = "Priority";
      break;
    case requestBody.status !== undefined:
      updatedResult = "Status";
      break;
    case requestBody.todo !== undefined:
      updatedResult = "Todo";
  }
  const previousQuery = `
    SELECT * FROM todo
    WHERE id=${todoId};`;
  const previousTodo = await db.get(previousQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = requestBody;

  const updatedQuery = `
    UPDATE todo
    SET
        todo='${todo}',
        priority='${priority}',
        status='${status}'
    WHERE id=${todoId};`;

  const updatedTodo = await db.run(updatedQuery);
  response.send(`${updatedResult} Updated`);
});

//DELETE TABLE
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getDeleteQuery = `
  DELETE FROM todo
  WHERE id=${todoId};`;
  const deletedTodo = await db.run(getDeleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
