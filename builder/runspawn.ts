import { spawn } from 'child_process';

export type SpawnTools = {
    stop : ()=>void;
}

export function runSpawn(myarg) : SpawnTools {
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
 
    return {
        stop(){
            command.kill();
        }
    } 
}