"use client";
import { useEffect, useState } from "react";
import { useAchievements } from "@/lib/hooks/use-achievements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/hooks/use-user";

export function AchievementsDisplay() {
  const { user } = useUser();
  const { badges, achievements, rewards, points, loading, checkAchievements, claimReward, getLeaderboard } = useAchievements();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLeaderboard();
  }, [selectedCategory]);

  useEffect(() => {
    // Check for new achievements periodically
    const checkInterval = setInterval(async () => {
      if (!checking) {
        await handleCheckAchievements();
      }
    }, 300000); // Check every 5 minutes

    return () => clearInterval(checkInterval);
  }, [checking]);

  const loadLeaderboard = async () => {
    const { data } = await getLeaderboard(selectedCategory as any);
    if (data) {
      setLeaderboard(data);
    }
  };

  const handleCheckAchievements = async () => {
    try {
      setChecking(true);
      const { data: newAchievements, error } = await checkAchievements();
      
      if (error) throw error;

      if (newAchievements && newAchievements.length > 0) {
        newAchievements.forEach(achievement => {
          const badge = badges.find(b => b.id === achievement.badge_id);
          if (badge) {
            toast({
              title: "New Achievement!",
              description: `You've earned the "${badge.name}" badge!`,
            });
          }
        });
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
      toast({
        title: "Error",
        description: "Failed to check achievements",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleClaimReward = async (rewardId: string, cost: number) => {
    if (points < cost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${cost - points} more points to claim this reward.`,
        variant: "destructive",
      });
      return;
    }

    const { error } = await claimReward(rewardId);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Reward claimed successfully!",
      });
    }
  };

  if (loading) {
    return <div>Loading achievements...</div>;
  }

  return (
    <Tabs defaultValue="achievements" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="achievements">Achievements</TabsTrigger>
        <TabsTrigger value="rewards">Rewards</TabsTrigger>
        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
      </TabsList>

      <TabsContent value="achievements">
        <Card>
          <CardHeader>
            <CardTitle>Your Achievements</CardTitle>
            <CardDescription>
              You have earned {achievements.length} badges and {points} points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {badges.map((badge) => {
                  const earned = achievements.find((a) => a.badge_id === badge.id);
                  return (
                    <Card key={badge.id} className={earned ? "border-primary" : "opacity-75"}>
                      <CardHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{badge.name}</CardTitle>
                          <span className="text-2xl">{badge.icon}</span>
                        </div>
                        <Badge variant={earned ? "default" : "secondary"}>
                          {badge.category}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          {badge.description}
                        </p>
                        <Progress
                          value={earned ? 100 : 0}
                          className="h-2"
                        />
                        {!earned && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {badge.requirements.type === "grade" && `Requires ${badge.requirements.threshold}% grade`}
                            {badge.requirements.type === "assignments" && `Complete ${badge.requirements.threshold} assignments`}
                            {badge.requirements.type === "attendance" && `Maintain ${badge.requirements.threshold * 100}% attendance`}
                            {badge.requirements.type === "participation" && `Achieve ${badge.requirements.threshold * 100}% participation`}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="rewards">
        <Card>
          <CardHeader>
            <CardTitle>Available Rewards</CardTitle>
            <CardDescription>
              You have {points} points to spend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map((reward) => (
                  <Card key={reward.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{reward.name}</CardTitle>
                      <Badge>{reward.type}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {reward.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{reward.cost} points</span>
                        <Button
                          onClick={() => handleClaimReward(reward.id, reward.cost)}
                          disabled={points < reward.cost}
                        >
                          Claim
                        </Button>
                      </div>
                      {reward.availability !== "always" && (
                        <p className="text-xs text-muted-foreground">
                          {reward.availability === "limited" ? "Limited availability" : "Seasonal reward"}
                          {reward.valid_until && ` - Available until ${new Date(reward.valid_until).toLocaleDateString()}`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="leaderboard">
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                onClick={() => setSelectedCategory(undefined)}
              >
                All
              </Button>
              {["academic", "participation", "progress", "special"].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold">#{index + 1}</span>
                      <div>
                        <p className="font-medium">
                          {entry.user_id === user?.id ? "You" : `User ${entry.user_id.slice(0, 8)}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.achievement_count} achievements
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold">{entry.points} points</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
