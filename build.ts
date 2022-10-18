
import {Builder} from '/data/projects/Kodhe/kwruntime/std/package/compiler/build.ts'
import fs from 'fs'
import Path from 'path'
import { Program as GenDts } from './gendts.ts'

export class Program{
    static async main(){

        await GenDts .main()

        let root = Path.join(__dirname, "src")
        let workingFolder = Path.join(__dirname, "dist")
        let npmModuleFolder = Path.join(__dirname, "npm")
	    if(!fs.existsSync(workingFolder)) fs.mkdirSync(workingFolder)
        if(!fs.existsSync(npmModuleFolder)){
            await fs.promises.mkdir(npmModuleFolder)
        }

        
        if(fs.existsSync(Path.join(npmModuleFolder, "types"))){
            await fs.promises.rm(Path.join(npmModuleFolder, "types"),{
                recursive: true
            })
        }
        await fs.promises.cp(Path.join(root,"types"), Path.join(npmModuleFolder, "types"), {
            recursive: true
        })

        let files = await fs.promises.readdir(Path.join(npmModuleFolder, "types"))
        for(let file of files){
            if(file.endsWith(".ts")){
                await fs.promises.rename(Path.join(npmModuleFolder, "types", file), Path.join(npmModuleFolder, "types", file.substring(0,file.length-3) + ".d.ts"))
            }
        }


        let filesToCopy = {
            "src/package.json": "package.json",
            "src/.npmignore":   ".npmignore",
            "README.md": "README.md"
        }
        for(let [id, file] of Object.entries<string>(filesToCopy)){
            let src = Path.join(__dirname, id)
            let dest = Path.join(npmModuleFolder, file)
            if(fs.existsSync(src)){
                await fs.promises.cp(src, dest)
            }
        }


        let builder = new Builder({
            target: 'node',
            externalModules: ["gitlab://jamesxt94/packages@main/com.kodhe.typedotnet/0.1.7.kwb"]
        })


        let rep = `const x = "@kwruntime" + "/typedotnet"
        const {Batch, Dotnet} = require(x)`

        let content = await fs.promises.readFile(Path.join(root, "mod.ts"), "utf8")
        await fs.promises.writeFile(Path.join(root, "mod_1.ts"), content.replace('import {Batch, Dotnet} from "gitlab://jamesxt94/packages@main/com.kodhe.typedotnet/0.1.7.kwb"', rep))
        
        await builder.compile(Path.join(root, "mod_1.ts"))
        await fs.promises.rm(Path.join(root, "mod_1.ts"))
        await builder.writeTo(Path.join(npmModuleFolder, "main.js"))

    }
}