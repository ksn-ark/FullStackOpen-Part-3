require("dotenv").config();
const express = require("express");

const morgan = require("morgan");

const Person = require("./models/person");

const app = express();

app.use(express.static("dist"));

app.use(express.json());

morgan.token("reqbody", function (req, res) {
  const body = req.body;
  return JSON.stringify(body);
});

app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :reqbody"
  )
);

app.get("/info", (request, response) => {
  Person.find({}).then((persons) => {
    const info = `<p>Phonebook has info for ${persons.length} people</p>`;
    const timeStamp = `${new Date().toString()}`;
    response.send(`${info} ${timeStamp}`);
  });
});

app.get("/api/persons", (request, response) => {
  Person.find({}).then((persons) => {
    response.json(persons);
  });
});

app.get("/api/persons/:id", (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      person ? response.json(person) : response.status(404).end();
    })
    .catch((error) => next(error));
});

app.delete("/api/persons/:id", (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then((person) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

app.post("/api/persons/", (request, response, next) => {
  const body = request.body;

  /*if (body ? !body.name || !body.number : false) {
    return response.status(400).json({
      error: `missing ${
        body
          ? body.name
            ? "person number"
            : body.number
            ? "person name"
            : "person name and number"
          : "body"
      }`,
    });
  }*/

  const person = new Person({
    name: body.name,
    number: body.number,
  });

  person
    .save()
    .then((savedPerson) => response.json(savedPerson))
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (request, response, next) => {
  const { name, number } = request.body;

  Person.findByIdAndUpdate(
    request.params.id,
    { name, number },
    { new: true, runValidators: true, context: "query" }
  )
    .then((updatedPerson) => {
      updatedPerson ? response.json(updatedPerson) : response.status(404).end();
    })
    .catch((error) => next(error));
});

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }
  next(error);
};

app.use(errorHandler);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
