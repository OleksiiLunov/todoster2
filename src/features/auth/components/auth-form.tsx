"use client"

import { useState } from "react";
import Image from "next/image";
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
        <div className="mx-auto mt-10 w-full max-w-md overflow-hidden rounded-md border border-[#e6dccb] bg-[#fffdf7] shadow-lg shadow-[#7c4a24]/10">
            <div className="flex flex-col items-center gap-3 border-b border-[#efe5d2] px-6 py-5 text-center">
                <Image
                    alt="ToDoster"
                    className="h-10 w-auto"
                    height={82}
                    priority
                    src="/branding/logo-full.png"
                    unoptimized
                    width={86}
                />
                <h1 className="text-xl font-semibold text-[#173f2a]">{(mode === "login") ? "Log in" : "Sign up"}</h1>
            </div>
            <form className="py-4 px-6" onSubmit={onSubmit}>
                {mode === "signup" && (
                    <div className="mb-4">
                        <label className="block text-[#4d3a22] font-bold mb-2">Your name</label>
                        <input
                            type="text"
                            name="name"
                            disabled={isSubmitting}
                            placeholder="Enter your name"
                            className="shadow-sm appearance-none border border-[#d7c8b3] rounded w-full py-2 px-3 text-[#173f2a] leading-tight focus:border-[#173f2a] focus:outline-none"
                            onChange={(e) => setName(e.target.value)}
                            required
                        >
                        </input>
                    </div>)
                }
                <div className="mb-4">
                    <label className="block text-[#4d3a22] font-bold mb-2">Your email</label>
                    <input
                        type="text"
                        name="email"
                        placeholder="Enter your email"
                        disabled={isSubmitting}
                        onChange={(e) => setEmail(e.target.value)}
                        className="shadow-sm appearance-none border border-[#d7c8b3] rounded w-full py-2 px-3 text-[#173f2a] leading-tight focus:border-[#173f2a] focus:outline-none"
                        required
                    >
                    </input>
                </div>
                <div className="mb-4">
                    <label className="block text-[#4d3a22] font-bold mb-2">Your password</label>
                    <input
                        type="password"
                        name="password"
                        disabled={isSubmitting}
                        onChange={(e) => setPassword(e.target.value)}
                        className="shadow-sm appearance-none border border-[#d7c8b3] rounded w-full py-2 px-3 text-[#173f2a] leading-tight focus:border-[#173f2a] focus:outline-none"
                        required
                    >
                    </input>
                </div>
                <div className="mb-4">
                    <button
                        type="submit"
                        name="submit"
                        disabled={isSubmitting}
                        className="bg-[#173f2a] text-white py-2 px-4 rounded transition hover:bg-[#225a3d] focus:outline-none"
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
                                <label className="block text-[#4d3a22] mb-2">Already have an account? 
                                <Link
                                    className="ml-1 text-sm font-medium text-[#2f6b3f] underline underline-offset-2 transition hover:text-[#173f2a]"
                                    href="/login"
                                >
                                    Login page
                                </Link></label>
                            ) :
                            (
                                <label className="block text-[#4d3a22] mb-2">Don't have an account yet? 
                                <Link
                                    className="ml-1 text-sm font-medium text-[#2f6b3f] underline underline-offset-2 transition hover:text-[#173f2a]"
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
