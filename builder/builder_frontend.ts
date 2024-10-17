import vuePlugin from "esbuild-plugin-vue3";
import { callReloadServer } from "simplepagereloader/server";
import * as esbuild from 'esbuild'
import fs from "fs/promises"

export async function buildFrontend(arg : {
    iswatch : boolean,
    FILE_FRONTEND_SRC : string,
    FILE_FRONTEND_APP : string,
    AUTORELOAD_PORT : number,
    NODE_ENV : string,
}) { 
    let iswatch = arg.iswatch;
    let FILE_FRONTEND_SRC = arg.FILE_FRONTEND_SRC;
    let FILE_FRONTEND_APP = arg.FILE_FRONTEND_APP;
    let AUTORELOAD_PORT = arg.AUTORELOAD_PORT;
    let NODE_ENV = arg.NODE_ENV;

    
    let isreadyInjected = false;

    /** @type {esbuild.BuildOptions} */
    let buildOption = {
        entryPoints: [FILE_FRONTEND_SRC],
        bundle: true,
        outfile: FILE_FRONTEND_APP,
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