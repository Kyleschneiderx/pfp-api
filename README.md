# Pelvic Floor Project

## Installations

Install at least Node.js v18.20.4 LTS to latest

You can use the pre-built installer from [Node.js](https://nodejs.org/en/download/prebuilt-installer) site or [NVM](https://github.com/nvm-sh/nvm#readme) for Node.js with version manager

Install all app dependencies first before you can run the app

```npm
npm run install
```

## Usage

To run app in local environment that watches every change in files

```
npm run start:dev
```

To run linter

```
npm run lint
```

## Configurations

All kinds of configuration must be define in the <span style="color: #ff6961">src/configs</span> directory be it for app or providers.

```
src/
├─ configs/
│  ├─ provider1.js
│  ├─ app1.js

```

Service container is also defined in the <span style="color: #ff6961">service-container.js</span> inside <span style="color: #ff6961">configs</span> directory.
This contains the initialization of providers, services etc that you want to inject to services.

```
src/
├─ configs/
│  ├─ provider1.js
│  ├─ service-container.js
```

## Databases

### Setup

This app is using MySQL for database. To setup database connection provide the credentials in the <span style="color: #ff6961">.env</span> by setting these following environment variables

```
DB_DIALECT=mysql
DB_HOST
DB_USER
DB_PASS
DB_PORT
DB_DATABASE
```

### Migration

All migration files resides in the <span style="color: #ff6961">src/database/seeders</span>

To run seeder

```
npm run db:migrate
```

```
src/
├─ database/
│  ├─ migrations/
│  │  ├─ xxxxxxxxxxxxxx-table-migration.js
│  │  ├─ xxxxxxxxxxxxxx-column-migration.js
│  │  ├─ xxxxxxxxxxxxxx-table-migration.js
```

### Seeding

All seeder files resides in the <span style="color: #ff6961">src/database/seeders</span>

To run seeder

```
npm run db:seed
```

```
src/
├─ database/
│  ├─ seeders/
│  │  ├─ xxxxxxxxxxxxxx-data1-seeder.js
│  │  ├─ xxxxxxxxxxxxxx-data2-seeder.js
│  │  ├─ xxxxxxxxxxxxxxx-data3-seeder.js
```

### Models

All database table models resides in the <span style="color: #ff6961">src/database/models</span>

```
src/
├─ database/
│  ├─ models/
│  │  ├─ model1.js
│  │  ├─ model2.js
│  │  ├─ model3.js
```

### Reset

To reset database tables and data

```
npm run db:reset
```

## Reference Links

[Sequelize](https://sequelize.org/docs/v6/)

[Node.js](https://nodejs.org/en)

[NVM](https://github.com/nvm-sh/nvm#readme)

[Express Validator](https://express-validator.github.io/docs/)

[date-fns](https://date-fns.org/docs/Getting-Started)
