# @kwruntime/win32reg

Utility for read/write Windows registry. Of course, can work on x86/x64 machines (and sure amr, no tested). 

NO NATIVE DEPENDENCIES.




## How works?

Works using [@kwruntime/typedotnet](https://github.com/kwruntime/typedotnet), a library for interact with .NET Framework and .NET 6

In all Windows, .NET Framework is installed by default, so this library should work out the box. 


## Getting started. 


> NOTE: version 0.1.1 was broken. Doesn't use


```typescript
import {registry} from "@kwruntime/win32reg"
// or 
const {registry} = require("@kwruntime/win32reg")


async function main(){
    
    await registry.createKeys(['HKLM\\SOFTWARE\\MyApp', 'HKCU\\SOFTWARE\\Foo'])

    // all stuff 
    ...
    
}
``` 

or if you prefer for example, select the runtime to use: 


```typescript
import {Registry} from "@kwruntime/win32reg"
// or 
const {Registry} = require("@kwruntime/win32reg")


async function main(){
    
    let registry = new Registry()
    await registry.start("netframework") // or netframework

    await registry.createKeys(['HKLM\\SOFTWARE\\MyApp', 'HKCU\\SOFTWARE\\Foo'])

    // all stuff 
    ...
    
    // call after all operations
    registry.close()
}
``` 


if you use [@kwruntime/core](https://github.com/kwruntime/core) you can import directly from URL: 

```typescript
// replace 0.1.0 with version or Git tag you want use:
import {Registry, registry} from "github://kwruntime/win32reg@0.1.0/src/mod.ts"
```


This library usage is based on ```regedit```, but internally using a method completely different. Doesn't need cscript or vbscript, and not start a new process on each action. 


```typescript
async function main(){
    const reg = new Registry()
    await reg.start() 

    try{
        await reg.putValues({
            'HKCU\\SOFTWARE\\MyApp': {
                // default values are empty keys
                '': {
                    value: 'Default value',
                    type: 'REG_SZ'
                },
                'Company': {
                    value: 'Moo corp',
                    type: 'REG_SZ'
                },
                'Version': { ... }
            },
            'HKLM\\SOFTWARE\\MyApp2': { ... }
        })

        await reg.createKeys(['HKLM\\SOFTWARE\\MyApp', 'HKCU\\SOFTWARE\\Foo'])

        await reg.list(["HKLM\\SOFTWARE\\MyApp"])
    }catch(e){
        console.error("Caught errors:", e)
    }
    finally{
        reg.close()
    }
}

```

or using ```RegItem``` style: 

```typescript
async function main(){
    const reg = new Registry()
    await reg.start() 

    try{
        let key = await reg.localMachine.openSubKey("SOFTWARE\\MyApp")

        // created if required
        await key.create()

        let values = await key.getAllValues()
        
        await key.dispose()

    }catch(e){
        console.error("Caught errors:", e)
    }
    finally{
        reg.close()
    }
}

```


API Reference: 

- [See types definition](./src/types/mod.ts)



## Build this module

```bash 
kwrun build 
```