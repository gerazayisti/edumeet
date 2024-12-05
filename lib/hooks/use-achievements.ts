"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/api";
import { useUser } from "./use-user";

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: "academic" | "participation" | "progress" | "special";
  icon: string;
  points: number;
  requirements: {
    type: "grade" | "assignments" | "attendance" | "participation";
    threshold: number;
  };
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: "discount" | "feature" | "item" | "special";
  cost: number;
  availability: "always" | "limited" | "seasonal";
  valid_until?: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  claimed_at: string;
  status: "claimed" | "used" | "expired";
}

export function useAchievements() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    try {
      setLoading(true);

      // Load badges
      const { data: badgesData, error: badgesError } = await supabase
        .from("badges")
        .select("*")
        .order("category", { ascending: true });

      if (badgesError) throw badgesError;
      setBadges(badgesData);

      // Load user's achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", user?.id);

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData);

      // Load available rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from("rewards")
        .select("*")
        .or("availability.eq.always,and(availability.eq.limited,valid_until.gt.now)");

      if (rewardsError) throw rewardsError;
      setRewards(rewardsData);

      // Load user's rewards
      const { data: userRewardsData, error: userRewardsError } = await supabase
        .from("user_rewards")
        .select("*")
        .eq("user_id", user?.id);

      if (userRewardsError) throw userRewardsError;
      setUserRewards(userRewardsData);

      // Calculate total points
      const { data: pointsData, error: pointsError } = await supabase.rpc(
        "calculate_user_points",
        { p_user_id: user?.id }
      );

      if (pointsError) throw pointsError;
      setPoints(pointsData || 0);

    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAchievements = async () => {
    try {
      const { data, error } = await supabase.rpc("check_achievements", {
        p_user_id: user?.id,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        await loadAchievements(); // Reload achievements if new ones were earned
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error checking achievements:", error);
      return { data: null, error };
    }
  };

  const claimReward = async (rewardId: string) => {
    try {
      // First check if user has enough points
      const reward = rewards.find((r) => r.id === rewardId);
      if (!reward) throw new Error("Reward not found");

      if (points < reward.cost) {
        throw new Error("Insufficient points");
      }

      // Claim the reward
      const { error } = await supabase.rpc("claim_reward", {
        p_user_id: user?.id,
        p_reward_id: rewardId,
      });

      if (error) throw error;

      // Reload achievements and rewards
      await loadAchievements();

      return { error: null };
    } catch (error) {
      console.error("Error claiming reward:", error);
      return { error };
    }
  };

  const getLeaderboard = async (category?: string) => {
    try {
      const { data, error } = await supabase.rpc("get_leaderboard", {
        p_category: category || null,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return { data: null, error };
    }
  };

  return {
    badges,
    achievements,
    rewards,
    userRewards,
    points,
    loading,
    checkAchievements,
    claimReward,
    getLeaderboard,
    refresh: loadAchievements,
  };
}
