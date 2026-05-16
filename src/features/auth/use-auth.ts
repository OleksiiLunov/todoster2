"use client"

import { use } from "react"
import {AuthContext} from "./auth-provider"

export function useAuth(){
    const context = use(AuthContext);
    if (!context){
        throw new Error("Context is null");
    }
    return context;
}