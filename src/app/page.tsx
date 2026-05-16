import { TodoBrowser } from "@/features/todos/todo-browser";
import { loadTodoBootstrap } from "@/lib/todos/bootstrap";
import AuthGate, { } from "@/features/auth/auth-gate"

export const dynamic = "force-dynamic";

export default async function Home() {
  const bootstrap = await loadTodoBootstrap();

  return (
    <AuthGate>
      <TodoBrowser bootstrap={bootstrap} />
    </AuthGate>
  )
}
