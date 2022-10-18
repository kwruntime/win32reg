import { Batch, Dotnet } from "@kwruntime/typedotnet";
export interface RegKeyValue {
    name?: string;
    type: 'REG_SZ' | 'REG_BINARY' | 'REG_DWORD' | 'REG_EXPAND_SZ' | 'REG_MULTI_SZ' | 'REG_QWORD' | 'Unknown';
    value: any;
}
export interface RegKeyValues {
    [key: string]: RegKeyValue;
}
export declare class RegItem {
    root: string;
    name: string;
    $reg: Registry;
    $batch: Batch;
    constructor(reg: Registry, root: string, name: string);
    openSubKey(name: string): RegItem;
    get batch(): Batch;
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
export declare class Registry {
    static translations: {
        HKCU: string;
        HKLM: string;
        HKCR: string;
        HKUS: string;
        HKCC: string;
    };
    $dotnet: Dotnet;
    $regs: {
        CurrentUser: any;
        LocalMachine: any;
        ClassesRoot: any;
        CurrentConfig: any;
        Users: any;
    };
    get currentUser(): RegItem;
    get localMachine(): RegItem;
    get classesRoot(): RegItem;
    get currentConfig(): RegItem;
    get users(): RegItem;
    /**
    * Start library. Execute this method before all operations with win32 registry
    */
    start(): Promise<void>;
    /**
    * Execute this method after all operations finished
    */
    close(): any;
    $OpenKeys(batch: Batch, keys: Array<string>, writable?: boolean, deletemode?: boolean): Promise<any[]>;
    $Free(batch: Batch, keys: Array<any>): Promise<void>;
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
