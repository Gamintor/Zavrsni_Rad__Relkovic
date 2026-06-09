import { use } from "react";
import GameScreen from "../_components/GameScreen";

export default function GamePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  return <GameScreen sessionId={sessionId} />;
}
