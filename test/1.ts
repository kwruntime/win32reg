import {Registry} from '../src/mod'


export class Program{
    static async main(){

        let reg = new Registry()
        await reg.start()
        
        await reg.createKeys([
            `HKCU\\SOFTWARE\\Classes\\Test1`,
            `HKCU\\SOFTWARE\\Classes\\Test1\\DefaultIcon`
        ])

        await reg.putValues({
            "HKCU\\SOFTWARE\\Classes\\Test1\\DefaultIcon":{
                "default": {
                    type: "REG_DEFAULT",
                    value: "Valor 1"
                },
                "Name": {
                    type: "REG_SZ",
                    value: "Probando registro"
                }
            }
        })
        

        let key = reg.currentUser.openSubKey("SOFTWARE\\Classes\\Test1\\DefaultIcon")
        let values = await key.getAllValues()
        key.dispose()

        console.info("Res:", values)
	
		reg.close()
    }
}