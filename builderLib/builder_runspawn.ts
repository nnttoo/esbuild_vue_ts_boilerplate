import { spawn } from 'child_process';
import treekill from 'treekill';

function sleep(n : number){
    return new Promise((r,x)=>{
        setTimeout(r,n);
    })
}

function killTreekill(pid : any){
    console.log("kill with tree kill " + pid);
    treekill(pid, 'SIGTERM', (err) => {
        if (err) {
            console.error(`Error killing process tree: ${err}`);
        } else {
            console.log(`Process ${pid} and its children have been killed.`);
        }
    });
}


let activeProcesses: number[] = [];

function removeProcess(pid: number) {
    console.log("removeProcess : " + pid)
    activeProcesses = activeProcesses.filter((p) => p !== pid);
}

let cleanUpStillRun = false;
async function cleanupProcesses(n:string) {
    while(cleanUpStillRun){
        await sleep(100)
    }

    cleanUpStillRun = true;

    console.log("cleanupProcesses : " + n); 
    activeProcesses.forEach((pid) => {
        console.log(' Killing  processes ' + pid);
        killTreekill(pid);
    });

    while(activeProcesses.length > 0){
        await sleep(100);
    } 
    cleanUpStillRun = false;
    process.exit(0);
}
 
process.on('SIGINT', ()=>{
    cleanupProcesses("sigint")
    //process.exit();
});
process.on('SIGTERM', ()=>{
    cleanupProcesses("SIGTERM")
});
process.on('exit', ()=>{
    cleanupProcesses("exit");
});

export type SpawnTools = {
    stop : ()=>Promise<void>;
    promise : Promise<any>
}

export function runSpawn(myarg : {
    bin : string,
    name : string,
    arg : string[],
    cwd : string | undefined,
    sheel : boolean, 
    onData? : (s : string)=>void;
}) : SpawnTools {
    let command = spawn(myarg.bin, myarg.arg,{
        cwd : myarg.cwd,
        shell : myarg.sheel,

    });

    activeProcesses.push(command.pid);

    let print = (msgIn) => {
        let msg = msgIn + "";
        msg = msg.trim();
        console.log(`[${myarg.name}] ${msg}`);
    }
    command.stdout.on('data', (data) => {
        if(myarg.onData){
            myarg.onData(data + "");
        }
        print(data);
    });
    command.stderr.on("error",(err)=>{
        print(err);
    })
    command.stderr.on('data', (data) => {
        print(data);
    });
    command.on('exit', (code) => {
        print(code);
        removeProcess(command.pid);
    });

    print("PID : " + command.pid);

    let p = new Promise((r,x)=>{
        command.on("exit",(e)=>{
            r(null);
        });
    })
    
    return {
        promise : p,
        async stop(){ 
            killTreekill(command.pid);
            while(activeProcesses.indexOf(command.pid) > -1){
                await sleep(100);
            }
        }
    } 
}

