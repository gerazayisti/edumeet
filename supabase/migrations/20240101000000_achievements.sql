-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('academic', 'participation', 'progress', 'special')),
    requirements JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    progress FLOAT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, badge_id)
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    cost INTEGER NOT NULL CHECK (cost >= 0),
    type TEXT NOT NULL CHECK (type IN ('feature', 'privilege', 'item')),
    availability TEXT NOT NULL CHECK (availability IN ('always', 'limited', 'seasonal')),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_rewards table for claimed rewards
CREATE TABLE IF NOT EXISTS user_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, reward_id)
);

-- Function to calculate user points based on achievements
CREATE OR REPLACE FUNCTION calculate_user_points(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER;
BEGIN
    -- Basic calculation: each achievement is worth 100 points
    -- You can modify this to implement more complex point calculations
    SELECT COUNT(*) * 100
    INTO total_points
    FROM achievements
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(total_points, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award new achievements
CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS SETOF achievements AS $$
DECLARE
    badge_record RECORD;
    new_achievement achievements%ROWTYPE;
    user_stats JSONB;
BEGIN
    -- Get user statistics (this is a placeholder - implement actual stats gathering)
    SELECT jsonb_build_object(
        'assignments_completed', (SELECT COUNT(*) FROM assignments WHERE user_id = p_user_id),
        'attendance_rate', (SELECT COALESCE(AVG(CASE WHEN status = 'present' THEN 1 ELSE 0 END), 0) FROM attendance WHERE user_id = p_user_id),
        'participation_score', (SELECT COALESCE(AVG(participation_score), 0) FROM course_participation WHERE user_id = p_user_id)
    ) INTO user_stats;

    -- Check each badge's requirements
    FOR badge_record IN SELECT * FROM badges
    LOOP
        -- Skip if achievement already earned
        CONTINUE WHEN EXISTS (
            SELECT 1 FROM achievements 
            WHERE user_id = p_user_id AND badge_id = badge_record.id
        );

        -- Check if requirements are met (simplified example)
        -- You should implement more sophisticated requirement checking based on your needs
        IF (
            (badge_record.requirements->>'type' = 'assignments' AND 
             (user_stats->>'assignments_completed')::int >= (badge_record.requirements->>'threshold')::int)
            OR
            (badge_record.requirements->>'type' = 'attendance' AND 
             (user_stats->>'attendance_rate')::float >= (badge_record.requirements->>'threshold')::float)
            OR
            (badge_record.requirements->>'type' = 'participation' AND 
             (user_stats->>'participation_score')::float >= (badge_record.requirements->>'threshold')::float)
        ) THEN
            -- Award new achievement
            INSERT INTO achievements (user_id, badge_id, progress, metadata)
            VALUES (p_user_id, badge_record.id, 1.0, user_stats)
            RETURNING * INTO new_achievement;
            
            RETURN NEXT new_achievement;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim a reward
CREATE OR REPLACE FUNCTION claim_reward(p_user_id UUID, p_reward_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_points INTEGER;
    reward_cost INTEGER;
BEGIN
    -- Get user's current points
    SELECT calculate_user_points(p_user_id) INTO user_points;
    
    -- Get reward cost
    SELECT cost INTO reward_cost
    FROM rewards
    WHERE id = p_reward_id
    AND (valid_until IS NULL OR valid_until > NOW());
    
    -- Check if user has enough points and reward exists
    IF reward_cost IS NULL THEN
        RAISE EXCEPTION 'Reward not found or expired';
    END IF;
    
    IF user_points < reward_cost THEN
        RAISE EXCEPTION 'Insufficient points';
    END IF;
    
    -- Claim the reward
    INSERT INTO user_rewards (user_id, reward_id)
    VALUES (p_user_id, p_reward_id);
    
    RETURN TRUE;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Reward already claimed';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error claiming reward: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(category TEXT DEFAULT NULL)
RETURNS TABLE (
    user_id UUID,
    points INTEGER,
    achievement_count INTEGER,
    last_achievement_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH user_achievements AS (
        SELECT 
            a.user_id,
            COUNT(*) as achievement_count,
            MAX(a.earned_at) as last_achievement_at
        FROM achievements a
        LEFT JOIN badges b ON a.badge_id = b.id
        WHERE category IS NULL OR b.category = category
        GROUP BY a.user_id
    )
    SELECT 
        ua.user_id,
        calculate_user_points(ua.user_id) as points,
        ua.achievement_count,
        ua.last_achievement_at
    FROM user_achievements ua
    ORDER BY points DESC, achievement_count DESC, last_achievement_at DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
