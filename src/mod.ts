import Exception from 'gh+/kwruntime/std@1.1.19/util/exception.ts'
import {Batch, Dotnet} from "gitlab://jamesxt94/packages@main/com.kodhe.typedotnet/0.1.7.kwb"

const KindToType = {
    "String": "REG_SZ",
    "Binary": "REG_BINARY",
    "DWord": "REG_DWORD",
    "ExpandString": "REG_EXPAND_SZ",
    "MultiString": "REG_MULTI_SZ",
    "QWord": "REG_QWORD"
}


export interface RegKeyValue{
    name?: string 
    type: 'REG_SZ' | 'REG_BINARY' | 'REG_DWORD' | 'REG_EXPAND_SZ' | 'REG_MULTI_SZ' | 'REG_QWORD' | 'Unknown',
    value: any 
}

export interface RegKeyValues{
    [key: string]: RegKeyValue
}


export class RegItem{

    root: string 
    name: string 
    $reg: Registry
    $batch: Batch


    constructor(reg: Registry, root: string, name: string){
        this.$reg = reg 
        this.root = root 
        this.name= name
    }


    openSubKey(name: string){
        let p = []
        if(this.name) p.push(this.name)
        p.push(name)

        let item = new RegItem(this.$reg, this.root, p.join("\\"))
        return item 
    }

    get batch(){
        if(!this.$batch){
            this.$batch = this.$reg.$dotnet.batch()
        }
        return this.$batch
    }

    /**
     * Returns if this key exists
     * 
     * @returns false or true
     */
    async exists(){
        let batch = this.batch
        let okeys = await this.$reg.$OpenKeys(batch, [this.root + "\\" + this.name], false)
        let ok =  !(await batch.wait(batch.utils.IsNull(okeys[0].subkey)))
        if(ok){
            if(okeys?.[0].disposable)
                okeys[0].subkey?.Dispose()
        }
        return ok
    }
    
    /**
     * Create this key if no exists
     * 
     * @returns @this
     */
    async create(){
        await this.$reg.createKeys([this.root +"\\" + this.name])
        return this
    }


    /**
     * Create a subkey and returns a RegItem object with new key created
     * 
     * @returns RegItem object with new key
     */
    async createSubKey(name: string){
        await this.$reg.createKeys([this.root +"\\" + this.name + "\\" + name])
        return this.openSubKey(name)
    }

    /**
     * Delete the specified subkey(s)
     * 
     * @params subkeys = Subkey(s) to be created
     * @returns @this
     */
    async deleteSubKey(subkeys: string | Array<string>){
        if(typeof subkeys == "string") subkeys = [subkeys]
        let names = subkeys.map((a) => this.root +"\\" + this.name + "\\" + a)
        await this.$reg.deleteKeys(names)
        return this 
    }


    /**
     * Get the value names from this key
     * 
     * @returns array of strings with names
     */
    async getValueNames(){
        let okeys = null
        try{
            let batch = this.batch
            okeys = await this.$reg.$OpenKeys(batch, [this.root + "\\" + this.name], false)
            return await batch.wait(okeys[0].subkey.GetValueNames())
        }catch(e){
            throw e
        }
        finally{
            if(okeys?.[0].disposable)
                okeys[0].subkey?.Dispose()
        }
    }

    /**
     * Get the subkeys from this key
     * 
     * @returns array of strings with subkeys
     */
    async getSubKeyNames(){
        let okeys = null
        try{
            let batch = this.batch
            okeys = await this.$reg.$OpenKeys(batch, [this.root + "\\" + this.name], false)
            return await batch.wait(okeys[0].subkey.GetSubKeyNames())
        }catch(e){
            throw e
        }
        finally{
            if(okeys?.[0].disposable)
                okeys[0].subkey?.Dispose()
        }
    }

    /**
     * Get all values from this key
     * 
     * @returns array of RegKeyValue
     */
    async getAllValues(){
        let valuenames = await this.getValueNames()
        let values = new Array<any>()
        for(let item of valuenames){
            values.push(await this.getValue(item))
        }
        return values
    }

    /**
     * Get the specified value  from this key
     * 
     * @params name: name of value to get
     * @returns RegKeyValue
     */
    async getValue(name: string){
        let okeys = null
        try{
            let batch = this.batch
            okeys = await this.$reg.$OpenKeys(batch, [this.root + "\\" + this.name], false)
            let list = batch.static("System.Collections.Generic.List<System.Object>").construct()
            list.Add(okeys[0].subkey.GetValue(name))
            list.Add(okeys[0].subkey.GetValueKind(name).ToString())
            let result = await batch.wait(list)
            let item = {
                name,
                type: KindToType[result[1]] || "Unknown",
                value: result[0]
            }

            list.Clear()
            return item 

        }catch(e){
            throw e
        }
        finally{
            if(okeys?.[0].disposable)
                okeys[0].subkey?.Dispose()
        }
    }


    /**
     * Free memory. Call after work with this key
     */
    async dispose(){
        if(this.$batch){
            await this.$batch.finish()
        }
    }




}

export class Registry {
    static translations = {
        "HKCU": "HKEY_CURRENT_USER",
        "HKLM": "HKEY_LOCAL_MACHINE",
        "HKCR": "HKEY_CLASSES_ROOT",
        "HKUS": "HKEY_USERS",
        "HKCC": "HKEY_CURRENT_CONFIG"
    }

    $dotnet : Dotnet 

    $regs = {
        CurrentUser: null,
        LocalMachine: null,
        ClassesRoot: null,
        CurrentConfig: null,
        Users: null
    }


    get currentUser(): RegItem{
        return this.$regs.CurrentUser
    }

    get localMachine(): RegItem{
        return this.$regs.LocalMachine
    }

    get classesRoot(): RegItem{
        return this.$regs.ClassesRoot
    }

    get currentConfig(): RegItem{
        return this.$regs.CurrentConfig
    }

    get users(): RegItem{
        return this.$regs.Users
    }



     /**
     * Start library. Execute this method before all operations with win32 registry
     */
    async start(){

        this.$dotnet = new Dotnet()
        let runtimes = await Dotnet.availableRuntimes()
        let runtime = runtimes.filter((a) => a.platform == "netcore")[0]
        if(!runtime || runtime.platform != "win32"){
            runtime = runtimes.filter((a) => a.platform == "netframework")[0]
        }
        await this.$dotnet.start((a) =>  a.platform  == runtime.platform && a.version == runtime.version)

        if(runtime.platform == "netcore"){
            // netcore requires load assembly, netframework not
            let batch = this.$dotnet.batch()
            batch.kodnet.$LoadAssembly("Microsoft.Win32.Registry, Culture=neutral")
            await batch.finish()
        }



        this.$regs.CurrentUser = new RegItem(this, "HKCU", "")
        this.$regs.LocalMachine = new RegItem(this, "HKLM", "")
        this.$regs.ClassesRoot = new RegItem(this, "HKCR", "")
        this.$regs.CurrentConfig = new RegItem(this, "HKCC", "")
        this.$regs.Users = new RegItem(this, "HKUS", "")
    }

     /**
     * Execute this method after all operations finished
     */
	close(){
		return this.$dotnet?.close()
	}


    async $OpenKeys(batch: Batch, keys: Array<string>, writable = false, deletemode = false){

        let nkeys = new Array<any>()

        try{
            let regClass = batch.static("Microsoft.Win32.Registry")
            let win32KeyRoots = {
                "HKEY_CURRENT_USER": regClass.CurrentUser(),
                "HKEY_LOCAL_MACHINE": regClass.LocalMachine(),
                "HKEY_CLASSES_ROOT": regClass.ClassesRoot(),
                "HKEY_CURRENT_CONFIG": regClass.CurrentConfig(),
                "HKEY_USERS": regClass.Users()
            }

            
            for(let key of keys){
                let cid = key
                for(let id in Registry.translations){
                    if(key.startsWith(id)){
                        key = Registry.translations[id] +  key.substring(id.length)
                        break 
                    }
                }
                let parts = key.split("\\")
                let root = parts[0]
                let registry = win32KeyRoots[root]
                
                let name = parts.slice(1).join("\\")

                let subkey = null 
                if(!deletemode){
                    if(name){
                        subkey = registry.OpenSubKey(name, writable)
                    }
                    else{
                        subkey = registry
                    }
                }
                else{
                    registry.DeleteSubKey(name, false)
                }

                nkeys.push({
                    id: cid,
                    root,
                    disposable: subkey && (subkey != registry),
                    name, 
                    registry,
                    subkey
                })
            }

            
            return nkeys
        }catch(e){
            await this.$Free(batch, nkeys)
            throw e 
        }
        
    }

    async $Free(batch: Batch, keys: Array<any>){
        // free ...
        for(let key of keys){
            if(key.disposable)
                key.subkey?.Dispose()       
        }

        try{
            await batch.finish()
        }
        catch(e){}
    }

    /**
     * Create the keys/subkeys in Windows registry
     *
     * @remarks
     * If key to create exists, parameter ignored, no error thrown.
     * 
     * @param keys - Array with keys to create
     */
    async createKeys(keys: Array<string>){

        if(!keys.length) return


        let batch = this.$dotnet.batch()
        let okeys = await this.$OpenKeys(batch, keys, false)

        try{            
            // create keys if required 
            let ListBool = batch.static("System.Collections.Generic.List<System.Boolean>").construct()
            for(let key of okeys){                
                ListBool .$Add(batch.utils.IsNull(key.subkey))
            }

            let arr = await batch.wait(ListBool)
            for(let i=0;i< okeys.length;i++){
                if(arr[i]){
                    // create subkey 
                    let key = okeys[i]
                    key.registry.CreateSubKey(key.name)
                }
            }
            await batch.execute()

        }catch(e){
            throw e
        }
        finally{
            await this.$Free(batch, okeys)
        }
    }

    /**
     * Delete the keys/subkeys in Windows registry
     *
     * @remarks
     * If key doesn't exists, is ignored, no error thrown
     * 
     * @param keys - Array with keys to remove
     */
    async deleteKeys(keys: Array<string>){

        if(!keys.length) return
        
        let batch = this.$dotnet.batch()
        try{
            await this.$OpenKeys(batch, keys, false, true)
        }catch(e){
            throw e 
        }
        finally{
            await batch.finish()
        }

    }

    /**
     * Return the keys/subkeys in Windows registry, with respective values
     * 
     * @param keys - Array with keys to list
     * @returns An object with keys with values
     */
    async list(keys: string | Array<string>): Promise<{[key: string]: RegKeyValues}>{

        if(typeof keys == "string") keys = [keys]

        
        if(!keys.length) return

        
        let batch = this.$dotnet.batch()
        let nkeys = await this.$OpenKeys(batch, keys, false)

        try{

			let valueTypes = {
                "String": "REG_SZ",
                "Binary": "REG_BINARY",
                "DWord": "REG_DWORD",
                "ExpandString": "REG_EXPAND_SZ",
                "MultiString": "REG_MULTI_SZ",
                "QWord": "REG_QWORD"
            }

            let ListClass = batch.static("System.Collections.Generic.List<System.Object>")
            let DictionaryClass = batch.static("System.Collections.Generic.Dictionary<System.String, System.Object>")

            let List = ListClass.construct()
            let response: any = {}
            for(let i=0;i< nkeys.length;i++){
                let key = nkeys[i]

                // abrir en modo writable
                let subkey = key.subkey
                List.Add(subkey.GetSubKeyNames())
                List.Add(subkey.GetValueNames())
                let dvalues = await batch.wait(List)
                List.Clear()

                let values = dvalues[1]
                response[key.id] = {
                    keys: dvalues[0],
                    values: {}
                }

                let ItemList = ListClass.construct()
                
                for(let value of values){
					let dict = DictionaryClass.construct()
                    dict[".set.Item"]("value", subkey.GetValue(value, null))
                    dict[".set.Item"]("type", subkey.GetValueKind(value).ToString())
                    ItemList.Add(dict)
                }

                let arr = await batch.wait(ItemList)
                for(let value of values){
					let o = arr.shift()
					if(!value){
						o.type = 'REG_DEFAULT'
						value = ''
					}
					else{
						o.type = valueTypes[o.type ]
					}
					delete o.$id 
                    response[key.id].values[value] = o
                }
            }

            return response


        }catch(e){
            throw e 
        }
		
		finally{
            await this.$Free(batch, nkeys)
        }
		

    }   

    /**
     * Delete the values in specified keys/subkeys. 
     * Example: {"HKCU\\Classes\\Test": ["Name1", "Name2", ...]}
     * 
     * @param keys - Object with {key => values to deleted}      
     */
    async deleteValues(keys: {[key: string]: Array<string>}){

        let values = Object.values(keys)
        if(values.length < 1) return 

        let ckeys = Object.keys(keys)
        let batch = this.$dotnet.batch()
        let nkeys = await this.$OpenKeys(batch, ckeys, true)

        try{

            
            for(let i=0;i< nkeys.length;i++){
                let key = nkeys[i]

                // abrir en modo writable
                let subkey = key.subkey
                let arr = values[i]
                if(arr?.length){
                    for(let item of arr){
                        subkey.DeleteValue(item, false)
                    }
                }
            }
            await batch.execute()
        }
        catch(e){
            throw e 
        }
        finally{
            await this.$Free(batch, nkeys)
        }

    }

    /**
     * Write the values in specified keys/subkeys. 
     * Example: {"HKCU\\Classes\\Test": { "Name1": { type: 'REG_SZ', value: "Test"} }}
     * 
     * @param keys - Object with {key => values to insert}      
     */
    async putValues(keys: {[key: string]: RegKeyValues}){

        let values = Object.values(keys)
        if(values.length < 1) return 

        let ckeys = Object.keys(keys)
        let batch = this.$dotnet.batch()
        let nkeys = await this.$OpenKeys(batch, ckeys, true)

        try{

            let kind = batch.static("Microsoft.Win32.RegistryValueKind")
            let valueTypes = {
                "REG_SZ": "String",
                "REG_BINARY": "Binary",
                "REG_DWORD": "DWord",
                "REG_EXPAND_SZ": "ExpandString",
                "REG_MULTI_SZ": "MultiString",
                "REG_QWORD": "QWord"
            }
            let valueTypesCache : any = {}
            for(let i=0;i< nkeys.length;i++){
                let key = nkeys[i]

                // abrir en modo writable
                let subkey = key.subkey
                let entries = Object.entries<any>(values[i])

                for(let [id, item] of entries){

                    if(item.type == "REG_DEFAULT"){
                        subkey.$SetValue("", item.value);
                    }
                    else{

                        let kindValue = valueTypesCache[item.type] 
                        if(kindValue === undefined){
                            let c = valueTypes[item.type]
                            if(c === undefined){
                                throw Exception.create(`${c} is not a valid type value`).putCode("INVALID_ARGUMENT")
                            }
                            kindValue = kind[c]()
                            valueTypesCache[item.type] = kindValue
                        }
                        subkey.$SetValue(id, item.value, kindValue)
                    }
                }
            }
            await batch.execute()
        }
        catch(e){
            throw e 
        }
        finally{
            await this.$Free(batch, nkeys)
        }

    }

}