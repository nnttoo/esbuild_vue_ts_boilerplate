#!/usr/bin/env node
import * as esbuild from 'esbuild'
import fs from "fs/promises"
import vuePlugin from 'esbuild-plugin-vue3';
import { Command } from "commander";
import dotenv from "dotenv"; 
import { callReloadServer, createServer } from "simplepagereloader/server"
import chokidar from "chokidar" 
dotenv.config();

import { spawn } from 'child_process';



const NODE_ENV = process.env.NODE_ENV || 'development';
const AUTORELOAD_PORT = Number(process.env.AUTORELOAD_PORT || '9090'); 



/**
 * @typedef {{stop : ()=>void}} SpawnTools
 */

/** @type {SpawnTools | null} */
let serverSpawn = null;

function runServer(){
    console.log("run server");
    serverSpawn = runSpawn({
        name: "server",
        bin: "node",
        arg: ["./output/app.js"]
    });
}
function restartServer(){
    if(serverSpawn == null) return;
    serverSpawn.stop();
    runServer();
}

function watchHtml() { 
    let watcher  = chokidar.watch([ 
        "./output/public/index.html"
    ],{
        persistent : true
    });

    watcher.on("change",()=>{
        console.log("html change")
        callReloadServer(AUTORELOAD_PORT);
    })
}

/**
 * 
 * @param {{name : string, bin:string, arg: string[]}} myarg 
 */
function runSpawn(myarg) {
    const command = spawn(myarg.bin, myarg.arg);

    let print = (msgIn) => {
        let msg = msgIn + "";
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

    /** @type {SpawnTools} */
    let result = {
        stop(){
            command.kill();
        }
    }

    return result;
}


let funsList = {
    /**
     * 
     * @param {string} needreload 
     */
    async buildFrontend(needreload) {

        let iswatch = needreload != null;
        
        let isreadyInjected = false;
 
        /** @type {esbuild.BuildOptions} */
        let buildOption = {
            entryPoints: ["frontend/src/main.ts"],
            bundle: true,
            outfile: './output/public/app.js',
            minify: true,
            platform: "browser",
            plugins: [
                vuePlugin(),
                {
                    name: 'rebuild-notify',
                    setup(build) {

                        build.onLoad({ filter: /.ts/gi }, async (args) => {  
                            if (!iswatch) return; 
                            if(isreadyInjected) return;

                            isreadyInjected = true;
                            let ctn = await fs.readFile(args.path);
                            ctn += ` 
                            import {simplePageReload} from "simplepagereloader/client";  
                            simplePageReload(${AUTORELOAD_PORT}); 
                            `

                            return {
                                contents: ctn.toString(),
                                loader: "ts"
                            }
                        });
                        build.onEnd(result => {
                            isreadyInjected = false;
                            console.log(`build ended with ${result.errors.length} errors`);
                            if (iswatch) {

                                console.log("refresh page");
                                callReloadServer(AUTORELOAD_PORT);
                            }

                        })
                    },
                }
            ],

            define: {
                'process.env.NODE_ENV': JSON.stringify(NODE_ENV), 
            },
        }

        if (iswatch) {
            console.log("watch");
            let es = await esbuild.context(buildOption);
            es.watch();
        } else {
            await esbuild.build(buildOption);
            console.log("rebuild");

        }

    },
    async buildBackend(needreload) {
        console.log("build backend");
        let iswatch = needreload != null;

        /** @type {esbuild.BuildOptions} */
        let buildOption = {
            entryPoints: ['./backend/src/main.ts'],
            bundle: true,
            outfile: './output/app.js',
            minify: true,
            platform: "node",
            plugins: [
                {
                    name: 'rebuild-notify',
                    setup(build) {
                        build.onEnd(result => {
                            console.log(`buildBackend ended with ${result.errors.length} errors`); 

                            if(!iswatch) return;
                            restartServer();
                        })
                    },
                }
            ]
        };


        if (iswatch) {
            console.log("watch");
            let es = await esbuild.context(buildOption);
            es.watch();
        } else {
            await esbuild.build(buildOption);
            console.log("build");
        }
    },
 
    runServer( ) { 
        runServer(); 
    },
    

    async runWatch() {
        createServer(AUTORELOAD_PORT);
        runServer();
        watchHtml();
        this.buildFrontend("refresh");
        this.buildBackend("refresh");

    },

    async buildAll() {
        await this.buildFrontend(null);
        await this.buildBackend(null);
    }

}





function readArg() {
    /** @type {{fun : string, arg : string} | null} */
    let result = {};

    const program = new Command();
    program
        .option('-f, --fun <string>', 'call any function from funsList ', "")
        .option('-a, --arg <string>', 'argument for function ', null);

    program.parse(process.argv);
    result = program.opts();

    return {
        program,
        result
    }

}

function run() {
    let argResult = readArg();
    let parsedCommandArg = argResult.result;
    if (parsedCommandArg == null ||
        parsedCommandArg.fun == null ||
        parsedCommandArg.fun == ""
    ) {
        console.log("Please use option -f or --fun");
        argResult.program.help();
        return;
    }

    console.log(parsedCommandArg);

    let fun = parsedCommandArg.fun;
    if (funsList[fun] != null) {
        funsList[fun](parsedCommandArg.arg);
    }

}

run();