import vuePlugin from "esbuild-plugin-vue3";
import { callReloadServer } from "simplepagereloader/server";
import * as esbuild from 'esbuild'
import fs from "fs/promises"
import { Command } from "commander";

async function buildFrontend(arg : {
    iswatch : boolean,
    FILE_INPUT : string,
    FILE_OUTPUT : string,
    AUTORELOAD_PORT : number,
    NODE_ENV : string,
}) { 
    let iswatch = arg.iswatch;
    let fileInput = arg.FILE_INPUT;
    let fileOutput = arg.FILE_OUTPUT;
    let AUTORELOAD_PORT = arg.AUTORELOAD_PORT;
    let NODE_ENV = arg.NODE_ENV;

    
    let isreadyInjected = false;

    /** @type {esbuild.BuildOptions} */
    let buildOption = {
        entryPoints: [fileInput],
        bundle: true,
        outfile: fileOutput,
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
                        let ctn = (await fs.readFile(args.path)).toString();
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
        let es = await esbuild.context(buildOption as any);
        es.watch();
    } else {
        await esbuild.build(buildOption as any);
        console.log("rebuild");

    }

}

function run(){
    const program = new Command();
    program
        .option('-w, --watch <string>', 'Insert  AUTORELOAD_PORT', "") 

    program.parse(process.argv);
    let opt = program.opts<{
        watch : string
    }>();

    let autoreloadPort = 8989;
    let nodeEnv = "production";
    let iswatch = opt.watch != "";

    if(iswatch){
        autoreloadPort = Number(opt.watch);
        nodeEnv = "development";
    }

 
    console.log(opt);

    buildFrontend({
        FILE_INPUT : "./src/main.ts", 
        FILE_OUTPUT : "../output/public/app.js",
        AUTORELOAD_PORT : autoreloadPort, 
        NODE_ENV : nodeEnv,
        iswatch :iswatch, 
    })

}

run();