import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function StayInLoopCard() {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Stay in the loop</CardTitle>
        <CardDescription>
          Get hand-picked stories delivered to your inbox each week. No noise, just signal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3">
          <Input type="email" placeholder="your@email.com" required autoComplete="email" />
          <Button type="submit" className="w-full">Subscribe</Button>
        </form>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        We respect your privacy. Unsubscribe at any time.
      </CardFooter>
    </Card>
  );
}
