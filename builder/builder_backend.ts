import vuePlugin from "esbuild-plugin-vue3";
import { callReloadServer } from "simplepagereloader/server";
import * as esbuild from 'esbuild'
import fs from "fs/promises"


export async function buildBackend(arg : {
    iswatch : boolean,
    FILE_BACKEND_SRC : string,
    FILE_BACKEND_APP: string,
    restartServer : ()=>void

}) { 
    let iswatch = arg.iswatch;
    let FILE_BACKEND_SRC = arg.FILE_BACKEND_SRC;
    let FILE_BACKEND_APP = arg.FILE_BACKEND_APP;
    let restartServer = arg.restartServer;

    /** @type {esbuild.BuildOptions} */
    let buildOption = {
        entryPoints: [FILE_BACKEND_SRC],
        bundle: true,
        outfile: FILE_BACKEND_APP,
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
        let es = await esbuild.context(buildOption as any);
        es.watch();
    } else {
        await esbuild.build(buildOption as any);
        console.log("build");
    }
}