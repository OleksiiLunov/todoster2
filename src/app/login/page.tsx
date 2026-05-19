import AuthForm from "@/features/auth/components/auth-form"
import { getServerUser } from "@/lib/auth/server-user";
import { redirect } from "next/navigation";

export default async function Page() {
    if (!await getServerUser()) {
        return (
            <AuthForm mode="login" />
        );
    }    
    redirect("/");
}