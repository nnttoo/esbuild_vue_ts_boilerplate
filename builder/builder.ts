import * as esbuild from 'esbuild'
import fs from "fs/promises"
import vuePlugin from 'esbuild-plugin-vue3';
import { Command } from "commander";
import dotenv from "dotenv"; 
import { callReloadServer, createServer } from "simplepagereloader/server"
import chokidar from "chokidar" 
dotenv.config();

import { spawn } from 'child_process';
import { runSpawn, SpawnTools } from './runspawn'; 
import { buildFrontend } from './builder_frontend';
import { buildBackend } from './builder_backend';



const NODE_ENV = process.env.NODE_ENV || 'development';
const AUTORELOAD_PORT = Number(process.env.AUTORELOAD_PORT || '9090'); 

const FILE_BACKEND_APP = "./output/app.js"
const FILE_FRONTEND_APP = "./output/public/app.js"
const FILE_FRONTEND_html = "./output/public/index.html" 
const FILE_FRONTEND_SRC = "./frontend/src/main.ts"
const FILE_BACKEND_SRC = "./backend/src/main.ts" 

class Builder{
    serverSpawn : SpawnTools | null;


    runServer(){
        console.log("run server");
        this.serverSpawn = runSpawn({
            name: "server",
            bin: "node",
            arg: [FILE_BACKEND_APP]
        }); 
    }

    restartServer(){
        if(this.serverSpawn == null) return;
        this.serverSpawn.stop();
        this.runServer();
        callReloadServer(AUTORELOAD_PORT);
    }

    watchHtml() { 
        let watcher  = chokidar.watch([ 
            FILE_FRONTEND_html
        ],{
            persistent : true
        });
    
        watcher.on("change",()=>{
            console.log("html change")
            callReloadServer(AUTORELOAD_PORT);
        })
    }

    async buildFrontend(iswatch : string){ 
        await buildFrontend({
            AUTORELOAD_PORT : AUTORELOAD_PORT,
            FILE_FRONTEND_APP : FILE_FRONTEND_APP,
            FILE_FRONTEND_SRC : FILE_FRONTEND_SRC,
            iswatch : iswatch == "refresh",
            NODE_ENV : NODE_ENV
        });
    }

    async buildBackend(iswatch : string){
        await buildBackend({
            FILE_BACKEND_APP : FILE_BACKEND_APP,
            FILE_BACKEND_SRC : FILE_BACKEND_SRC,
            iswatch : iswatch == "refresh",
            restartServer : ()=>{
                this.restartServer();
            }
        });
    }

    runWatch() {
        createServer(AUTORELOAD_PORT);
        this.runServer();
        this.watchHtml();
        this.buildFrontend("refresh");
        this.buildBackend("refresh");
    
    }

    readArg() {
        /** @type {{fun : string, arg : string} | null} */
        let result : {
            fun : string,
            arg : string,
        } = {
            fun : "",
            arg : ""
        };
    
        const program = new Command();
        program
            .option('-f, --fun <string>', 'call any function from funsList ', "")
            .option('-a, --arg <string>', 'argument for function ', "");
    
        program.parse(process.argv);
        result = program.opts();
    
        return {
            program,
            result
        }
    
    }

    run(){
        let argResult = this.readArg();
        let parsedCommandArg = argResult.result;
        if (parsedCommandArg == null ||
            parsedCommandArg.fun == null ||
            parsedCommandArg.fun == ""
        ) {
            console.log("Please use option -f or --fun");
            argResult.program.help();
            return;
        }

        let listexporstFun : {[key : string] : any} ={
            "buildFrontend" : this.buildFrontend.bind(this),
            "buildBackend" : this.buildBackend.bind(this),
            "runWatch" : this.runWatch.bind(this),
            "buildAll" : async ()=>{
                await this.buildBackend("");
                await this.buildFrontend("");
            },
            "runServer" : this.runServer.bind(this)
        }
    
        console.log(parsedCommandArg);

        if(listexporstFun[parsedCommandArg.fun] != null &&
            typeof listexporstFun[parsedCommandArg.fun] == "function" 
        )   {

            listexporstFun[parsedCommandArg.fun](parsedCommandArg.arg)
        }
    }
}

let builder = new Builder();
builder.run();
