/* 
Input:
   {type: "Scene", body: Array(4)}
   body: Array(4)
   0:
   arguments: Array(1)
   0: {type: "ObjectLiteral", value: "Scene"}
   length: 1
   __proto__: Array(0)
   name: "Black"
   type: "CallExpression"

   1: {type: "CallExpression", name: "Green", arguments: Array(1)}
   2: {type: "CallExpression", name: "Size", arguments: Array(1)}
   3: {type: "CallExpression", name: "Position", arguments: Array(3)}
*/ 

//how can we transform this so this so it's more three.js friendly?
//how do we form appropriate objects

/*
Output:
{
  "tag": "Scene", //is scene mandatory like main() or no?
  "attr": {
    "background": white (by default unless otherwise),
    "camera": 100, ?
    "viewBox": "0 0 100 100",
    "version": "1.1"
  },
  "body": [
  {               
    "tag": "SceneObject_1",    //here is where we have to form ENTIRE objects
    "attr": {
      "color": green or #0x00ff00,   //how do we handle color translations?
      "geometry": cube,
      "size": 1,
      "position": {x : 0 , y : 0, z: -1},
    },
  }] END OF BODY
}
*/
export default function transformer(AST){
    var three_ast = { 
        tag : 'Scene',
        attr : {
            background : 0xffffff,
            color : 0xffffff,
            intensity : 1, //why even have this default if we're not allowing customization
        },
        body : []
    };
    var scene_object_count = 0;
    // var light_object_count = 0; //is it necessary to have a light counter? Explain why

    while(AST.body.length > 0){
        var node = AST.body.shift();
        // console.log(node);
        //we have to wade through our call expressions and dig into their arugments. 
        //We first check that color is the start of an expression 
        if(node.start_of_expression){
            //it can be a scene literal where we grab 1 thing in itself
            if(node.arguments[0].type === 'SceneLiteral'){
                var scene_alteration = {
                    tag : 'SceneAlteration',
                    attr: {
                        background : node.name,
                    }
                }
                three_ast.body.push(scene_alteration);
            }
            //or it can or a shape literal where we have to grab next 3 things
            else if(node.arguments[0].type === 'ShapeLiteral'){
                var scene_object = {
                    tag : 'SceneObject',
                    id : ++scene_object_count,
                    attr : {
                        color : node.name,
                        geometry : node.arguments[0].value,
                    }
                }
                //if user forgot to add arguments to build a 3D object then throw error
                try{
                    //add size
                    var size = AST.body.shift();
                    scene_object.attr.size = size.arguments[0].value;
                    //add position
                    var pos = AST.body.shift();
                    scene_object.attr.pos = {
                        x : pos.arguments[0].value,
                        y : pos.arguments[1].value,
                        z : pos.arguments[2].value,
                    }
                }
                catch (e){
                    throw `[Transformation error]: To build a 3D Object it requires a Size, and Position.`;
                }

                //if all good then add it
                three_ast.body.push(scene_object);
            }
            else if(node.arguments[0].type === 'LightLiteral'){
                var scene_light_object = { 
                    tag : 'SceneLightAlteration',
                    attr : {
                        color : node.name,
                    }
                }
                three_ast.body.push(scene_light_object);
            }
            else
            {
                throw `[Transformation error]: Got an unrecongized ObjectLiteral. Expecting a
                        ShapeLiteral, SceneLiteral, or LightLiteral.`
            }
            //we should add an else that catches anything bad
            //and throws a transformer error
        }
            
    }//end of while loop
    
    return three_ast;
}