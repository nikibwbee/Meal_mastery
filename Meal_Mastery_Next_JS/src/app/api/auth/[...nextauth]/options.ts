import { NextAuthOptions } from "next-auth";
import CredentialsProvider  from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs';


export const  AuthOptions:NextAuthOptions = {

    
    providers:[

CredentialsProvider({

id:"credentials",
name:"Credentials",

credentials:{
    email:{label:"Email", type:"email", placeholder:"Jsmith@gmail.com"},
    password:{label:"Password", type:"password"}
},
async authorize(credentials:any):Promise<any>{

    const user = 
                    {
                        email:"admin3214@gmail.com",
                        password:"1234"
                    }


try
{
console.log('This is authenticaation')

}

catch(error){
    throw new Error(`Error in Authorize : ${error}`);
}

})



    ]
}

