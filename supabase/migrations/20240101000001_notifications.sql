-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT notifications_type_check CHECK (type IN ('info', 'achievement', 'warning', 'error'))
);

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'notifications'
        AND policyname = 'Users can view their own notifications'
    ) THEN
        CREATE POLICY "Users can view their own notifications"
            ON notifications FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'notifications'
        AND policyname = 'System can insert notifications'
    ) THEN
        CREATE POLICY "System can insert notifications"
            ON notifications FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- Create function to create achievement notifications
CREATE OR REPLACE FUNCTION create_achievement_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Get badge details
    INSERT INTO notifications (user_id, title, message, type)
    SELECT 
        NEW.user_id,
        'New Achievement!',
        'You''ve earned the "' || b.name || '" badge!',
        'achievement'
    FROM badges b
    WHERE b.id = NEW.badge_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new achievements
DROP TRIGGER IF EXISTS on_achievement_earned ON achievements;
CREATE TRIGGER on_achievement_earned
    AFTER INSERT ON achievements
    FOR EACH ROW
    EXECUTE FUNCTION create_achievement_notification();

-- Create indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(p_user_id UUID, p_notification_ids UUID[])
RETURNS SETOF notifications AS $$
BEGIN
    RETURN QUERY
    UPDATE notifications
    SET read = true
    WHERE user_id = p_user_id
    AND id = ANY(p_notification_ids)
    AND read = false
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
