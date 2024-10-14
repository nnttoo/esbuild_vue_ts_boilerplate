#!/usr/bin/env node
import * as esbuild from 'esbuild'
import vuePlugin from 'esbuild-plugin-vue3';
import { Command } from "commander"; 
import dotenv from "dotenv";
import nodemon from 'nodemon';
import { callReloadServer, createServer } from "simplepagereloader/server"
import { fileURLToPath } from 'url';
dotenv.config();

import { spawn } from 'child_process';



const NODE_ENV = process.env.NODE_ENV || 'development';
const AUTORELOAD_PORT = Number(process.env.AUTORELOAD_PORT || '9090');
const myfile = fileURLToPath(import.meta.url);

/**
 * 
 * @param {{name : string, bin:string, arg: string[]}} myarg 
 */
function runSpawn(myarg) {
    const command = spawn(myarg.bin, myarg.arg);
 
    let print = (msgIn)=>{ 
        let msg = msgIn+""; 
        msg = msg.trim();
        console.log(`[${myarg.name}] ${msg}`);
    } 
    command.stdout.on('data', (data) => { 
        print(data);
    }); 
    command.stderr.on('data', (data) => {
        print(data);
    }); 
    command.on('close', (code) => {
        print(code);
    });
}


let funsList = {
    async buildFrontend() {
        console.log("build frontend");
        await esbuild.build({
            entryPoints: ['./frontend/src/main.ts'],
            bundle: true,
            outfile: './output/public/app.js',
            minify: true,
            platform: "browser",
            plugins: [
                vuePlugin()
            ],

            define: {
                'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
                'process.env.AUTORELOAD_PORT': JSON.stringify(AUTORELOAD_PORT),
            },
        });
        callReloadServer(AUTORELOAD_PORT);

    },

    async buildBackend() {
        console.log("build backend");
        await esbuild.build({
            entryPoints: ['./backend/src/main.ts'],
            bundle: true,
            outfile: './output/app.js',
            minify: true,
            platform: "node"
        });

    },

    runServer() {

        console.log("run server");
        runSpawn({
            name:"server",
            bin:"node",
            arg: ["./output/app.js"]
        });
        callReloadServer(AUTORELOAD_PORT);
    },
    watchServer() { 
        nodemon({
            watch: ["./output/app.js"],
            ext: "js",
            exec: "node " + myfile + " -f runServer",

        });
    },

    watchFrontend() {
        nodemon({
            watch: ["./frontend/src/"],
            ext: "js,ts,vue,html,css",
            exec: "node " + myfile + " -f buildFrontend"
        });
    },

    
    watchBackend() {
        nodemon({
            watch: ["./backend/src/"],
            ext: "js,ts,vue,html,css",
            exec: "node " + myfile + " -f buildBackend"
        });
    },

    async runWatch() {
        createServer(AUTORELOAD_PORT);
        runSpawn({
            name: "watchServer",
            bin:"node",
            arg:[ myfile,"-f","watchServer"]
        });
        runSpawn({
            name: "watchFrontend",
            bin:"node",
            arg:[ myfile,"-f","watchFrontend"]
        }); 
        runSpawn({
            name: "watchBackend",
            bin:"node",
            arg:[ myfile,"-f","watchBackend"]
        }); 

    }

}





function readArg() {
    /** @type {{fun : string} | null} */
    let result = {};

    const program = new Command();
    program
        .option('-f, --fun <string>', 'call any function from funsList ', "");

    program.parse(process.argv);
    result = program.opts();

    return {
        program,
        result
    }

}

function run() {
    let argResult = readArg();
    let arg = argResult.result;
    if (arg == null ||
        arg.fun == null ||
        arg.fun == ""
    ) {
        console.log("Please use option -f or --fun");
        argResult.program.help();
        return;
    }

    console.log(arg);

    let fun = arg.fun;
    if (funsList[fun] != null) {
        funsList[fun]();
    }

}

run();