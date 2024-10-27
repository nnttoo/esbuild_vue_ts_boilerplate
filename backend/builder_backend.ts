import * as esbuild from 'esbuild' 
import { Command } from "commander";


async function buildBackend(arg : {
    iswatch : boolean,
    FILE_INPUT : string,
    FILE_OUTPUT: string,
    RestartServerCommand : string

}) { 
    let iswatch = arg.iswatch;
    let FILE_INPUT = arg.FILE_INPUT;
    let FILE_OUTPUT = arg.FILE_OUTPUT; 

    /** @type {esbuild.BuildOptions} */
    let buildOption = {
        entryPoints: [FILE_INPUT],
        bundle: true,
        outfile: FILE_OUTPUT,
        minify: true,
        platform: "node",
        plugins: [
            {
                name: 'rebuild-notify',
                setup(build) {
                    build.onEnd(result => {
                        console.log(`buildBackend ended with ${result.errors.length} errors`); 

                        if(!iswatch) return; 
                        console.log(arg.RestartServerCommand) 
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

function run(){
    const program = new Command();
    program
        .option('-w, --watch', 'call any function from funsList ', "") 

    program.parse(process.argv);
    let opt = program.opts<{
        watch : boolean
    }>();
 
    console.log(opt);

    buildBackend({
        FILE_INPUT : "./src/main.ts",
        FILE_OUTPUT : "../output/app.js",
        iswatch : opt.watch,
        RestartServerCommand : "CmsRestartServer"
    })

}

run();