"use client";
import { signUpWithEmail } from "../../lib/auth/auth-service";
import { useState } from "react";


export default function Page() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState("Not submitted Yet");

    async function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);       
        const result = await signUpWithEmail(
            email,
            password,
            name).finally(() => setLoading(false));
        if (!result.ok) {
            setResult(`Signup failed: ${result.error}`);
        }
        else {
            setResult("Signup successful! Please check your email for confirmation.");
        }
        setLoading(false);
    }

    return (
        <div>
            <div><h1>Signup</h1></div>
            <div><form onSubmit={onSubmit}>
                <div><input
                    disabled={loading}  
                    name="nameInput"
                    type="text"
                    placeholder="Name"
                    onChange={(e) => setName(e.target.value)}
                /></div>
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
                <div><button type="submit" disabled={loading}>Sign Up</button></div>
            </form></div>
            <div>Result: {result}</div>
        </div>
    )
}