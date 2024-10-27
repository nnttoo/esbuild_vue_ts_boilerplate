import * as esbuild from 'esbuild'
import fs from "fs/promises"
import vuePlugin from 'esbuild-plugin-vue3';
import { Command } from "commander";
import dotenv from "dotenv"; 
import { callReloadServer, createServer } from "simplepagereloader/server"
import chokidar from "chokidar" 
dotenv.config();

import { spawn } from 'child_process';  
import { runSpawn, SpawnTools } from './builder_runspawn';


const NODE_ENV = process.env.NODE_ENV || 'development';
const AUTORELOAD_PORT = Number(process.env.AUTORELOAD_PORT || '9090');  
const FILE_FRONTEND_html = "./output/public/index.html"  

class Builder{
    serverSpawn : SpawnTools | null;


    runServer(){
        console.log("run server");
        this.serverSpawn = runSpawn({
            name: "server",
            bin: "node",
            arg: ["./app.js"],
            cwd : "./output",
            sheel : false,
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

    async buildFrontend(refresh : string){ 
        let iswatchB = refresh == "refresh";

        let watchCommand = "";
        if(iswatchB){
            watchCommand = " -w " + AUTORELOAD_PORT
        }

        runSpawn({
            name : "buildbackend",
            cwd : "./frontend",
            bin : "npx",
            arg : ["tsx ./builder_frontend.ts " + watchCommand],
            sheel : true 
        });  
    }

    async buildBackend(refresh : string){
        let iswatchB = refresh == "refresh";

        let watchCommand = "";
        if(iswatchB){
            watchCommand = " -w"
        }

        runSpawn({
            name : "buildbackend",
            cwd : "./backend",
            bin : "npx",
            arg : ["tsx ./builder_backend.ts " + watchCommand],
            sheel : true,
            onData : (d)=>{

                if(d.indexOf("CmsRestartServer") > -1){
                    this.restartServer();
                } 
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


        let argResult = this.readArg();
        let parsedCommandArg = argResult.result;
        if (parsedCommandArg == null ||
            parsedCommandArg.fun == null ||
            parsedCommandArg.fun == ""
        ) {
            console.log("Please use option -f or --fun");
            
            console.log(Object.keys(listexporstFun));
            argResult.program.help();
            return;
        }

        
    
        console.log(parsedCommandArg);

        if(listexporstFun[parsedCommandArg.fun] != null &&
            typeof listexporstFun[parsedCommandArg.fun] == "function" 
        )   {

            listexporstFun[parsedCommandArg.fun](parsedCommandArg.arg)
            return;
        } 

        
        console.log(Object.keys(listexporstFun));
    }
}

let builder = new Builder();
builder.run();
