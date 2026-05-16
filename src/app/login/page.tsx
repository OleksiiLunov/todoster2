"use client";
import { signInWithEmail, getCurrentUser, signOut } from "../../lib/auth/auth-service";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/features/auth/use-auth";
import { use } from "react";


export default function Page() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState("Not submitted Yet");
    const [currentUser, setCurrentUser] = useState("");

    async function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const result = await signInWithEmail(
            email,
            password).finally(() => setLoading(false));
        if (!result.ok) {
            setResult(`Signin failed: ${result.error}`);
        }
        else {
            setResult("Signin successful!");
        }
        setLoading(false);
    }

    async function onGetCurrentUser() {
        let curUser = await getCurrentUser();
        if (curUser) {
            setCurrentUser(curUser.email || "no user");
        }
    }

    async function onLogOut() {
        const res = await signOut();
        if (!res.ok) {
            alert(res.error);
        }
    }


    return (
        <div>
            <div><h1>UseAuth test: {                
                useAuth().isLoadingAuth? "Loading auth...": useAuth().currentUser?.email || "Not logged in"
            }</h1></div>
            <div><h1>Signup</h1></div>
            <div><form onSubmit={onSubmit}>
                <div><input
                    disabled={loading}
                    name="emailInput"
                    type="email"
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                /></div>
                <div><input
                    disabled={loading}
                    name="passwordInput"
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                /></div>
                <div><button type="submit" disabled={loading}>Sign in</button></div>
            </form></div>
            <div><button
                disabled={loading}
                onClick={() => onGetCurrentUser()}>Get current user</button></div>
            <div>Result: {result}</div>
            <div>Current User: {currentUser}</div>
            <div><button
                disabled={loading}
                onClick={() => onLogOut()}>Logout</button></div>
        </div>
    )
}