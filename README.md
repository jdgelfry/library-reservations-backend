# Library Reservations Backend

Backend de la prueba técnica para gestionar usuarios, libros y reservas de una biblioteca.

## Stack

- NestJS
- GraphQL code-first
- Prisma ORM
- PostgreSQL
- Docker Compose
- Jest

## Qué incluye

- Creación de usuarios.
- CRUD completo de libros.
- Creación de reservas.
- Consulta de reservas por libro con filtro de fechas.
- Consulta de reservas por usuario con filtro de fechas.
- Retorno de libro antes o después de la fecha pactada.
- Seed inicial de usuarios, libros y reservas.
- Transacciones con Prisma para operaciones críticas.
- Registro de auditoría en `AuditLog` dentro de la misma transacción.
- Pruebas unitarias del servicio de reservas.
- Índice único parcial en PostgreSQL para impedir más de una reserva activa por libro.

## Requisitos

- Node.js 20+
- Docker Desktop
- npm

## Ejecutar con Docker

```bash
docker compose up --build
```

Esto levanta:

- PostgreSQL: `localhost:5432`
- Backend GraphQL: `http://localhost:4000/graphql`

El contenedor ejecuta automáticamente:

```bash
npx prisma migrate deploy
npm run prisma:seed
node dist/main.js
```

## Ejecutar backend en local con PostgreSQL en Docker

Primero levanta PostgreSQL:

```bash
docker compose up postgres -d
```

Luego instala y ejecuta el backend:

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

Backend disponible en:

```txt
http://localhost:4000/graphql
```

## Pruebas

```bash
npm test
```

Las pruebas cubren:

- Creación correcta de reserva usando transacción.
- Bloqueo si el libro ya tiene una reserva activa.
- Bloqueo si el usuario ya tiene 3 reservas activas.
- Validación de fechas.
- Retorno de libro con auditoría.

## Variables de entorno

Copia `.env.example` a `.env`.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/library_reservations?schema=public"
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV=development
```

## Operaciones GraphQL útiles

### Crear usuario

```graphql
mutation {
  createUser(input: { name: "Juan Pérez", email: "juan@example.com" }) {
    id
    name
    email
  }
}
```

### Crear libro

```graphql
mutation {
  createBook(
    input: {
      title: "Domain-Driven Design"
      author: "Eric Evans"
      isbn: "9780321125217"
      publishedYear: 2003
    }
  ) {
    id
    title
    isbn
  }
}
```

### Consultar libros disponibles

```graphql
query {
  availableBooks {
    id
    title
    author
    isbn
  }
}
```

### Actualizar libro

```graphql
mutation {
  updateBook(
    input: {
      id: "UUID_DEL_LIBRO"
      title: "Domain-Driven Design"
      author: "Eric Evans"
      isbn: "9780321125217"
      publishedYear: 2003
    }
  ) {
    id
    title
    author
    isbn
    publishedYear
  }
}
```

### Eliminar libro

```graphql
mutation {
  deleteBook(id: "UUID_DEL_LIBRO") {
    id
    title
    isDeleted
  }
}
```

### Crear reserva

```graphql
mutation CreateReservation($input: CreateReservationInput!) {
  createReservation(input: $input) {
    id
    status
    reservationDate
    returnDate
    book { title }
    user { name }
  }
}
```

Variables:

```json
{
  "input": {
    "userId": "UUID_DEL_USUARIO",
    "bookId": "UUID_DEL_LIBRO",
    "reservationDate": "2026-04-26T10:00:00.000Z",
    "returnDate": "2026-05-02T23:59:59.000Z"
  }
}
```

### Reservas por libro con filtro de fecha

```graphql
query ReservationsByBook($bookId: ID!, $filter: ReservationDateFilterInput) {
  reservationsByBook(bookId: $bookId, filter: $filter) {
    id
    status
    reservationDate
    returnDate
    returnedAt
    user { name email }
  }
}
```

Variables:

```json
{
  "bookId": "UUID_DEL_LIBRO",
  "filter": {
    "from": "2026-04-01T00:00:00.000Z",
    "to": "2026-04-30T23:59:59.000Z"
  }
}
```

### Reservas por usuario con filtro de fecha

```graphql
query ReservationsByUser($userId: ID!, $filter: ReservationDateFilterInput) {
  reservationsByUser(userId: $userId, filter: $filter) {
    id
    status
    reservationDate
    returnDate
    returnedAt
    book { title author isbn }
  }
}
```

### Retornar libro

```graphql
mutation {
  returnBook(reservationId: "UUID_DE_LA_RESERVA") {
    id
    status
    returnedAt
  }
}
```
