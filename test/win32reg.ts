import {registry} from "npm://@kwruntime/win32reg@0.1.3"


export class Program{
    static async main(){

       
        let time = Date.now() 

        
        
        await registry.createKeys([
            `HKCU\\SOFTWARE\\Classes\\Test1`,
            `HKCU\\SOFTWARE\\Classes\\Test1\\DefaultIcon`
        ])
		

        await registry.putValues({
            "HKCU\\SOFTWARE\\Classes\\Test1\\DefaultIcon":{
                "default": {
                    type: "REG_DEFAULT",
                    value: "Valor 1"
                },
                "Name": {
                    type: "REG_SZ",
                    value: "Probando registro"
                },
				"Number1": {
                    type: "REG_DWORD",
                    value: 10
                },
				"Number2": {
                    type: "REG_DWORD",
                    value: 20
                }
            }
        })
	
        let res = await registry.list("HKCU\\SOFTWARE\\Classes\\Test1\\DefaultIcon")
        
        console.info("Operation time.", Date.now() - time)
		console.info("Result:", res)

        registry.close()
		
    }
}