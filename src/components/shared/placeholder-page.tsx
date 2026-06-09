import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PlaceholderPageProps = {
  module: string;
  phase: string;
};

export function PlaceholderPage({ module, phase }: PlaceholderPageProps) {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-base font-medium">{module}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{phase}</p>
      </CardContent>
    </Card>
  );
}
