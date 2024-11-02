 

# ESBuild Vue Typescript Boilerplate


--- 

This is a boilerplate for projects using esbuild, Vue.js with TypeScript.

Clone this repository:

```sh
    git clone git@github.com:nnttoo/esbuild_vue_ts_boilerplate.git
```

Then, run:

```sh 
    npm install
```

## Hot Reload

The browser will automatically refresh when changes occur in either the backend or frontend folder. To start the hot reload, you can use the following command:

```sh
    npm run dev --  -f runWatch
```

## Configuration

You can customize several settings by editing the `esbuild.mjs` file or by modifying the `.env` file:

```env
NODE_ENV="development"
SERVERPORT="6767" 
```

## Production Build

To build the production version, edit the `.env` file and change:

```sh
NODE_ENV="production"
```

Then, run the following command:

```sh
 npm run dev --  -f buildAll
```

To start the server, you can run this command:

```sh
 npm run dev --  -f runServer
```