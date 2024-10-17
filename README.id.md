
# ESBuild Vue Ts Boilerplate

Ini adalah boilerplate untuk project yang menggunakan esbuild, Vue.js dengan typescript

clone git ini

```sh
    git clone git@github.com:nnttoo/esbuild_vue_ts_boilerplate.git
```

dan jalankan 

```sh 
    npm install
```

## Hot Reload

Browser otomatis refresh ketika terjadi perubahan baik di folder backend maupun frontend, untuk memulainya anda bisa menggunakan command berikut ini :

```sh
    npx tsx ./builder/builder.ts -f runWatch
```


## Konfigurasi

Anda bisa menyesuaikan beberapa konfigurasi, dengan mengedit file esbuild.mjs atau dengan mengedit .env

```env
NODE_ENV="development"
SERVERPORT="6767"
AUTORELOAD_PORT="7878"
```

## Build untuk production

untuk membuild versi production edit file .env dan ubah

```sh
NODE_ENV="production"
```

kemudian jalankan perintah berikut ini :

```sh
npx tsx ./builder/builder.ts -f buildAll

```

Untuk menjalankan server anda bisa mengetikan perintah berikut ini :

```sh
npx tsx ./builder/builder.ts -f runServer

```