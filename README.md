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

To run database migration
```
npm run db:migrate
```

To run database seeds

```
npm run db:seed
```

To run database reset

```
npm run db:reset
```

To run linter
```
npm run lint
```

## Reference Links
[Sequelize](https://sequelize.org/docs/v6/)

[Node.js](https://nodejs.org/en)

[NVM](https://github.com/nvm-sh/nvm#readme)

[Express Validator](https://express-validator.github.io/docs/)

[date-fns](https://date-fns.org/docs/Getting-Started)