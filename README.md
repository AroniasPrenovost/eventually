# RESTful API With Node and TypeScript

### Project setup 

1. Fork/Clone
2. create .env w/ credentials - `cp .env-sample .env`
3. Install dependencies - `npm install`
4. Compile - `npm run build`
5. Compile assets - `gulp assets`
6. Tests - `npm test`
7. Run the development server - `npm start`

```
$ npm run build ; gulp assets ; npm test ; npm start
```

### Unit tests

Uses Mocha + Chai test frameworks

```
$ npm test
```

### Data storage 

MySQL

to do: 
- outline db + table creation

## API endpoints

### registrations

* `GET /registrations` returns list of registrations as JSON
```
$ curl localhost:8080/api/v1/registrations
```

* `POST /registrations` adds new registration record 
```
$ curl localhost:8080/api/v1/registrations -X POST -d '{"password": "test"}' -H "Content-Type: application/json"
```

* `PUT /registrations` update registration record (requires ID or email address)
```
$ curl localhost:8080/api/v1/registrations -X PUT -d '{}' -H "Content-Type: application/json"
```

* `DELETE /registrations` deletes all registration records 
```
$ curl localhost:8080/api/v1/registrations -X DELETE
```

### registration

* `GET /registration` gets registration by id  
```
$ curl localhost:8080/api/v1/registration/{id}
```

### users

* `GET /users` returns list of users as JSON
```
$ curl localhost:8080/api/v1/users
```

* `POST /users` adds new registration record 
```
$ curl localhost:8080/api/v1/users -X POST -d '{"email_address": "aronp123@gmail.com", "first_name": "Aron", "last_name": "Prenovost", "password": "test"}' -H "Content-Type: application/json"
```

* `PUT /users` update registration record (requires ID or email address)
```
$ curl localhost:8080/api/v1/users -X PUT -d '{"email_address": "aronp123@gmail.com", "first_name": "Aron", "last_name": "Johnson", "id": 1}' -H "Content-Type: application/json"
```

* `DELETE /users` deletes all user records 
```
$ curl localhost:8080/api/v1/users -X DELETE
```

## Long-Term Goals 
Build a real world "production" REST API: 

* [ ] Scalable, must be able to run more than one instance.

* [ ] Dockerized, runnable on minikube.

* [ ] Unit tested, must be able to run "go test ./..." directly from clone.

* [ ] Integration tested, recommend docker-compose.

* [ ] OpenAPI/Swagger (or similar for gRPC) documented.

* [ ] dep vendored, but using the standard library often, instead of piling on dependencies.

* [ ] Authenticated and Authorized via apikeys and/or user accounts.

* [ ] Built and tested via CI: Travis, CircleCi, etc. Recommend Makefile for task documentation.

* [ ] Flag & ENV config, API keys, ports, dev mode, etc.

* [ ] "why" comments, not "what" or "how" which should be clear through func/variable names and godoc comments.

* [ ] Use of Context to limit request time.

* [ ] Leveled JSON logging, logrus or similar.

* [x] Postgres/MySQL, sqlx or an ORM.

* [ ] Redis/memcache for scalable caching.

* [ ] Datadog, New Relic, AppDynamics, etc for monitoring and statistics.

* [ ] Well documented README.md with separate sections for API user and service developer audiences. Maybe even include graphviz or mermaidJS UML diagrams.

* [ ] Clean git history with structured commits and useful messages. No merge master commits.

* [ ] Passing go fmt, go lint, or better, go-metalinter in the CI.