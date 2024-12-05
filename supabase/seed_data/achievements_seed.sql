-- Insert initial badges
INSERT INTO badges (name, description, icon, category, requirements) VALUES
-- Academic Badges
('First Steps', 'Complete your first assignment', '📚', 'academic', '{"type": "assignments", "threshold": 1}'),
('Diligent Student', 'Complete 10 assignments', '✏️', 'academic', '{"type": "assignments", "threshold": 10}'),
('Academic Excellence', 'Maintain a high grade average', '🎓', 'academic', '{"type": "grade", "threshold": 90}'),
('Perfect Score', 'Get 100% on any assignment', '💯', 'academic', '{"type": "grade", "threshold": 100}'),

-- Participation Badges
('Early Bird', 'Attend 5 classes on time', '🌅', 'participation', '{"type": "attendance", "threshold": 5}'),
('Active Participant', 'Participate actively in discussions', '🗣️', 'participation', '{"type": "participation", "threshold": 0.8}'),
('Team Player', 'Collaborate in group activities', '🤝', 'participation', '{"type": "participation", "threshold": 0.7}'),
('Perfect Attendance', 'Maintain 100% attendance for a month', '📅', 'participation', '{"type": "attendance", "threshold": 1.0}'),

-- Progress Badges
('Quick Learner', 'Complete course modules ahead of schedule', '🚀', 'progress', '{"type": "progress", "threshold": 1.2}'),
('Consistent Progress', 'Study regularly for 30 days', '📈', 'progress', '{"type": "progress", "threshold": 30}'),
('Milestone Master', 'Complete all module milestones', '🏆', 'progress', '{"type": "progress", "threshold": 1.0}'),
('Growth Mindset', 'Show improvement in grades over time', '🌱', 'progress', '{"type": "progress", "threshold": 0.1}'),

-- Special Badges
('Helping Hand', 'Help other students in discussions', '🤲', 'special', '{"type": "participation", "threshold": 0.9}'),
('Innovation Star', 'Propose creative solutions', '⭐', 'special', '{"type": "custom", "threshold": 1}'),
('Community Builder', 'Foster positive class environment', '🌟', 'special', '{"type": "participation", "threshold": 0.95}'),
('Above & Beyond', 'Complete optional assignments', '🎯', 'special', '{"type": "assignments", "threshold": 15}');

-- Insert initial rewards
INSERT INTO rewards (name, description, cost, type, availability) VALUES
-- Feature Rewards
('Custom Theme', 'Unlock custom themes for your dashboard', 500, 'feature', 'always'),
('Advanced Analytics', 'Access detailed learning analytics', 1000, 'feature', 'always'),
('Priority Support', 'Get priority support for your queries', 2000, 'feature', 'always'),

-- Privilege Rewards
('Assignment Extension', 'Get a 24-hour extension on one assignment', 300, 'privilege', 'always'),
('Extra Credit Opportunity', 'Unlock an extra credit assignment', 800, 'privilege', 'limited'),
('Virtual Study Session', 'One-on-one session with a tutor', 1500, 'privilege', 'limited'),

-- Item Rewards
('Digital Certificate', 'Earn a special achievement certificate', 400, 'item', 'always'),
('Virtual Badge Pack', 'Exclusive profile badges', 600, 'item', 'seasonal'),
('Learning Resources', 'Access premium study materials', 1200, 'item', 'always');
