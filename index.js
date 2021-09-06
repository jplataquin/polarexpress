const fs 	    = require('fs');
const http      = require('http');
const https     = require('https');

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function fragment(path,data){

    let frag = fs.readFileSync(path,'utf8');
  
    if(typeof data == 'undefined'){
        data = {};
    }

    data.__unique = uuidv4();

    for(let key in data){
        frag = frag.replaceAll("{{"+key.trim()+"}}", data[key]);
    }

    frag = frag.replaceAll(/\{\{(.*)\}\}/g,'');

    return frag;
}

function serveHTML(res,text){
    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(text));
}


function viewFactory(res){

    return (file,data,flag)=>{
                
        if(!flag){
            serveHTML(res,fragment(file,data));
            return true;
        }

        return fragment(file,data)
        
    }
}


module.exports = class PolarExpress {

    constructor(express,config){

        this.express    = express;
        this.app        = new this.express();
        config          = config ?? {}

        this.option = {};

        if(!typeof config.key == 'undefined' && !typeof config.cert == 'undefined'){
            this.option = {
                key: fs.readFileSync(config.key),
                cert: fs.readFileSync(config.cert),
            }
        }
    }

    get(path,middleware,callback){
        
        if(typeof callback == 'undefined'){
            callback = middleware;
            middleware = [];
        }

        this.app.get(path, async function(req, res){
            
            let answer = {};

            for(let i = 0; i <= middleware.length - 1; i++){
                
                answer = await middleware[i]({req:req, res:res, result:answer});
                
                if(answer === false){
                    break;
                }
            }

            callback({req:req,res:res,result:answer},viewFactory(res));
        });
    }

    post(path,middleware,callback){
        
        if(typeof callback == 'undefined'){
            callback = middleware;
            middleware = [];
        }

        this.app.post(path, async function(req, res){
            
            let answer = {};

            for(let i = 0; i <= middleware.length - 1; i++){
                
                answer = await middleware[i]({req:req, res:res, result:answer});

                if(answer === false){
                    break;
                }
            }

            callback({req:req,res:res,result:answer},viewFactory(res));
        });
    }

    static(url,path){
        this.app.use(url,this.express.static(path));
    }

    port(port,callback){

        callback  = callback ?? function(){};

         if(this.option.cert && this.option.key){

            https.createServer(this.options, this.app).listen(port, function(){
 
                callback();
            });

         }else{

            http.createServer(this.options, this.app).listen(port, function(){
 
                callback();
            });
            
         }
    }
}

