"use client"

import { useState } from "react";
import { signInWithEmail, signUpWithEmail } from "@/lib/auth/auth-service";
import { useRouter } from 'next/navigation'
import Link from "next/link";


type AuthFormProps = {
    mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
    const [email, setEmail] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const router = useRouter();

    async function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setErrorMessage("");
        setIsSubmitting(true);

        if (mode === "login") {
            const result = await signInWithEmail(
                email,
                password).finally(() => setIsSubmitting(false));
            if (!result.ok) {
                setErrorMessage(`Signin failed: ${result.error}`);
            }
            else {
                router.push('/');
            }
        }
        else {
            const result = await signUpWithEmail(
                email,
                password,
                name).finally(() => setIsSubmitting(false));
            if (!result.ok) {
                setErrorMessage(`Signup failed: ${result.error}`);
            }
            else {
                router.push('/');
            }
        }
    }

    return (
        <div className="max-w-md mx-auto mt-10 bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="text-2xl py-4 px-6 bg-gray-900 text-white text-center font-bold uppercase">
                <h1>{(mode === "login") ? "Login mode" : "Signup mode"}</h1>
            </div>
            <form className="py-4 px-6" onSubmit={onSubmit}>
                {mode === "signup" && (
                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2">Your name</label>
                        <input
                            type="text"
                            name="name"
                            disabled={isSubmitting}
                            placeholder="Enter your name"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            onChange={(e) => setName(e.target.value)}
                            required
                        >
                        </input>
                    </div>)
                }
                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">Your email</label>
                    <input
                        type="text"
                        name="email"
                        placeholder="Enter your email"
                        disabled={isSubmitting}
                        onChange={(e) => setEmail(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    >
                    </input>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">Your password</label>
                    <input
                        type="password"
                        name="password"
                        disabled={isSubmitting}
                        onChange={(e) => setPassword(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    >
                    </input>
                </div>
                <div className="mb-4">
                    <button
                        type="submit"
                        name="submit"
                        disabled={isSubmitting}
                        className="bg-gray-900 text-white py-2 px-4 rounded hover:bg-gray-800 focus:outline-none focus:shadow-outline"
                    >{mode === "signup" ? "Sign up" : "Log in"}
                    </button>
                </div>
            </form >
            <div className="py-4 px-6">
                <div className="mb-4">
                    <label className="block text-red-500 font-bold mb-2">
                        {errorMessage !== "" && errorMessage}
                    </label>
                </div>
            </div>
            <div className="py-4 px-6">
                <div className="mb-4">
                    
                        {mode === "signup" ?
                            (
                                <label className="block text-grey-700 mb-2">Already have an account? 
                                <Link
                                    className="ml-1 text-sm font-medium text-blue-700 underline underline-offset-2 transition hover:text-blue-900"
                                    href="/login"
                                >
                                    Login page
                                </Link></label>
                            ) :
                            (
                                <label className="block text-grey-700 mb-2">Don't have an account yet? 
                                <Link
                                    className="ml-1 text-sm font-medium text-blue-700 underline underline-offset-2 transition hover:text-blue-900"
                                    href="/signup"
                                >
                                    Signup page
                                </Link></label>
                            )
                        }
                    
                </div>
            </div>
        </div>
    );
}
