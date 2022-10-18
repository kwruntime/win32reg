# @kwruntime/win32reg

Utility for read/write Windows registry. Of course, can work on x86/x64 machines (and sure amr, no tested). 

## How works?

Works using [@kwruntime/typedotnet](https://github.com/kwruntime/typedotnet), a library for interact with .NET Framework and .NET 6

In all Windows, .NET Framework is installed by default, so this library should work out the box. 


## Getting started. 

```typescript
import {Registry} from "@kwruntime/typdotnet"
// or 
const {Registry} = require("@kwruntime/typdotnet")


async function main(){
    const reg = new Registry()
    await reg.start() 

    // do all stuff
    ...
}
``` 

if you use [@kwruntime/core](https://github.com/kwruntime/core) you can import directly from URL: 

```typescript
// replace 0.1.0 with version or Git tag you want use:
import {Registry} from "github://kwruntime/win32reg@0.1.0/src/mod.ts"
```


This library usage is based on ```winreg-vbs```. 


```typescript
async function main(){
    const reg = new Registry()
    await reg.start() 

    try{
        await reg.putValues({
            'HKCU\\SOFTWARE\\MyApp': {
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

```typescript

export interface RegKeyValue {
    name?: string;
    type: 'REG_SZ' | 'REG_BINARY' | 'REG_DWORD' | 'REG_EXPAND_SZ' | 'REG_MULTI_SZ' | 'REG_QWORD' | 'Unknown';
    value: any;
}
export interface RegKeyValues {
    [key: string]: RegKeyValue;
}


export declare class Registry {

    // props for manage each key independently

    get currentUser(): RegItem
    get localMachine(): RegItem
    get classesRoot(): RegItem
    get currentConfig(): RegItem
    get users(): RegItem


    /**
    * Start library. Execute this method before all operations with win32 registry
    */
    start(): Promise<void>;
    /**
    * Execute this method after all operations finished
    */
    close(): any;
    /**
     * Create the keys/subkeys in Windows registry
     *
     * @remarks
     * If key to create exists, parameter ignored, no error thrown.
     *
     * @param keys - Array with keys to create
     */
    createKeys(keys: Array<string>): Promise<void>;
    /**
     * Delete the keys/subkeys in Windows registry
     *
     * @remarks
     * If key doesn't exists, is ignored, no error thrown
     *
     * @param keys - Array with keys to remove
     */
    deleteKeys(keys: Array<string>): Promise<void>;
    /**
     * Return the keys/subkeys in Windows registry, with respective values
     *
     * @param keys - Array with keys to list
     * @returns An object with keys with values
     */
    list(keys: string | Array<string>): Promise<{
        [key: string]: RegKeyValues;
    }>;
    /**
     * Delete the values in specified keys/subkeys.
     * Example: {"HKCU\\Classes\\Test": ["Name1", "Name2", ...]}
     *
     * @param keys - Object with {key => values to deleted}
     */
    deleteValues(keys: {
        [key: string]: Array<string>;
    }): Promise<void>;
    /**
     * Write the values in specified keys/subkeys.
     * Example: {"HKCU\\Classes\\Test": { "Name1": { type: 'REG_SZ', value: "Test"} }}
     *
     * @param keys - Object with {key => values to insert}
     */
    putValues(keys: {
        [key: string]: RegKeyValues;
    }): Promise<void>;
}

export declare class RegItem {
    root: string;
    name: string;
   
    /**
     * Returns if this key exists
     *
     * @returns false or true
     */
    exists(): Promise<boolean>;
    /**
     * Create this key if no exists
     *
     * @returns @this
     */
    create(): Promise<this>;
    /**
     * Create a subkey and returns a RegItem object with new key created
     *
     * @returns RegItem object with new key
     */
    createSubKey(name: string): Promise<RegItem>;
    /**
     * Delete the specified subkey(s)
     *
     * @params subkeys = Subkey(s) to be created
     * @returns @this
     */
    deleteSubKey(subkeys: string | Array<string>): Promise<this>;
    /**
     * Get the value names from this key
     *
     * @returns array of strings with names
     */
    getValueNames(): Promise<any>;
    /**
     * Get the subkeys from this key
     *
     * @returns array of strings with subkeys
     */
    getSubKeyNames(): Promise<any>;
    /**
     * Get all values from this key
     *
     * @returns array of RegKeyValue
     */
    getAllValues(): Promise<any[]>;
    /**
     * Get the specified value  from this key
     *
     * @params name: name of value to get
     * @returns RegKeyValue
     */
    getValue(name: string): Promise<{
        name: string;
        type: any;
        value: any;
    }>;
    /**
     * Free memory. Call after work with this key
     */
    dispose(): Promise<void>;
}

```



## Build this module

```bash 
kwrun build 
```