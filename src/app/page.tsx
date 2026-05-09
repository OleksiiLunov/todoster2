import { TodoBrowser } from "@/app/todo-browser";
import { loadTodoBootstrap } from "@/lib/todos/bootstrap";

export const dynamic = "force-dynamic";

export default async function Home() {
  const bootstrap = await loadTodoBootstrap();

  return <TodoBrowser bootstrap={bootstrap} />;
}
