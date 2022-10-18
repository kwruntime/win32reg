import regedit from "npm://regedit@5.0.0"


export class Program{
    static async main(){

        
        let time = Date.now() 

        await regedit.promisified.createKey([
            `HKCU\\SOFTWARE\\Classes\\Test1`,
            `HKCU\\SOFTWARE\\Classes\\Test1\\DefaultIcon`
        ])
		

        await regedit.promisified.putValue({
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
	
        let res = await regedit.promisified.list("HKCU\\SOFTWARE\\Classes\\Test1\\DefaultIcon")
        
        console.info("Operation time.", Date.now() - time)
		console.info("Result:", res)
		
    }
}