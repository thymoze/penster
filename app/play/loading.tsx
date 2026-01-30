import { Card, Wrapper } from "@/components/game/card";

export default function GameLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <Wrapper>
        <Card className="animate-pulse" />
      </Wrapper>
    </div>
  );
}
