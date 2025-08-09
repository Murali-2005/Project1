class ExpressError extends Error{
    constructor(statusC, message){
        super();
        this.statusC=statusC;
        this.message=message;
    }
}

module.exports=ExpressError;